const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;
const windowSize = 10;
let slidingWindow = [];
let authToken = '';

// Replace with your actual credentials
const credentials = {
  companyName: 'Ashish2776',
  clientID: 'e4257aa2-8e14-412b-b0aa-1363fa7addb3',
  clientSecret: 'yWnUqsdKOmVssobN',
  ownerName: 'Ashish Kumar',
  ownerEmail: 'ashishkumar748867@gmail.com',
  rollNo: '11212776'
};

const testServerURL = 'http://20.244.56.144/test';

// Function to authenticate and obtain token
const authenticateAndGetToken = async () => {
  try {
    const response = await axios.post(`${testServerURL}/auth`, credentials);
    authToken = response.data.access_token;
    console.log('Authentication successful. Token:', authToken);
  } catch (error) {
    throw new Error(`Error during authentication: ${error.message}`);
  }
};

// Function to fetch numbers from the test server
const fetchNumbers = async (type) => {
  try {
    const response = await axios.get(`${testServerURL}/${type}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 500
    });

    const numbers = response.data.numbers;
    const uniqueNumbers = Array.from(new Set(numbers));

    uniqueNumbers.forEach((num) => {
      if (!slidingWindow.includes(num)) {
        if (slidingWindow.length >= windowSize) {
          slidingWindow.shift();
        }
        slidingWindow.push(num);
      }
    });

    const prevState = [...slidingWindow];
    const currState = [...slidingWindow];
    const avg = calculateAverage(currState);

    return {
      numbers,
      prevState,
      currState,
      avg
    };
  } catch (error) {
    throw new Error(`Error fetching ${type} numbers: ${error.message}`);
  }
};

// Function to calculate average of numbers
const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return (sum / numbers.length).toFixed(2);
};

// Endpoint to handle requests for different number IDs
app.get('/numbers/:numberid', async (req, res) => {
  const numberID = req.params.numberid;

  if (!['p', 'f', 'e', 'r'].includes(numberID)) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  const type = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
  }[numberID];

  try {
    const result = await fetchNumbers(type);
    res.json(result);
  } catch (error) {
    console.error('Error fetching numbers:', error.message);
    res.status(500).json({ error: 'Failed to fetch numbers' });
  }
});

// Start the server and authenticate on startup
app.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
  
  try {
    await authenticateAndGetToken();
  } catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1); // Exit on critical errors
  }
});
