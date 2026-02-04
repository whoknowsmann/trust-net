import React from 'react';
import { View, Text, TextInput } from 'react-native';

type LabeledInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
};

export default function LabeledInput({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  multiline = false
}: LabeledInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 6,
          minHeight: multiline ? 80 : undefined
        }}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}
