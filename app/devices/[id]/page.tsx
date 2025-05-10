"use client";
import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

interface DevicePosition {
  latitude: number;
  longitude: number;
}

interface Device {
  id: string;
  ip: string;
  position: DevicePosition;
  status: string;
  lastUpdated: string;
}

interface DataPoint {
  value: number;
  timestamp: string;
  deviceId?: string;
}

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

// Default map center (will be overridden by device position)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

export default function DeviceDetails({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise
  const unwrappedParams = use(params);
  const [device, setDevice] = useState<Device | null>(null);
  const [deviceData, setDeviceData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState<boolean>(false);

  // Use a placeholder API key. In a production app, you should use environment variables.
  // Note: For this demo, you'll need to replace this with a real Google Maps API key
  const googleMapsApiKey = "YOUR_GOOGLE_MAPS_API_KEY";

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get status color based on device status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-purple-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status text color based on device status
  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'text-green-700 bg-green-100 dark:text-green-100 dark:bg-green-800';
      case 'idle':
        return 'text-blue-700 bg-blue-100 dark:text-blue-100 dark:bg-blue-800';
      case 'processing':
        return 'text-purple-700 bg-purple-100 dark:text-purple-100 dark:bg-purple-800';
      case 'warning':
        return 'text-yellow-700 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-800';
      case 'error':
        return 'text-red-700 bg-red-100 dark:text-red-100 dark:bg-red-800';
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-100 dark:bg-gray-800';
    }
  };

  const fetchDevice = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Failed to fetch device');
      }
      
      const data = await response.json();
      const foundDevice = data.devices.find((d: Device) => d.id === unwrappedParams.id);
      
      if (!foundDevice) {
        throw new Error('Device not found');
      }
      
      setDevice(foundDevice);
      
      // Also fetch the device's data points
      const dataResponse = await fetch(`/api/data?deviceId=${unwrappedParams.id}`);
      if (dataResponse.ok) {
        const dataResult = await dataResponse.json();
        setDeviceData(dataResult.dataPoints || []);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching device details');
      console.error('Error fetching device:', err);
    } finally {
      setLoading(false);
    }
  }, [unwrappedParams.id]);

  useEffect(() => {
    fetchDevice();
    
    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchDevice, 10000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchDevice]);

  const handleMarkerClick = () => {
    setShowInfoWindow(true);
  };

  const handleInfoWindowClose = () => {
    setShowInfoWindow(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Device Details
            </h1>
            <Link 
              href="/devices"
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Back to Devices
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : error ? (
          <div className="p-4 mb-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            <p>{error}</p>
            <button 
              onClick={fetchDevice}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              Retry
            </button>
          </div>
        ) : device ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device Info Card */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Device ID
                  </h2>
                </div>
                
                <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm text-gray-800 dark:text-gray-200 overflow-auto">
                  {device.id}
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusTextColor(device.status)}`}>
                      {device.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</h3>
                    <p className="mt-1 text-gray-800 dark:text-gray-200">{device.ip}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location Coordinates</h3>
                    <p className="mt-1 text-gray-800 dark:text-gray-200">
                      {device.position.latitude.toFixed(6)}, {device.position.longitude.toFixed(6)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Update</h3>
                    <p className="mt-1 text-gray-800 dark:text-gray-200">{formatTimestamp(device.lastUpdated)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map and Data Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Location</h2>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <LoadScript googleMapsApiKey={googleMapsApiKey}>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={{
                          lat: device.position.latitude,
                          lng: device.position.longitude
                        }}
                        zoom={14}
                      >
                        <Marker
                          position={{
                            lat: device.position.latitude,
                            lng: device.position.longitude
                          }}
                          onClick={handleMarkerClick}
                        >
                          {showInfoWindow && (
                            <InfoWindow
                              position={{
                                lat: device.position.latitude,
                                lng: device.position.longitude
                              }}
                              onCloseClick={handleInfoWindowClose}
                            >
                              <div className="p-2">
                                <p className="font-semibold">Device: {device.id.substring(0, 8)}...</p>
                                <p>Status: {device.status}</p>
                                <p>Last Updated: {formatTimestamp(device.lastUpdated)}</p>
                              </div>
                            </InfoWindow>
                          )}
                        </Marker>
                      </GoogleMap>
                    </LoadScript>
                  </div>
                </div>
              </div>
              
              {/* Recent Data */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Data</h2>
                  {deviceData.length === 0 ? (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No data points available for this device
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {deviceData.slice().reverse().slice(0, 10).map((data, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200 font-medium">{data.value}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{formatTimestamp(data.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mt-4 text-right">
                    <Link 
                      href={`/?deviceId=${device.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      View All Data Points
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
            <p className="text-gray-700 dark:text-gray-300">Device not found</p>
            <Link
              href="/devices"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Devices
            </Link>
          </div>
        )}
        
        <footer className="mt-12 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Raspberry Pi Device Dashboard | {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
