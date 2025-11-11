import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Report from '../../../models/Report';
import GlucoseReading from '../../../models/GlucoseReading';
import MedicationLog from '../../../models/MedicationLog';
import { verifyToken } from '../../../lib/jwt';

export async function GET(request) {
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

    const reports = await Report.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { 
      type,
      periodType,
      customStartDate,
      customEndDate
    } = await request.json();
    
    if (!type || !periodType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate date range
    let startDate, endDate;
    const now = new Date();
    
    switch (periodType) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid period type' }, { status: 400 });
    }

    // Generate report data
    const reportData = await generateReportData(decoded.userId, type, startDate, endDate);

    const report = new Report({
      userId: decoded.userId,
      title: getReportTitle(type, periodType),
      type,
      period: {
        startDate,
        endDate,
        label: getPeriodLabel(periodType, startDate, endDate)
      },
      data: reportData,
      status: 'completed',
      generatedAt: new Date(),
      pages: Math.ceil(Object.keys(reportData).length / 5), // Rough estimate
      fileSize: 1024 * 1024 * 2 // 2MB estimate
    });

    await report.save();

    return NextResponse.json({ 
      message: 'Report generated successfully',
      report: report.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateReportData(userId, type, startDate, endDate) {
  const data = {};

  if (type === 'comprehensive' || type === 'glucose') {
    // Get glucose statistics
    const glucoseReadings = await GlucoseReading.find({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 });

    if (glucoseReadings.length > 0) {
      const values = glucoseReadings.map(r => r.value);
      const inRange = glucoseReadings.filter(r => r.value >= 70 && r.value <= 140).length;
      
      data.glucoseStats = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        timeInRange: (inRange / glucoseReadings.length) * 100,
        readings: glucoseReadings.length,
        lowReadings: glucoseReadings.filter(r => r.value < 70).length,
        highReadings: glucoseReadings.filter(r => r.value > 140).length
      };
    }
  }

  if (type === 'comprehensive' || type === 'medication') {
    // Get medication adherence
    const adherenceData = await MedicationLog.getAdherenceRate(userId, 30);
    if (adherenceData.length > 0) {
      data.medicationStats = adherenceData[0];
    }
  }

  if (type === 'comprehensive') {
    // Generate insights
    data.insights = generateInsights(data.glucoseStats, data.medicationStats);
  }

  return data;
}

function generateInsights(glucoseStats, medicationStats) {
  const insights = [];

  if (glucoseStats) {
    if (glucoseStats.timeInRange >= 70) {
      insights.push({
        type: 'positive',
        message: `Excellent glucose control with ${glucoseStats.timeInRange.toFixed(1)}% time in range`,
        severity: 'low'
      });
    } else if (glucoseStats.timeInRange >= 50) {
      insights.push({
        type: 'warning',
        message: `Glucose control needs improvement. Current time in range: ${glucoseStats.timeInRange.toFixed(1)}%`,
        severity: 'medium'
      });
    } else {
      insights.push({
        type: 'critical',
        message: `Poor glucose control detected. Time in range: ${glucoseStats.timeInRange.toFixed(1)}%`,
        severity: 'high'
      });
    }
  }

  if (medicationStats) {
    if (medicationStats.adherenceRate >= 90) {
      insights.push({
        type: 'positive',
        message: `Excellent medication adherence: ${medicationStats.adherenceRate.toFixed(1)}%`,
        severity: 'low'
      });
    } else if (medicationStats.adherenceRate >= 70) {
      insights.push({
        type: 'warning',
        message: `Medication adherence could be improved: ${medicationStats.adherenceRate.toFixed(1)}%`,
        severity: 'medium'
      });
    }
  }

  return insights;
}

function getReportTitle(type, periodType) {
  const typeNames = {
    comprehensive: 'Comprehensive Health Report',
    glucose: 'Glucose Monitoring Report',
    medication: 'Medication Adherence Report',
    lifestyle: 'Lifestyle & Activity Report'
  };
  
  const periodNames = {
    week: 'Weekly',
    month: 'Monthly',
    quarter: 'Quarterly',
    year: 'Annual',
    custom: 'Custom Period'
  };
  
  return `${periodNames[periodType]} ${typeNames[type]}`;
}

function getPeriodLabel(periodType, startDate, endDate) {
  switch (periodType) {
    case 'week':
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    case 'month':
      return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'quarter':
      const quarter = Math.floor(startDate.getMonth() / 3) + 1;
      return `Q${quarter} ${startDate.getFullYear()}`;
    case 'year':
      return startDate.getFullYear().toString();
    case 'custom':
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    default:
      return 'Unknown Period';
  }
}
