const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Load OpenAI
const OpenAI = require('openai');

// Create an instance of the OpenAI API, use API key here
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

// Sample route to handle GET requests
app.get('/api', (req, res) => {
  res.send({ message: 'Hello from Node.js!' });
});

// GET route to generate location recommendations
app.get('/api/location', async (req, res) => {

  const inputData = req.query.location;
  const days = req.query.time;
  console.log(inputData);

  var prompt = inputData + " Please return only an array of recommended locations/stops for a " + days + " day trip. Make sure that the data can be used to display the locations on a map. Give the location objects in the following format: {name, address, latlng}. Make latlng an array of floats.";

  // Connect to openAI API
  try {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
    });
    console.log(response.choices[0].message.content);
    var locationResponses = Array.isArray(response.choices[0].message.content) ? response.choices[0].message.content : JSON.parse(response.choices[0].message.content);
    res.json({ result: locationResponses });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error generating response from OpenAI' });
    }
  }
});

// POST route to save data to a JSON file
app.post('/api/save', (req, res) => {
  const data = req.body;
  const filePath = 'data.json';

  // Read in the data from existing file
  let existingData = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath);
    existingData = JSON.parse(fileData);
  }

  existingData.push(data);

  // Write the updated data back to the file
  fs.writeFile(filePath, JSON.stringify(existingData, null, 2), (err) => {
    if (err) {
      console.error('Error saving data:', err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
    return res.status(201).json({ message: 'Data saved successfully', data });
  });
});

// GET route to read data from a JSON file
app.get('/api/data', (req, res) => {
  const filePath = 'data.json';

  // Check if the JSON file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Data file not found' });
  }

  // Read in the file data and send to frontend
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Error reading data:', err);
      return res.status(500).json({ error: 'Failed to read data' });
    }
    return res.json(JSON.parse(data));
  });
});

// DELETE route to delete a trip from the JSON file
app.delete('/api/deleteTrip/:index', (req, res) => {
  const tripIndex = parseInt(req.params.index, 10);
  const filePath = 'data.json';

  // Check if the JSON file exists
  if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Data file not found' });
  }

  // Read the file data
  fs.readFile(filePath, (err, data) => {
      if (err) {
          console.error('Error reading data:', err);
          return res.status(500).json({ error: 'Failed to read data' });
      }

      let trips = JSON.parse(data);

      // Check if the index is within range of the list
      if (tripIndex < 0 || tripIndex >= trips.length) {
          return res.status(400).json({ error: 'Invalid trip index' });
      }

      // Remove the trip at the specified index and write the updated data back to the file
      trips.splice(tripIndex, 1);
      fs.writeFile(filePath, JSON.stringify(trips, null, 2), (err) => {
          if (err) {
              console.error('Error writing data:', err);
              return res.status(500).json({ error: 'Failed to write updated data' });
          }

          // Send a success response
          res.status(200).json({ message: 'Trip deleted successfully' });
      });
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
