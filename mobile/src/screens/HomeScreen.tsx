import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useWallet } from '../hooks/useWallet';
import ErrorBox from '../components/ErrorBox';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { connected, publicKey, connect, disconnect } = useWallet();
  const [error, setError] = React.useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect wallet.');
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await disconnect();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to disconnect wallet.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>
        TrustNet Mobile
      </Text>
      <ErrorBox message={error} />
      <Text style={{ marginBottom: 8 }}>Wallet status:</Text>
      <Text style={{ marginBottom: 16, fontWeight: '600' }}>
        {connected ? publicKey : 'Not connected'}
      </Text>
      <Button
        title={connected ? 'Disconnect Wallet' : 'Connect Wallet'}
        onPress={connected ? handleDisconnect : handleConnect}
      />
      <View style={{ height: 20 }} />
      <Button title="Jobs" onPress={() => navigation.navigate('Jobs')} />
      <View style={{ height: 12 }} />
      <Button title="Create Job" onPress={() => navigation.navigate('CreateJob')} />
      <View style={{ height: 12 }} />
      <Button
        title="Reputation"
        onPress={() => navigation.navigate('Reputation')}
      />
    </View>
  );
}
