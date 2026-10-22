import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { getCurrentLocation, NativeResourceError, type CurrentLocation as CurrentLocationData } from '../services/nativeResources';

export function CurrentLocation({ onChange }: { onChange?: (location: CurrentLocationData | null) => void }) {
  const [location, setLocation] = useState<CurrentLocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function updateLocation(next: CurrentLocationData | null) {
    setLocation(next);
    onChange?.(next);
  }

  async function handleLocation() {
    setLoading(true);
    setFeedback(null);

    try {
      const current = await getCurrentLocation();
      updateLocation(current);
      setFeedback('Localização atual vinculada ao lançamento.');
    } catch (error) {
      if (error instanceof NativeResourceError) {
        const buttons = error.canOpenSettings
          ? [
              { text: 'Agora não', style: 'cancel' as const },
              { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
            ]
          : [{ text: 'OK' }];

        Alert.alert('Localização indisponível', error.message, buttons);
        setFeedback(error.message);
      } else {
        Alert.alert('Não foi possível obter a localização', 'Tente novamente em alguns instantes.');
        setFeedback('Não foi possível obter a localização atual.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Localização</Text>
      <Text style={styles.helper}>
        Use sua posição atual apenas se quiser registrar onde o lançamento foi realizado. A permissão é solicitada somente ao usar este recurso.
      </Text>

      {location ? (
        <View style={styles.locationCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>{location.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>{location.longitude.toFixed(6)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Precisão</Text>
            <Text style={styles.value}>{location.accuracy == null ? 'Não informada' : `${Math.round(location.accuracy)} m`}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={handleLocation} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Obtendo localização...' : location ? 'Atualizar localização' : 'Usar localização atual'}
          </Text>
        </Pressable>
        {location ? (
          <Pressable
            accessibilityRole="button"
            style={styles.removeButton}
            onPress={() => {
              updateLocation(null);
              setFeedback('Localização removida do lançamento.');
            }}
          >
            <Text style={styles.removeButtonText}>Remover</Text>
          </Pressable>
        ) : null}
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
  helper: { fontSize: 13, lineHeight: 19, color: theme.muted },
  locationCard: {
    gap: 8,
    padding: 14,
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 13, color: theme.muted },
  value: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: { color: theme.white, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  removeButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.expense,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  removeButtonText: { color: theme.expense, fontSize: 13, fontWeight: '700' },
  feedback: { fontSize: 12, lineHeight: 18, color: theme.muted },
});
