import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'murad@example.com', password: '123456' });

  const fetchDashboard = async (userId) => {
    try {
      const [matchesRes, leaderboardRes, predictionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/matches`),
        axios.get(`${API_URL}/api/leaderboard`),
        axios.get(`${API_URL}/api/predictions/${userId}`)
      ]);

      setMatches(matchesRes.data.matches || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
      setPredictions(predictionsRes.data.predictions || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
      const payload = authMode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      const loggedUser = response.data.user;

      setUser(loggedUser);
      setScreen('home');
      await fetchDashboard(loggedUser.id);
    } catch (error) {
      Alert.alert('Authentication failed', error.response?.data?.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (matchId, selectedTeam) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/predict`, {
        userId: user.id,
        matchId,
        selectedTeam,
        points: 50
      });

      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        const updatedUser = { ...user, points: response.data.remainingPoints };
        setUser(updatedUser);
        await fetchDashboard(user.id);
      }
    } catch (error) {
      Alert.alert('Prediction failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (matchId, winner) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/admin/settle-match`, { matchId, winner });
      await fetchDashboard(user.id);
      Alert.alert('Match settled', `${winner} declared winner`);
    } catch (error) {
      Alert.alert('Error', 'Could not settle match');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard(user.id);
    }
  }, [user]);

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>MAHBUB Prediction</Text>
        <Text style={styles.subtitle}>Virtual sports challenge</Text>

        {authMode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(value) => setForm({ ...form, email: value })}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={form.password}
          onChangeText={(value) => setForm({ ...form, password: value })}
          secureTextEntry
        />

        <Button title={loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'} onPress={handleAuth} disabled={loading} />

        <View style={{ marginTop: 12 }}>
          <Button
            title={authMode === 'login' ? 'Create new account' : 'Back to login'}
            onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.name}</Text>
        <Text style={styles.points}>Available points: {user?.points ?? 0}</Text>
        <Button title="Logout" onPress={() => { setUser(null); setScreen('login'); }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboard.map((item) => (
          <Text key={item.id} style={styles.leaderRow}>#{item.rank} {item.name} - {item.points} pts</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Matches</Text>
        {matches.map((match) => (
          <View key={match.id} style={styles.card}>
            <Text style={styles.matchTitle}>{match.homeTeam} vs {match.awayTeam}</Text>
            <Text style={styles.matchInfo}>Status: {match.status}</Text>
            <Text style={styles.matchInfo}>Score: {match.score}</Text>

            <View style={styles.buttonRow}>
              <Button title={match.homeTeam} onPress={() => handlePredict(match.id, match.homeTeam)} />
              <Button title={match.awayTeam} onPress={() => handlePredict(match.id, match.awayTeam)} />
            </View>

            <View style={{ marginTop: 12 }}>
              <Button title="Settle: Bangladesh wins" onPress={() => handleSettle(match.id, 'Bangladesh')} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Predictions</Text>
        {predictions.length === 0 ? (
          <Text style={styles.emptyText}>No predictions yet.</Text>
        ) : (
          predictions.map((prediction) => (
            <Text key={prediction.id} style={styles.predictionItem}>
              {prediction.matchId} - {prediction.selectedTeam} - {prediction.status}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 60
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 18
  },
  points: {
    color: '#facc15',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  section: {
    marginBottom: 18
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827'
  },
  leaderRow: {
    fontSize: 15,
    marginBottom: 6,
    color: '#334155'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  matchInfo: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4
  },
  buttonRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  predictionItem: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6
  },
  emptyText: {
    color: '#64748b'
  }
});
