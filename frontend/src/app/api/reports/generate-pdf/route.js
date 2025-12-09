import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { verifyToken } from '../../../../lib/jwt';

export async function POST(request) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const reportData = await request.json();
    
    // Get user info (firstName/lastName used in this project)
    const user = await User.findById(decoded.userId).select('firstName lastName email dateOfBirth');
    // Compute displayName for PDF (User model has virtual `fullName`)
    if (user) {
      user.displayName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    
    // Require pdfkit at runtime to avoid bundling AFM data into .next (prevents ENOENT)
    const PDFDocument = eval("require")('pdfkit');

    // Generate PDF
    const pdfBuffer = await generatePDF(reportData, user, PDFDocument);
    
    // Return PDF as downloadable
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportData.fileName || 'report'}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF: ' + error.message }, { status: 500 });
  }
}

async function generatePDF(reportData, user, PDFDocument) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with Courier (built-in font)
      const doc = new PDFDocument({
        bufferPages: true,
        margin: 50,
        size: 'A4'
      });

      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => {
        console.error('PDF generation error:', err);
        reject(err);
      });

      // Header for content pages
      drawHeader(doc, reportData, user);
      
      // Patient Info Section
      drawPatientInfo(doc, user, reportData);
      
      // Report Overview
      drawReportOverview(doc, reportData);
      
      // Glucose Section
      if (reportData.glucose && reportData.glucose.readings && reportData.glucose.readings.length > 0) {
        doc.addPage();
        drawGlucoseSection(doc, reportData.glucose);
      }
      
      // Medication Section
      if (reportData.medications && reportData.medications.length > 0) {
        doc.addPage();
        drawMedicationSection(doc, reportData.medications);
      }
      
      // Statistics Section
      doc.addPage();
      drawStatisticsSection(doc, reportData);
      
      // Recommendations
      drawRecommendations(doc, reportData);
      
      // Footer
      drawFooter(doc);
      
      doc.end();
    } catch (error) {
      console.error('Error in generatePDF:', error);
      reject(error);
    }
  });
}

function drawHeader(doc, reportData, user) {
  // Main title
  doc
    .fontSize(22)
    .font('Times-Bold')
    .fillColor('#0F172A')
    .text(reportData.title || 'Health Report', { align: 'center' })
    .moveDown(0.2);

  // Patient name under the title
  const patientName = user?.displayName || reportData.userName || 'Patient';
  doc
    .fontSize(11)
    .font('Times-Roman')
    .fillColor('#475569')
    .text(`Patient: ${patientName}`, { align: 'center' })
    .moveDown(0.2);

  // Subtitle with period and generated date
  doc
    .fontSize(10)
    .font('Times-Roman')
    .fillColor('#6B7280')
    .text(`${reportData.period || 'N/A'} · Generated on ${reportData.generatedDate || ''}`, { align: 'center' })
    .moveDown(0.8);

  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke('#E5E7EB')
    .moveDown(1);
}

function drawPatientInfo(doc, user, reportData) {
  doc
    .fontSize(12)
    .font('Times-Bold')
    .text('Patient Information', { underline: true })
    .moveDown(0.3);
  
  const infoX = 60;
  const valueX = 200;
  
  doc
    .fontSize(10)
    .font('Times-Roman');
  
  // Name
  doc
    .font('Times-Bold')
    .text('Name:', infoX, doc.y, { width: 130 })
    .font('Times-Roman')
    .text(user?.displayName || 'N/A', valueX, doc.y - 12);
  
  doc.moveDown(0.8);
  
  // Email
  doc
    .font('Times-Bold')
    .text('Email:', infoX, doc.y, { width: 130 })
    .font('Times-Roman')
    .text(user?.email || 'N/A', valueX, doc.y - 12);
  
  doc.moveDown(0.8);
  
  // Date of Birth
  if (user?.dateOfBirth) {
    doc
      .font('Times-Bold')
      .text('Date of Birth:', infoX, doc.y, { width: 130 })
      .font('Times-Roman')
      .text(new Date(user.dateOfBirth).toLocaleDateString(), valueX, doc.y - 12);
    doc.moveDown(0.8);
  }
  
  // Report Type
  doc
    .font('Times-Bold')
    .text('Report Type:', infoX, doc.y, { width: 130 })
    .font('Times-Roman')
    .text(reportData.type || 'N/A', valueX, doc.y - 12);
  
  doc.moveDown(1.5);
  
  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke('#CCCCCC')
    .moveDown(1);
}

function drawReportOverview(doc, reportData) {
  if (!reportData.stats) return;
  
  doc
    .fontSize(14)
    .font('Times-Bold')
    .fillColor('#0F172A')
    .text('Overview', { underline: true })
    .moveDown(0.6);
  
  const stats = reportData.stats;
  const boxWidth = 120;
  const boxHeight = 72;
  const startX = 60;
  const startY = doc.y;
  const spacing = 15;
  
  // Box 1: Total Readings
  drawStatBox(doc, startX, startY, boxWidth, boxHeight, 'Total Readings', stats.totalReadings || 0, '#0EA5A4');
  
  // Box 2: Completion Rate
  drawStatBox(doc, startX + boxWidth + spacing, startY, boxWidth, boxHeight, 'Completion Rate', `${stats.completionRate || 0}%`, '#2563EB');
  
  // Box 3: Medication Count
  drawStatBox(doc, startX + (boxWidth + spacing) * 2, startY, boxWidth, boxHeight, 'Medications', stats.medicationCount || 0, '#F97316');
  
  // Box 4: Adherence
  drawStatBox(doc, startX + (boxWidth + spacing) * 3, startY, boxWidth, boxHeight, 'Adherence', `${stats.medicationAdherence || 0}%`, '#7C3AED');
  
  doc.y = startY + boxHeight + 18;
  doc.moveDown(0.5);
  
  // Horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke('#CCCCCC')
    .moveDown(1);
}

function drawStatBox(doc, x, y, width, height, label, value, color) {
  // Rounded box with colored header strip
  doc.save();
  doc.roundedRect(x, y, width, height, 6).lineWidth(0.5).stroke('#E6E7E9');
  doc.rect(x, y, width, 20).fill(color);

  // Label (white on colored strip)
  doc
    .fontSize(9)
    .font('Times-Bold')
    .fillColor('#FFFFFF')
    .text(label, x, y + 5, { width: width, align: 'center' });

  // Value (large)
  doc
    .fontSize(18)
    .font('Times-Bold')
    .fillColor('#0F172A')
    .text(value.toString(), x, y + 30, { width: width, align: 'center' });
  doc.restore();
}

// cover removed: keep the PDF focused on content pages

function drawGlucoseSection(doc, glucoseData) {
  doc
    .fontSize(14)
    .font('Times-Bold')
    .fillColor('#0F172A')
    .text('Glucose Monitoring', { underline: true })
    .moveDown(0.5);
  
  if (glucoseData.summary) {
    const summary = glucoseData.summary;
    const infoX = 60;
    const valueX = 220;
    
    doc
      .fontSize(10)
      .font('Times-Roman');
    
    // Assessment
    doc
      .font('Times-Bold')
      .text('Assessment:', infoX, doc.y, { width: 150 })
      .font('Times-Roman')
      .fillColor(getAssessmentColor(summary.assessment))
      .text(summary.assessment, valueX, doc.y - 12);
    
    doc.moveDown(0.8);
    
    // Average Value
    doc
      .fillColor('#000000')
      .font('Times-Bold')
      .text('Average Value:', infoX, doc.y, { width: 150 })
      .font('Times-Roman')
      .text(`${summary.averageValue} mg/dL`, valueX, doc.y - 12);
    
    doc.moveDown(0.8);
    
    // Min/Max
    doc
      .font('Times-Bold')
      .text('Range:', infoX, doc.y, { width: 150 })
      .font('Times-Roman')
      .text(`${summary.minValue} - ${summary.maxValue} mg/dL`, valueX, doc.y - 12);
    
    doc.moveDown(0.8);
    
    // Time in Range
    doc
      .font('Times-Bold')
      .text('Time in Range (70-140):', infoX, doc.y, { width: 150 })
      .font('Times-Roman')
      .text(`${summary.timeInRange.toFixed(1)}%`, valueX, doc.y - 12);
    
    doc.moveDown(0.8);
    
    // High Readings
    doc
      .font('Times-Bold')
      .text('High Readings (>140):', infoX, doc.y, { width: 150 })
      .font('Times-Roman')
      .text(summary.highReadings.toString(), valueX, doc.y - 12);
    
    doc.moveDown(0.8);
    
    // Low Readings
    doc
      .font('Times-Bold')
      .text('Low Readings (<70):', infoX, doc.y, { width: 150 })
      .font('Times-Roman')
      .text(summary.lowReadings.toString(), valueX, doc.y - 12);
    
    doc.moveDown(1);
  }
  
  // Recent readings table
  if (glucoseData.readings && glucoseData.readings.length > 0) {
    doc
      .fontSize(11)
      .font('Times-Bold')
      .text('Recent Readings', { underline: true })
      .moveDown(0.5);
    
    drawTable(doc, ['Date', 'Time', 'Value (mg/dL)', 'Status'], 
      glucoseData.readings.slice(0, 15).map(r => {
        const date = new Date(r.timestamp);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          r.value?.toString() || 'N/A',
          getGlucoseStatus(r.value)
        ];
      })
    );
  }
}

function drawMedicationSection(doc, medications) {
  doc
    .fontSize(14)
    .font('Times-Bold')
    .fillColor('#0F172A')
    .text('Medications', { underline: true })
    .moveDown(0.5);
  
  const medData = medications.map(m => {
    // Normalize dose: could be object, number, or string
    let doseVal = m?.dose?.amount ? `${m.dose.amount} ${m.dose.unit || ''}` : (m.dosage ?? 'N/A');
    if (typeof doseVal !== 'string') doseVal = String(doseVal);
    doseVal = doseVal.trim();

    // Normalize frequency
    let frequencyVal = m?.frequency?.timesPerDay ? `${m.frequency.timesPerDay}x/day` : (m.frequency?.times ?? 'As needed');
    if (typeof frequencyVal !== 'string') frequencyVal = String(frequencyVal);
    frequencyVal = frequencyVal.trim();

    const adherence = m.adherence ? `${Math.round(m.adherence)}%` : 'N/A';

    return [
      m.name || 'Unknown',
      doseVal || 'N/A',
      frequencyVal || 'As needed',
      adherence,
      m.status || 'Active'
    ];
  });
  
  drawTable(doc, ['Medication', 'Dose', 'Frequency', 'Adherence', 'Status'], medData);
}

function drawStatisticsSection(doc, reportData) {
  doc
    .fontSize(14)
    .font('Times-Bold')
    .fillColor('#0F172A')
    .text('Detailed Statistics', { underline: true })
    .moveDown(0.5);
  
  if (reportData.stats) {
    const stats = reportData.stats;
    doc
      .fontSize(10)
      .font('Times-Roman');
    
    const items = [
      ['Total Glucose Readings', (stats.totalReadings || 0).toString()],
      ['Data Quality', stats.dataQuality || 'N/A'],
      ['Medication Count', (stats.medicationCount || 0).toString()],
      ['Overall Medication Adherence', `${stats.medicationAdherence || 0}%`],
      ['Completion Rate', `${stats.completionRate || 0}%`]
    ];
    
    items.forEach((item, index) => {
      if (index > 0) doc.moveDown(0.3);
      doc
        .font('Times-Bold')
        .text(`${item[0]}:`, 60)
        .font('Times-Roman')
        .text(item[1], 220, doc.y - 12);
    });
  }
}

function drawRecommendations(doc, reportData) {
  doc.moveDown(1);
  doc
    .fontSize(12)
    .font('Times-Bold')
    .text('Recommendations', { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(10)
    .font('Times-Roman');

  const recommendations = generateRecommendations(reportData);
  recommendations.forEach((rec, index) => {
    doc
      .fontSize(9)
      .text(`• ${rec}`, { align: 'left' })
      .moveDown(0.3);
  });

}

function drawFooter(doc) {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.switchToPage(i - 1);
    
    doc
      .fontSize(8)
      .fillColor('#9CA3AF')
      .font('Times-Roman')
      .text(
        `Page ${i} of ${pageCount}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      )
      .text(
        'This report is generated for health monitoring purposes and should be reviewed by a healthcare provider.',
        50,
        doc.page.height - 20,
        { align: 'center', width: 500 }
      );
  }
}

function drawTable(doc, headers, rows) {
  const startX = 60;
  const startY = doc.y;
  const rowHeight = 20;
  const colWidths = [110, 90, 90, 90, 80];
  const headerColor = '#2563EB';
  
  doc.fontSize(9);
  
  // Draw header
  doc.fillColor(headerColor).rect(startX, startY, 500, rowHeight).fill();
  
  doc.fillColor('#FFFFFF').font('Times-Bold');
  let currentX = startX + 5;
  headers.forEach((header, i) => {
    doc.text(header, currentX, startY + 4, { width: colWidths[i] - 10 });
    currentX += colWidths[i];
  });
  
  // Draw rows
  doc.fillColor('#0F172A').font('Times-Roman');
  let currentY = startY + rowHeight;
  
  rows.forEach((row, rowIndex) => {
    if (currentY > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
    }
    
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.fillColor('#F8FAFC').rect(startX, currentY, 500, rowHeight).fill();
    }
    
    doc.fillColor('#0F172A').font('Times-Roman');
    currentX = startX + 5;
    row.forEach((cell, i) => {
      doc.text(cell.toString(), currentX, currentY + 4, { width: colWidths[i] - 10 });
      currentX += colWidths[i];
    });
    
    currentY += rowHeight;
  });
  
  doc.y = currentY;
  doc.moveDown(0.5);
}

function getGlucoseStatus(value) {
  if (!value) return 'N/A';
  if (value < 70) return 'Low';
  if (value <= 140) return 'Normal';
  return 'High';
}

function getAssessmentColor(assessment) {
  switch (assessment) {
    case 'Excellent Control':
      return '#4CAF50';
    case 'Good Control':
      return '#8BC34A';
    case 'Fair Control':
      return '#FF9800';
    case 'Poor Control':
      return '#F44336';
    default:
      return '#000000';
  }
}

function generateRecommendations(reportData) {
  const recommendations = [];
  
  if (reportData.glucose && reportData.glucose.summary) {
    const summary = reportData.glucose.summary;
    
    if (summary.timeInRange >= 80) {
      recommendations.push('Excellent glucose control! Continue your current diabetes management plan.');
    } else if (summary.timeInRange >= 70) {
      recommendations.push('Good glucose control. Consider reviewing meal timing and medication schedule.');
    } else if (summary.timeInRange >= 50) {
      recommendations.push('Glucose control needs improvement. Consult your healthcare provider about adjustments.');
    } else {
      recommendations.push('Poor glucose control detected. Schedule an appointment with your doctor for medication adjustments.');
    }
    
    if (summary.highReadings > summary.totalReadings * 0.2) {
      recommendations.push('High glucose readings are frequent. Review carbohydrate intake and meal portions.');
    }
    
    if (summary.lowReadings > 0) {
      recommendations.push('Low glucose episodes detected. Ensure you have fast-acting carbohydrates available.');
    }
  }
  
  if (reportData.stats && reportData.stats.medicationAdherence < 80) {
    recommendations.push('Medication adherence is below 80%. Set daily reminders to take medications on time.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring your glucose and medications regularly.');
    recommendations.push('Maintain a healthy lifestyle with balanced diet and regular exercise.');
    recommendations.push('Schedule regular check-ups with your healthcare provider.');
  }
  
  return recommendations;
}
