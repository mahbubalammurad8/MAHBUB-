const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const users = [
  { id: 1, name: 'Murad', points: 1000 },
  { id: 2, name: 'Rafi', points: 850 },
  { id: 3, name: 'Nadia', points: 1200 }
];

const predictions = [];

const demoMatches = [
  {
    id: 'match-101',
    homeTeam: 'Bangladesh',
    awayTeam: 'India',
    startTime: '2026-11-13T18:30:00Z',
    status: 'LIVE',
    score: '142/3'
  },
  {
    id: 'match-102',
    homeTeam: 'Pakistan',
    awayTeam: 'England',
    startTime: '2026-11-13T20:00:00Z',
    status: 'UPCOMING',
    score: 'Toss not done'
  },
  {
    id: 'match-103',
    homeTeam: 'Sri Lanka',
    awayTeam: 'Australia',
    startTime: '2026-11-14T12:00:00Z',
    status: 'UPCOMING',
    score: 'Not started'
  }
];

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({ success: true, user });
});

app.get('/api/live-scores', async (req, res) => {
  try {
    const apiKey = process.env.CRICAPI_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      return res.json({
        success: true,
        source: 'demo',
        matches: demoMatches
      });
    }

    const response = await axios.get('https://api.cricapi.com/v1/currentMatches', {
      params: {
        apikey: apiKey
      }
    });

    return res.json({
      success: true,
      source: 'cricapi',
      matches: response.data.data || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Live scores could not be loaded',
      details: error.message
    });
  }
});

app.post('/api/predict', (req, res) => {
  const { userId, matchId, selectedTeam, points } = req.body;

  if (!userId || !matchId || !selectedTeam || !points) {
    return res.status(400).json({ success: false, message: 'Incomplete data' });
  }

  const user = users.find((u) => u.id === Number(userId));

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (Number(points) <= 0 || user.points < Number(points)) {
    return res.status(400).json({ success: false, message: 'Not enough free points' });
  }

  user.points -= Number(points);

  const newPrediction = {
    id: predictions.length + 1,
    userId: Number(userId),
    matchId,
    selectedTeam,
    pointsUsed: Number(points),
    status: 'PENDING'
  };

  predictions.push(newPrediction);

  return res.json({
    success: true,
    message: 'Prediction created successfully',
    remainingPoints: user.points,
    prediction: newPrediction
  });
});

app.get('/api/predictions', (req, res) => {
  res.json({ success: true, predictions });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
