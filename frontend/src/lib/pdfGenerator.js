/**
 * PDF Report Generator
 * Generates comprehensive health reports as PDFs
 */

export const generatePDFReport = async (reportData) => {
  try {
    // Call the backend API to generate PDF
    const response = await fetch('/api/reports/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Get the blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.fileName || 'health-report'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const createReportPayload = (reportType, glucoseData, medicationData, periodLabel, user) => {
  const now = new Date();
  
  return {
    type: reportType,
    title: getReportTitle(reportType),
    period: periodLabel,
    generatedDate: now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    generatedTime: now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }),
    userName: user?.displayName || (user?.firstName || user?.lastName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : user?.name) || 'Patient',
    userEmail: user?.email,
    fileName: `${reportType}-report-${now.getTime()}`,
    
    // Glucose data
    glucose: {
      readings: glucoseData?.readings || [],
      stats: glucoseData?.stats || {},
      summary: getGlucoseSummary(glucoseData?.readings || [], glucoseData?.stats || {})
    },
    
    // Medication data
    medications: medicationData || [],
    
    // Comprehensive stats
    stats: generateStats(glucoseData?.readings || [], medicationData || [])
  };
};

const getReportTitle = (type) => {
  const titles = {
    comprehensive: 'Comprehensive Health Report',
    glucose: 'Glucose Monitoring Report',
    medication: 'Medication Adherence Report',
    lifestyle: 'Lifestyle & Activity Report'
  };
  return titles[type] || 'Health Report';
};

const getGlucoseSummary = (readings, stats) => {
  const totalReadings = readings.length;
  const averageValue = stats.average || 0;
  const minValue = stats.min || 0;
  const maxValue = stats.max || 0;
  const timeInRange = stats.timeInRange || 0;
  
  let assessment = 'Good Control';
  if (timeInRange < 50) assessment = 'Poor Control';
  else if (timeInRange < 70) assessment = 'Fair Control';
  else if (timeInRange >= 80) assessment = 'Excellent Control';
  
  return {
    totalReadings,
    averageValue: Math.round(averageValue),
    minValue: Math.round(minValue),
    maxValue: Math.round(maxValue),
    timeInRange,
    assessment,
    highReadings: stats.highReadings || 0,
    lowReadings: stats.lowReadings || 0
  };
};

const generateStats = (readings, medications) => {
  const totalReadings = readings.length;
  const completionRate = Math.min(100, Math.round((totalReadings / 30) * 100)); // Assume 30 days
  const medicationAdherence = medications.length > 0 
    ? Math.round(medications.reduce((sum, m) => sum + (m.adherence || 0), 0) / medications.length)
    : 0;
  
  return {
    totalReadings,
    completionRate,
    medicationCount: medications.length,
    medicationAdherence,
    dataQuality: totalReadings > 20 ? 'High' : totalReadings > 10 ? 'Moderate' : 'Low'
  };
};
