import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

export function ScreenLayout({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.brand}>Financely.</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.panel}>{children ?? <Text style={styles.placeholder}>Estrutura inicial da tela. Implementação prevista para as próximas etapas.</Text>}</View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 32, flexGrow: 1 },
  brand: { fontSize: 18, fontWeight: '800', color: theme.primary, marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: theme.text, marginBottom: 8 },
  description: { fontSize: 14, color: theme.muted, marginBottom: 22, lineHeight: 21 },
  panel: { backgroundColor: theme.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border },
  placeholder: { color: theme.muted, fontSize: 14, lineHeight: 22 },
});
