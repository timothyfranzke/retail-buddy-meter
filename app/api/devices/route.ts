import { NextResponse } from 'next/server';

// In-memory storage for registered devices (will reset on server restart)
// For a production app, you would use a database instead
let devices: Array<{
  id: string;
  ip: string;
  position: {
    latitude: number;
    longitude: number;
  };
  status: string;
  lastUpdated: string;
}> = [];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate incoming data
    if (!data.id || !data.ip || !data.status || !data.position) {
      return NextResponse.json({ 
        error: 'Missing required fields (id, ip, position, status)' 
      }, { status: 400 });
    }
    
    if (typeof data.position !== 'object' || 
        data.position.latitude === undefined || 
        data.position.longitude === undefined) {
      return NextResponse.json({ 
        error: 'Position must include latitude and longitude' 
      }, { status: 400 });
    }
    
    // Check if device already exists by ID
    const existingDeviceIndex = devices.findIndex(device => device.id === data.id);
    const currentTime = new Date().toISOString();
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      devices[existingDeviceIndex] = {
        ...devices[existingDeviceIndex],
        ip: data.ip,
        position: data.position,
        status: data.status,
        lastUpdated: currentTime
      };
    } else {
      // Register new device
      devices.push({
        id: data.id,
        ip: data.ip,
        position: data.position,
        status: data.status,
        lastUpdated: currentTime
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: existingDeviceIndex >= 0 ? 'Device updated' : 'Device registered' 
    });
  } catch (error) {
    console.error('Error processing device registration:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ devices });
}
