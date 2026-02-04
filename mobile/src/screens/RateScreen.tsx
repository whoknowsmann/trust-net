import React, { useState } from 'react';
import { View, Text, Button, Pressable, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import LabeledInput from '../components/LabeledInput';
import ErrorBox from '../components/ErrorBox';
import LoadingOverlay from '../components/LoadingOverlay';
import { rateJob } from '../services/trustnet';
import { createConnection } from '../utils/solana';
import { useWallet } from '../hooks/useWallet';

export default function RateScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Rate'>>();
  const { publicKey } = useWallet();
  const [score, setScore] = useState(5);
  const [tags, setTags] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!publicKey) {
      setError('Connect a wallet to rate jobs.');
      return;
    }

    setLoading(true);
    try {
      const connection = createConnection();
      await rateJob(
        route.params.jobPda,
        score,
        tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        comment || undefined,
        connection,
        publicKey
      );
    } catch (err: any) {
      setError(err?.message ?? 'Failed to rate job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
        Rate Job
      </Text>
      <ErrorBox message={error} />
      <Text style={{ marginBottom: 8 }}>Select rating:</Text>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => setScore(value)}
            style={{
              padding: 10,
              marginRight: 8,
              borderWidth: 1,
              borderColor: value === score ? '#333' : '#ccc',
              borderRadius: 6
            }}
          >
            <Text style={{ fontSize: 18 }}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <LabeledInput
        label="Tags (comma separated)"
        value={tags}
        onChangeText={setTags}
        placeholder="speed, quality"
      />
      <LabeledInput
        label="Comment"
        value={comment}
        onChangeText={setComment}
        placeholder="Optional feedback"
        multiline
      />
      {loading ? (
        <LoadingOverlay message="Submitting rating..." />
      ) : (
        <Button title="Submit Rating" onPress={handleSubmit} />
      )}
    </ScrollView>
  );
}
