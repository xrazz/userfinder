const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware to enable CORS from everywhere
app.use(cors());

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint for handling prompts
app.post('/api/prompt', async (req, res) => {
  try {
    // Extract system and user prompts from the request body
    const { systemPrompt, userPrompt } = req.body;

    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'System and User prompts are required.' });
    }

    // Construct payload for the AI model
    const payload = {
      stream: false,
      system: "groq",
      modelId: "mixtral-8x7b-32768",
      messages: [
        {
          name: "system",
          content: systemPrompt,
          role: "system",
        },
        {
          name: "user",
          content: userPrompt,
          role: "user",
        },
      ],
    };
     // Add headers for the API request
     const headers = {
        'x-api-key': 'udsk_n8vrdUwlvWa32M1yEOYWGdyb3FYgpqMuwGqGLHN4F9IShOX9Jbh', // Replace with your actual API key
      };

    // Make a request to the AI model API
    const aiResponse = await axios.post('https://dev.undrstnd-labs.com/api', payload, { headers }); // Replace with the actual API endpoint

    // Respond with the AI model's output
    res.json({
      output: aiResponse.data.output,
      funding: aiResponse.data.funding,
      usage: aiResponse.data.usage,
    });
  } catch (error) {
    console.error('Error communicating with AI model:', error);
    res.status(500).json({ error: 'An error occurred while processing the prompt.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});