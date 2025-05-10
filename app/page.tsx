"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface DataPoint {
  value: number;
  timestamp: string;
}

interface ApiResponse {
  dataPoints: DataPoint[];
}

// Component that safely uses searchParams
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>}>
      <DataPointsContent />
    </Suspense>
  );
}

// Component that safely uses searchParams
function DataPointsContent() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const deviceId = searchParams.get('deviceId');
  
  const fetchData = async () => {
    try {
      // Add deviceId to fetch URL if it exists
      const url = deviceId ? `/api/data?deviceId=${deviceId}` : '/api/data';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: ApiResponse = await response.json();
      setDataPoints(data.dataPoints || []);
      setError(null);
    } catch (err) {
      setError('Error fetching data. Make sure the background service is running.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Poll for updates every 5 seconds
    const intervalId = setInterval(fetchData, 5000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [deviceId]); // Re-run when deviceId changes

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <>
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Raspberry Pi Test Application
            </h1>
            <Link 
              href="/devices"
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              View Devices
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {deviceId ? 
              `Displaying data from device: ${deviceId.substring(0, 8)}...` : 
              'Displaying random numbers sent by all background services'}
          </p>
          {deviceId && (
            <div className="mt-2">
              <Link 
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                ← Back to all data points
              </Link>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : error ? (
          <div className="p-4 mb-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            <p>{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
              Retry
            </button>
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
            <p className="text-gray-700 dark:text-gray-300">No data points received yet. Waiting for the background service...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Data will appear once the background service sends information.</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Check Again
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Data Points</h2>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Refresh
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Random Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {dataPoints.slice().reverse().map((data, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-gray-200 font-medium">{data.value}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{formatTimestamp(data.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          <footer className="mt-12 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Raspberry Pi Test Application | {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </>
  );
}
