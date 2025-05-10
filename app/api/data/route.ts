import { NextResponse } from 'next/server';

// In-memory storage for data points (will reset on server restart)
// For a production app, you would use a database instead
let dataPoints: Array<{
  value: number, 
  timestamp: string,
  deviceId?: string  // Optional to maintain backward compatibility
}> = [];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate incoming data
    if (!data.value || !data.timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Add new data point to our collection
    dataPoints.push({
      value: data.value,
      timestamp: data.timestamp,
      deviceId: data.deviceId // Associate data with device if provided
    });
    
    // Only keep the most recent 100 data points
    // Increased from 50 to 100 to handle multiple devices
    if (dataPoints.length > 100) {
      dataPoints = dataPoints.slice(-100);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing data:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  // Extract potential query parameter for device ID filtering
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  
  // If deviceId is provided, filter data points for that device
  if (deviceId) {
    const filteredDataPoints = dataPoints.filter(point => point.deviceId === deviceId);
    return NextResponse.json({ dataPoints: filteredDataPoints });
  }
  
  // Otherwise, return all data points
  return NextResponse.json({ dataPoints });
}
