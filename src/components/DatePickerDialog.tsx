import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../constants/theme';

export const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function DatePickerDialog({ value, onConfirm, onCancel }: {
  value: string; onConfirm: (date: string) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => {
    const parsed = new Date(value + 'T12:00:00');
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });
  if (Platform.OS === 'android') {
    return <DateTimePicker value={draft} mode="date" display="default"
      onChange={(event, date) => {
        if (event.type === 'set' && date) onConfirm(dateKey(date));
        else onCancel();
      }} />;
  }
  return <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <Text style={styles.title}>Selecionar data</Text>
        <DateTimePicker value={draft} mode="date" display="inline" locale="pt-BR"
          onChange={(_, date) => { if (date) setDraft(date); }} />
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.button}><Text style={styles.cancel}>Cancelar</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => onConfirm(dateKey(draft))} style={[styles.button, styles.primary]}><Text style={styles.confirm}>Confirmar</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 12 },
  panel: { width: '100%', maxWidth: 390, alignSelf: 'center', padding: 12, gap: 12, backgroundColor: theme.white, borderRadius: 20 },
  title: { color: theme.text, fontSize: 18, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12 },
  primary: { backgroundColor: theme.primary },
  cancel: { color: theme.primary, fontWeight: '700' },
  confirm: { color: theme.white, fontWeight: '700' },
});
