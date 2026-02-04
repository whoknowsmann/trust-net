import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import JobsScreen from '../screens/JobsScreen';
import CreateJobScreen from '../screens/CreateJobScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import ReputationScreen from '../screens/ReputationScreen';
import RateScreen from '../screens/RateScreen';

export type RootStackParamList = {
  Home: undefined;
  Jobs: undefined;
  CreateJob: undefined;
  JobDetail: { jobPda: string };
  Reputation: undefined;
  Rate: { jobPda: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Jobs" component={JobsScreen} />
      <Stack.Screen name="CreateJob" component={CreateJobScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="Reputation" component={ReputationScreen} />
      <Stack.Screen name="Rate" component={RateScreen} />
    </Stack.Navigator>
  );
}
