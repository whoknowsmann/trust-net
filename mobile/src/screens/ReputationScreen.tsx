import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { useWallet } from '../hooks/useWallet';
import LabeledInput from '../components/LabeledInput';
import ErrorBox from '../components/ErrorBox';
import LoadingOverlay from '../components/LoadingOverlay';
import { createConnection } from '../utils/solana';
import { getReputation, ReputationSummary } from '../services/trustnet';

function computeTrustScore(reputation: ReputationSummary) {
  const total = reputation.completed + reputation.failed;
  const successRate = total > 0 ? reputation.completed / total : 0;
  const averageRatingScore = Math.min(reputation.averageRating / 5, 1);
  const volumeSol = Number(reputation.volumeLamports) / 1e9;
  const volumeScore = Math.min(Math.log10(volumeSol + 1) / 3, 1);

  const trustScore =
    averageRatingScore * 0.5 + successRate * 0.3 + volumeScore * 0.2;
  return Math.round(trustScore * 100);
}

export default function ReputationScreen() {
  const { publicKey } = useWallet();
  const [agentKey, setAgentKey] = useState(publicKey ?? '');
  const [reputation, setReputation] = useState<ReputationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setError(null);
    if (!agentKey) {
      setError('Enter a public key to fetch reputation.');
      return;
    }

    setLoading(true);
    try {
      const connection = createConnection();
      const data = await getReputation(agentKey, connection, publicKey);
      setReputation(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load reputation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
        Reputation
      </Text>
      <ErrorBox message={error} />
      <LabeledInput
        label="Agent Public Key"
        value={agentKey}
        onChangeText={setAgentKey}
        placeholder="Agent public key"
      />
      <Button title="Fetch Reputation" onPress={handleFetch} />
      {loading ? <LoadingOverlay message="Loading reputation..." /> : null}
      {reputation ? (
        <View style={{ marginTop: 16 }}>
          <Text>Completed: {reputation.completed}</Text>
          <Text>Failed: {reputation.failed}</Text>
          <Text>
            Volume (SOL): {Number(reputation.volumeLamports) / 1e9}
          </Text>
          <Text>Average Rating: {reputation.averageRating}</Text>
          <Text style={{ fontWeight: '600', marginTop: 8 }}>
            Trust Score: {computeTrustScore(reputation)}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
