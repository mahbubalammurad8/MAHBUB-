import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000';

export default function App() {
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const matchesRes = await axios.get(`${API_URL}/api/live-scores`);
      const userRes = await axios.get(`${API_URL}/api/users/1`);

      setMatches(matchesRes.data.matches || []);
      setUser(userRes.data.user);
    } catch (error) {
      console.log(error);
      Alert.alert('Connection error', 'Please start the backend server first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePredict = async (matchId, selectedTeam) => {
    try {
      const res = await axios.post(`${API_URL}/api/predict`, {
        userId: 1,
        matchId,
        selectedTeam,
        points: 50
      });

      Alert.alert('Prediction saved', res.data.message);
      loadData();
    } catch (error) {
      Alert.alert('Prediction failed', error.response?.data?.message || 'Something went wrong');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading app data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MAHBUB Prediction</Text>
        <Text style={styles.subTitle}>Virtual points app</Text>
        <Text style={styles.points}>Available points: {user?.points ?? 0}</Text>
      </View>

      {matches.map((match) => (
        <View key={match.id} style={styles.card}>
          <Text style={styles.matchTitle}>{match.homeTeam} vs {match.awayTeam}</Text>
          <Text style={styles.matchInfo}>Status: {match.status}</Text>
          <Text style={styles.matchInfo}>Score: {match.score}</Text>

          <View style={styles.buttonRow}>
            <Button title={match.homeTeam} onPress={() => handlePredict(match.id, match.homeTeam)} />
            <Button title={match.awayTeam} onPress={() => handlePredict(match.id, match.awayTeam)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700'
  },
  subTitle: {
    marginTop: 6,
    color: '#cbd5e1',
    fontSize: 16
  },
  points: {
    marginTop: 12,
    color: '#facc15',
    fontSize: 18,
    fontWeight: '600'
  },
  card: {
    margin: 16,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  matchInfo: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6
  },
  buttonRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  }
});
