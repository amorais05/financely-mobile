import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { NativeResourceError, scheduleFinancialReminder } from '../services/nativeResources';

export function FinancialReminder() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSchedule() {
    setLoading(true);
    setFeedback(null);

    try {
      await scheduleFinancialReminder({ seconds: 10 });
      setFeedback('Lembrete agendado. A notificação local será exibida em aproximadamente 10 segundos.');
    } catch (error) {
      if (error instanceof NativeResourceError) {
        const buttons = error.canOpenSettings
          ? [
              { text: 'Agora não', style: 'cancel' as const },
              { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            ]
          : [{ text: 'OK' }];

        Alert.alert('Notificações indisponíveis', error.message, buttons);
        setFeedback(error.message);
      } else {
        Alert.alert('Não foi possível agendar o lembrete', 'Tente novamente em alguns instantes.');
        setFeedback('Não foi possível agendar a notificação local.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Lembrete financeiro</Text>
      <Text style={styles.helper}>
        Agende uma notificação local de demonstração. A permissão será solicitada somente quando você ativar o lembrete.
      </Text>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Financely • Lembrete financeiro</Text>
        <Text style={styles.previewBody}>Não esqueça de registrar suas despesas de hoje.</Text>
      </View>

      <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={handleSchedule} disabled={loading}>
        <Text style={styles.primaryButtonText}>{loading ? 'Agendando...' : 'Testar lembrete em 10 segundos'}</Text>
      </Pressable>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
  helper: { fontSize: 13, lineHeight: 19, color: theme.muted },
  previewCard: {
    gap: 5,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  previewTitle: { fontSize: 14, fontWeight: '800', color: theme.text },
  previewBody: { fontSize: 13, lineHeight: 19, color: theme.muted },
  primaryButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: theme.white, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  feedback: { fontSize: 12, lineHeight: 18, color: theme.muted },
});
