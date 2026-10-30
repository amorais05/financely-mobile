import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ScreenLayout';
import { theme } from '../constants/theme';
import { restoreSession, type Session } from '../services/auth';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setSession(await restoreSession()); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  return <ScreenLayout title="Meu perfil" description="Sua conta e as configurações do Financely.">
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={theme.primary} /> : session ? <>
        <View style={styles.card}>
          <View style={styles.avatar}><Ionicons name="person" size={30} color={theme.white} /></View>
          <View style={styles.info}><Text style={styles.muted}>Conta conectada</Text><Text style={styles.name}>{session.nome || 'Usuário Financely'}</Text><Text style={styles.muted}>ID do usuário: {session.id_usuario}</Text></View>
        </View>
        <View style={styles.card}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.primary} />
          <View style={styles.info}><Text style={styles.heading}>Sessão protegida</Text><Text style={styles.muted}>A sessão é armazenada no SecureStore. A senha e o token não são exibidos.</Text></View>
        </View>
      </> : <Text style={styles.muted}>Nenhuma sessão ativa. Faça login novamente.</Text>}
      <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.reload}><Ionicons name="refresh-outline" color={theme.primary} size={18} /><Text style={styles.reloadText}>Atualizar informações</Text></Pressable>
      <Text style={styles.muted}>Use os atalhos Contas, Categorias e Sair, disponíveis logo abaixo da tela de Perfil. O logout continua sendo realizado pelo AppNavigator para garantir que a navegação seja bloqueada após sair.</Text>
    </View>
  </ScreenLayout>;
}
const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { borderWidth: 1, borderColor: theme.border, padding: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.white },
  avatar: { width: 54, height: 54, borderRadius: 17, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 19, color: theme.text, fontWeight: '800' },
  heading: { fontSize: 15, color: theme.text, fontWeight: '800' },
  muted: { fontSize: 13, color: theme.muted, lineHeight: 20 },
  reload: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8 },
  reloadText: { color: theme.primary, fontWeight: '700' },
});
