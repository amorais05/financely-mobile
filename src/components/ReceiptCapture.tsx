import React, { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { captureReceipt, NativeResourceError, type CapturedReceipt } from '../services/nativeResources';

export function ReceiptCapture({ onChange }: { onChange?: (receipt: CapturedReceipt | null) => void }) {
  const [receipt, setReceipt] = useState<CapturedReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function updateReceipt(next: CapturedReceipt | null) {
    setReceipt(next);
    onChange?.(next);
  }

  async function handleCapture() {
    setLoading(true);
    setFeedback(null);

    try {
      const captured = await captureReceipt();
      if (!captured) {
        setFeedback('Captura cancelada. Nenhum comprovante foi alterado.');
        return;
      }

      updateReceipt(captured);
      setFeedback('Comprovante capturado. Confira a prévia antes de continuar.');
    } catch (error) {
      if (error instanceof NativeResourceError) {
        const buttons = error.canOpenSettings
          ? [
              { text: 'Agora não', style: 'cancel' as const },
              { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            ]
          : [{ text: 'OK' }];

        Alert.alert('Câmera indisponível', error.message, buttons);
        setFeedback(error.message);
      } else {
        Alert.alert('Não foi possível usar a câmera', 'Tente novamente em alguns instantes.');
        setFeedback('Não foi possível abrir a câmera.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comprovante</Text>
      <Text style={styles.helper}>
        A câmera será solicitada somente quando você escolher fotografar um comprovante. O lançamento pode ser salvo sem foto.
      </Text>

      {receipt ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: receipt.uri }} style={styles.preview} resizeMode="contain" />
          <Text style={styles.previewLabel}>Prévia do comprovante</Text>
          <View style={styles.actionsRow}>
            <Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={handleCapture} disabled={loading}>
              <Text style={styles.secondaryButtonText}>{loading ? 'Abrindo...' : 'Tirar outra foto'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.removeButton}
              onPress={() => {
                updateReceipt(null);
                setFeedback('Comprovante removido.');
              }}
            >
              <Text style={styles.removeButtonText}>Remover</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={handleCapture} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Abrindo câmera...' : 'Fotografar comprovante'}</Text>
        </Pressable>
      )}

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
  helper: { fontSize: 13, lineHeight: 19, color: theme.muted },
  primaryButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: theme.white, fontSize: 14, fontWeight: '800' },
  previewCard: { gap: 10 },
  preview: { width: '100%', height: 220, backgroundColor: theme.background, borderRadius: 12 },
  previewLabel: { fontSize: 12, color: theme.muted, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  secondaryButtonText: { color: theme.primary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  removeButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.expense,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  removeButtonText: { color: theme.expense, fontSize: 13, fontWeight: '700' },
  feedback: { fontSize: 12, lineHeight: 18, color: theme.muted },
});
