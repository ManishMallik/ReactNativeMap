const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Load environment variables
require('dotenv').config();

// OpenAI
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Sample route to handle GET requests
app.get('/api', (req, res) => {
  res.send({ message: 'Hello from Node.js!' });
});

// Route to handle POST requests
app.post('/api/location', async (req, res) => {
  // Get data from request body. It should be a string
  const inputData = req.body.json;
//   res.send({ message: `Received data: ${inputData}` });
  console.log(inputData);

  //Connect to openAI API
  try {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: inputData }],
    });
    console.log(response.choices[0].message.content);
    // res.json({ result: response.choices[0].message.content });
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Error generating response from OpenAI' });
        }
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
