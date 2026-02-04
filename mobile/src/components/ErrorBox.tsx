import React from 'react';
import { View, Text } from 'react-native';

type ErrorBoxProps = {
  message: string | null;
};

export default function ErrorBox({ message }: ErrorBoxProps) {
  if (!message) {
    return null;
  }

  return (
    <View
      style={{
        padding: 12,
        backgroundColor: '#fdecea',
        borderColor: '#f5c6cb',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 12
      }}
    >
      <Text style={{ color: '#a94442' }}>{message}</Text>
    </View>
  );
}
