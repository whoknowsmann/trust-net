import React, { useState } from 'react';
import { View, Text, Button, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import LabeledInput from '../components/LabeledInput';
import ErrorBox from '../components/ErrorBox';
import LoadingOverlay from '../components/LoadingOverlay';
import { useWallet } from '../hooks/useWallet';
import { createConnection } from '../utils/solana';
import { createJob } from '../services/trustnet';

export default function CreateJobScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { publicKey } = useWallet();
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [deadlineMinutes, setDeadlineMinutes] = useState('60');
  const [terms, setTerms] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!publicKey) {
      setError('Connect a wallet before creating a job.');
      return;
    }

    if (!provider || !amount) {
      setError('Provider and amount are required.');
      return;
    }

    const amountNumber = Number(amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    const deadlineNumber = Number(deadlineMinutes);
    if (Number.isNaN(deadlineNumber) || deadlineNumber <= 0) {
      setError('Deadline must be a positive number of minutes.');
      return;
    }

    const deadlineUnix = Math.floor(Date.now() / 1000) + deadlineNumber * 60;
    const termsHash = new TextEncoder().encode(terms || '');

    try {
      setLoading(true);
      const connection = createConnection();
      const result = await createJob(
        {
          client: publicKey,
          provider,
          amountLamports: BigInt(Math.round(amountNumber * 1e9)),
          deadlineUnix,
          termsHash
        },
        connection,
        publicKey
      );

      Alert.alert('Job created', `Job ID: ${result.jobPda}`);
      navigation.navigate('JobDetail', { jobPda: result.jobPda });
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 12 }}>
        Create Job
      </Text>
      <ErrorBox message={error} />
      <LabeledInput
        label="Provider Address"
        value={provider}
        onChangeText={setProvider}
        placeholder="Provider public key"
      />
      <LabeledInput
        label="Amount (SOL)"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.5"
        keyboardType="numeric"
      />
      <LabeledInput
        label="Deadline (minutes from now)"
        value={deadlineMinutes}
        onChangeText={setDeadlineMinutes}
        keyboardType="numeric"
      />
      <LabeledInput
        label="Terms"
        value={terms}
        onChangeText={setTerms}
        placeholder="Describe the job terms"
        multiline
      />
      {loading ? (
        <LoadingOverlay message="Creating job..." />
      ) : (
        <Button title="Create Job" onPress={handleSubmit} />
      )}
    </ScrollView>
  );
}
