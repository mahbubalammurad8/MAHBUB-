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
  { id: 1, name: 'Murad', email: 'murad@example.com', password: '123456', points: 1000 },
  { id: 2, name: 'Rafi', email: 'rafi@example.com', password: '123456', points: 850 },
  { id: 3, name: 'Nadia', email: 'nadia@example.com', password: '123456', points: 1200 }
];

const matches = [
  {
    id: 'match-101',
    homeTeam: 'Bangladesh',
    awayTeam: 'India',
    startTime: '2026-11-13T18:30:00Z',
    status: 'LIVE',
    score: '142/3',
    winner: 'Bangladesh'
  },
  {
    id: 'match-102',
    homeTeam: 'Pakistan',
    awayTeam: 'England',
    startTime: '2026-11-13T20:00:00Z',
    status: 'UPCOMING',
    score: 'Toss not done',
    winner: 'Pakistan'
  },
  {
    id: 'match-103',
    homeTeam: 'Sri Lanka',
    awayTeam: 'Australia',
    startTime: '2026-11-14T12:00:00Z',
    status: 'UPCOMING',
    score: 'Not started',
    winner: 'Sri Lanka'
  }
];

const predictions = [];

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  const newUser = {
    id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
    name,
    email,
    password,
    points: 1000
  };

  users.push(newUser);

  return res.status(201).json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, points: newUser.points } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  return res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, points: user.points }
  });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, points: user.points } });
});

app.get('/api/matches', (req, res) => {
  return res.json({ success: true, matches });
});

app.get('/api/live-scores', async (req, res) => {
  try {
    const apiKey = process.env.CRICAPI_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY') {
      return res.json({
        success: true,
        source: 'demo',
        matches
      });
    }

    const response = await axios.get('https://api.cricapi.com/v1/currentMatches', {
      params: { apikey: apiKey }
    });

    return res.json({ success: true, source: 'cricapi', matches: response.data.data || [] });
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
  const match = matches.find((item) => item.id === matchId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }

  if (Number(points) <= 0 || user.points < Number(points)) {
    return res.status(400).json({ success: false, message: 'Not enough free points' });
  }

  if (selectedTeam !== match.homeTeam && selectedTeam !== match.awayTeam) {
    return res.status(400).json({ success: false, message: 'Invalid team selection' });
  }

  user.points -= Number(points);

  const newPrediction = {
    id: predictions.length + 1,
    userId: Number(userId),
    matchId,
    selectedTeam,
    pointsUsed: Number(points),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  predictions.push(newPrediction);

  return res.json({
    success: true,
    message: 'Prediction created successfully',
    remainingPoints: user.points,
    prediction: newPrediction
  });
});

app.get('/api/predictions/:userId', (req, res) => {
  const userPredictions = predictions.filter((prediction) => prediction.userId === Number(req.params.userId));
  return res.json({ success: true, predictions: userPredictions });
});

app.get('/api/leaderboard', (req, res) => {
  const leaderboard = [...users]
    .sort((a, b) => b.points - a.points)
    .map((user, index) => ({ rank: index + 1, ...user }));

  return res.json({ success: true, leaderboard });
});

app.post('/api/admin/settle-match', (req, res) => {
  const { matchId, winner } = req.body;

  const match = matches.find((item) => item.id === matchId);
  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }

  match.winner = winner;
  match.status = 'FINISHED';

  const relatedPredictions = predictions.filter((prediction) => prediction.matchId === matchId && prediction.status === 'PENDING');

  relatedPredictions.forEach((prediction) => {
    const user = users.find((u) => u.id === prediction.userId);
    if (!user) return;

    if (prediction.selectedTeam === winner) {
      user.points += prediction.pointsUsed * 2;
      prediction.status = 'WON';
    } else {
      prediction.status = 'LOST';
    }
  });

  return res.json({ success: true, message: 'Match settled', match, predictions: relatedPredictions });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
