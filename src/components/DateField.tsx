import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerDialog } from './DatePickerDialog';
import { theme } from '../constants/theme';

type Props = {
  label: string;
  value: string;
  onChange: (date: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function DateField({ label, value, onChange, style, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const display = value ? value.split('T')[0].split('-').reverse().join('/') : 'Selecionar data';
  return <View style={[styles.container, style]}>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={label + ': ' + display}
      accessibilityState={{ disabled }} disabled={disabled}
      onPress={() => { Keyboard.dismiss(); setOpen(true); }}
      style={[styles.field, disabled && styles.disabled]}>
      <Text numberOfLines={1} style={[styles.value, !value && styles.placeholder]}>{display}</Text>
      <Ionicons name="calendar-outline" size={19} color={theme.primary} />
    </Pressable>
    {open && <DatePickerDialog value={value}
      onConfirm={date => { setOpen(false); onChange(date); }}
      onCancel={() => setOpen(false)} />}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 8, minWidth: 0 },
  label: { color: theme.text, fontSize: 13, fontWeight: '800' },
  field: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.background, paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  value: { flex: 1, color: theme.text, fontSize: 14 },
  placeholder: { color: theme.muted },
  disabled: { opacity: 0.5 },
});
