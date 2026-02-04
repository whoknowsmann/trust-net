import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useWallet } from '../hooks/useWallet';
import { createConnection } from '../utils/solana';
import { getJobsForAgent, JobSummary } from '../services/trustnet';
import ErrorBox from '../components/ErrorBox';
import LoadingOverlay from '../components/LoadingOverlay';

export default function JobsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { publicKey } = useWallet();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const connection = createConnection();
      const agentKey = publicKey ?? 'UnknownAgent';
      const data = await getJobsForAgent(agentKey, connection, publicKey);
      setJobs(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
        Jobs
      </Text>
      <ErrorBox message={error} />
      <Button title="Refresh" onPress={loadJobs} />
      {loading ? (
        <LoadingOverlay message="Loading jobs..." />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.jobPda}
          renderItem={({ item }) => (
            <Pressable
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                marginTop: 12
              }}
              onPress={() =>
                navigation.navigate('JobDetail', { jobPda: item.jobPda })
              }
            >
              <Text style={{ fontWeight: '600' }}>{item.jobPda}</Text>
              <Text>Client: {item.client}</Text>
              <Text>Provider: {item.provider}</Text>
              <Text>Status: {item.status}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text>No jobs yet.</Text>}
        />
      )}
    </View>
  );
}
