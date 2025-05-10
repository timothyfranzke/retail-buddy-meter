const axios = require('axios');
const cron = require('node-cron');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Configure the API endpoints
const DATA_API_URL = 'http://localhost:3000/api/data';
const DEVICE_API_URL = 'http://localhost:3000/api/devices';

// Generate a unique device ID or load from config
const DEVICE_ID = process.env.DEVICE_ID || uuidv4();

// Function to get device's local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        continue;
      }
      return iface.address;
    }
  }
  return '127.0.0.1'; // Fallback
}

// Function to generate random coordinates (for demonstration purposes)
// In a real-world scenario, you would get these from a GPS module
function getRandomPosition() {
  // Generate random coordinates around San Francisco
  return {
    latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
    longitude: -122.4194 + (Math.random() - 0.5) * 0.1
  };
}

// Function to generate a random number between min and max (inclusive)
function generateRandomNumber(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to simulate device status
function getDeviceStatus() {
  const statuses = ['online', 'idle', 'processing', 'warning', 'error'];
  const randomIndex = Math.floor(Math.random() * 5);
  // Make 'online' more likely
  return randomIndex < 3 ? 'online' : statuses[randomIndex];
}

// Function to register/update device
async function registerDevice() {
  try {
    const ip = getLocalIpAddress();
    const position = getRandomPosition();
    const status = getDeviceStatus();
    
    console.log(`Registering device ${DEVICE_ID} with status: ${status}`);
    
    const response = await axios.post(DEVICE_API_URL, {
      id: DEVICE_ID,
      ip: ip,
      position: position,
      status: status
    });
    
    console.log(`Device registration successful: ${response.data.message}`);
    return true;
  } catch (error) {
    console.error('Error registering device:', error.message);
    return false;
  }
}

// Function to send data to API
async function sendDataToApi() {
  try {
    // First, register/update the device
    await registerDevice();
    
    // Then send the sensor data
    const randomNumber = generateRandomNumber();
    const currentTime = new Date().toISOString();
    
    console.log(`Sending data: ${randomNumber} at ${currentTime}`);
    
    const response = await axios.post(DATA_API_URL, {
      value: randomNumber,
      timestamp: currentTime,
      deviceId: DEVICE_ID // Associate data with this device
    });
    
    console.log(`Data sent successfully. Server response: ${response.status}`);
  } catch (error) {
    console.error('Error sending data:', error.message);
  }
}

// Schedule the task to run every 30 seconds
console.log(`Background service started for device ${DEVICE_ID}. Sending data every 30 seconds...`);
cron.schedule('*/30 * * * * *', sendDataToApi);

// Register device and run data update immediately on startup
registerDevice().then(() => {
  sendDataToApi();
});
