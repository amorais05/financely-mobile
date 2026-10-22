import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { register } from '../services/auth';
import { theme } from '../constants/theme';

export default function RegisterScreen({ onRegistered }: { onRegistered: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!nome.trim() || !email.trim() || senha.length < 6) {
      return Alert.alert('Confira os dados', 'Preencha nome, e-mail e uma senha de pelo menos 6 caracteres.');
    }
    setLoading(true);
    try {
      await register(nome, email, senha);
      Alert.alert('Conta criada', 'Agora entre com suas credenciais.', [{ text: 'Ir para login', onPress: onRegistered }]);
    } catch (error) {
      Alert.alert('Erro no cadastro', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return <View style={styles.container}>
    <Text style={styles.title}>Criar conta</Text>
    <TextInput style={styles.input} placeholder="Nome" autoCapitalize="words" value={nome} onChangeText={setNome} editable={!loading} />
    <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} editable={!loading} />
    <TextInput style={styles.input} placeholder="Senha (mínimo 6 caracteres)" secureTextEntry value={senha} onChangeText={setSenha} editable={!loading} />
    <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.background },
  title: { fontSize: 27, fontWeight: '800', color: theme.primary, marginBottom: 24 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
