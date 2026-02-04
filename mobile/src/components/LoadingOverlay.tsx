import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

type LoadingOverlayProps = {
  message?: string;
};

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <View
      style={{
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ActivityIndicator size="large" color="#444" />
      {message ? <Text style={{ marginTop: 8 }}>{message}</Text> : null}
    </View>
  );
}
