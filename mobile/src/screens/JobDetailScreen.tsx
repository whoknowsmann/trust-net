import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useWallet } from '../hooks/useWallet';
import { createConnection } from '../utils/solana';
import {
  acceptJob,
  approveCompletion,
  getJob,
  JobSummary,
  submitCompletion
} from '../services/trustnet';
import ErrorBox from '../components/ErrorBox';
import LoadingOverlay from '../components/LoadingOverlay';

export default function JobDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'JobDetail'>>();
  const { publicKey } = useWallet();
  const [job, setJob] = useState<JobSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const connection = createConnection();
      const data = await getJob(route.params.jobPda, connection, publicKey);
      setJob(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load job.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [route.params.jobPda]);

  const handleAccept = async () => {
    if (!publicKey) {
      setError('Connect a wallet to accept jobs.');
      return;
    }

    setLoading(true);
    try {
      const connection = createConnection();
      await acceptJob(route.params.jobPda, BigInt(10000000), connection, publicKey);
      Alert.alert('Job accepted');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to accept job.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!publicKey) {
      setError('Connect a wallet to submit completion.');
      return;
    }

    setLoading(true);
    try {
      const connection = createConnection();
      const submissionHash = new TextEncoder().encode('completion');
      await submitCompletion(route.params.jobPda, submissionHash, connection, publicKey);
      Alert.alert('Completion submitted');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit completion.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!publicKey) {
      setError('Connect a wallet to approve completion.');
      return;
    }

    setLoading(true);
    try {
      const connection = createConnection();
      await approveCompletion(route.params.jobPda, connection, publicKey);
      Alert.alert('Completion approved');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to approve completion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
        Job Detail
      </Text>
      <ErrorBox message={error} />
      {loading && !job ? <LoadingOverlay message="Loading job..." /> : null}
      {job ? (
        <View>
          <Text style={{ fontWeight: '600' }}>Job: {job.jobPda}</Text>
          <Text>Client: {job.client}</Text>
          <Text>Provider: {job.provider}</Text>
          <Text>Status: {job.status}</Text>
          <Text>Amount: {Number(job.amountLamports) / 1e9} SOL</Text>
          <Text>Deadline: {new Date(job.deadlineUnix * 1000).toLocaleString()}</Text>
        </View>
      ) : null}
      <View style={{ height: 16 }} />
      {loading && job ? <LoadingOverlay message="Working..." /> : null}
      <Button title="Accept Job" onPress={handleAccept} />
      <View style={{ height: 8 }} />
      <Button title="Submit Completion" onPress={handleSubmit} />
      <View style={{ height: 8 }} />
      <Button title="Approve Completion" onPress={handleApprove} />
      <View style={{ height: 8 }} />
      <Button
        title="Rate Job"
        onPress={() => navigation.navigate('Rate', { jobPda: route.params.jobPda })}
      />
      <View style={{ height: 8 }} />
      <Button title="Raise Dispute" onPress={() => Alert.alert('TODO')} />
    </ScrollView>
  );
}
