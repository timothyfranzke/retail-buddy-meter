"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface DeviceApiResponse {
  devices: Device[];
}

export default function DeviceDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      const data: DeviceApiResponse = await response.json();
      setDevices(data.devices || []);
      setError(null);
    } catch (err) {
      setError('Error fetching devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    
    // Poll for updates every 5 seconds
    const intervalId = setInterval(fetchDevices, 5000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Device Dashboard
            </h1>
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              View Data Points
            </Link>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and track all registered Raspberry Pi devices
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : error ? (
          <div className="p-4 mb-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            <p>{error}</p>
            <button 
              onClick={fetchDevices}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              Retry
            </button>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
            <p className="text-gray-700 dark:text-gray-300">No devices registered yet.</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Devices will appear once they register with the API.</p>
            <button 
              onClick={fetchDevices}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Check Again
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Registered Devices</h2>
              <button 
                onClick={fetchDevices}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div key={device.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                  <Link href={`/devices/${device.id}`} className="block">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          Device: {device.id.substring(0, 8)}...
                        </h3>
                      </div>
                      <span className="text-sm px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {device.status}
                      </span>
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">IP Address:</span>
                      <p className="text-gray-800 dark:text-gray-200">{device.ip}</p>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Location:</span>
                      <p className="text-gray-800 dark:text-gray-200">
                        {device.position.latitude.toFixed(6)}, {device.position.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Last Update:</span>
                      <p className="text-gray-800 dark:text-gray-200">{formatTimestamp(device.lastUpdated)}</p>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <Link 
                        href={`/?deviceId=${device.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Data
                      </Link>
                      <Link 
                        href={`/devices/${device.id}`}
                        className="text-green-600 dark:text-green-400 hover:underline text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-12 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Raspberry Pi Device Dashboard | {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
