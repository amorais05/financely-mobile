import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login, type Session } from '../services/auth';
import { theme } from '../constants/theme';

export default function LoginScreen({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha) return Alert.alert('Campos obrigatórios', 'Informe seu e-mail e senha.');
    setLoading(true);
    try {
      onLogin(await login(email, senha));
    } catch (error) {
      Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return <View style={styles.container}>
    <Text style={styles.title}>Entrar no Financely</Text>
    <Text style={styles.subtitle}>Use a mesma conta do Financely Web.</Text>
    <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} editable={!loading} />
    <TextInput style={styles.input} placeholder="Senha" secureTextEntry autoComplete="password" value={senha} onChangeText={setSenha} editable={!loading} />
    <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.background },
  title: { fontSize: 27, fontWeight: '800', color: theme.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.muted, marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
