import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { restoreSession, type Session } from '../services/auth';
import { deleteAccount, getAccounts, saveAccount, type AccountInput, type FinancialAccount } from '../services/accounts';

const TYPES = ['Corrente', 'Poupança', 'Investimento', 'Dinheiro'];
const emptyForm = (): AccountInput => ({ nome_conta: '', tipo_conta: 'Corrente', saldo_inicial: 0, agencia: '', numero_conta: '' });
const money = (value: number | string | undefined) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AccountsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AccountInput>(emptyForm());
  const [balanceText, setBalanceText] = useState('0,00');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const saved = await restoreSession();
      if (!saved) throw new Error('Sessão expirada. Faça login novamente.');
      setSession(saved);
      setAccounts(await getAccounts(saved));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar contas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openForm(account?: FinancialAccount) {
    setEditing(account?.id_conta ?? null);
    setForm(account ? {
      nome_conta: account.nome_conta,
      tipo_conta: account.tipo_conta || 'Corrente',
      saldo_inicial: Number(account.saldo_inicial || 0),
      agencia: account.agencia || '',
      numero_conta: account.numero_conta || '',
    } : emptyForm());
    setBalanceText(account ? String(account.saldo_inicial ?? 0).replace('.', ',') : '0,00');
    setShowForm(true);
    setError('');
  }

  async function save() {
    if (!session || saving) return;
    const initial = Number(balanceText.trim().replace(/\./g, '').replace(',', '.'));
    if (!form.nome_conta.trim()) { Alert.alert('Campo obrigatório', 'Informe o nome da conta.'); return; }
    if (!Number.isFinite(initial) || initial < 0) { Alert.alert('Saldo inválido', 'Informe um saldo inicial válido, igual ou maior que zero.'); return; }
    setSaving(true);
    try {
      await saveAccount(session, { ...form, nome_conta: form.nome_conta.trim(), saldo_inicial: initial }, editing ?? undefined);
      setShowForm(false);
      setEditing(null);
      await load();
      Alert.alert('Sucesso', editing ? 'Conta atualizada com sucesso.' : 'Conta cadastrada com sucesso.');
    } catch (e) {
      Alert.alert('Erro ao salvar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally { setSaving(false); }
  }

  function confirmDelete(account: FinancialAccount) {
    Alert.alert('Excluir conta?', `Deseja excluir “${account.nome_conta}”? Lançamentos vinculados podem ser afetados.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        if (!session) return;
        void (async () => {
          try { await deleteAccount(session, account.id_conta); await load(); }
          catch (e) { Alert.alert('Não foi possível excluir', e instanceof Error ? e.message : 'Tente novamente.'); }
        })();
      } },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}>
      <Text style={styles.brand}>Financely.</Text>
      <Text style={styles.title}>Minhas contas</Text>
      <Text style={styles.subtitle}>Gerencie suas contas e saldos sincronizados com o Financely Web.</Text>
      <Pressable style={styles.primary} onPress={() => showForm ? setShowForm(false) : openForm()}>
        <Text style={styles.primaryText}>{showForm ? 'Cancelar' : '+ Nova conta'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showForm && (
        <View style={styles.card}>
          <Text style={styles.heading}>{editing ? 'Editar conta' : 'Cadastrar conta'}</Text>
          <Text style={styles.label}>Nome da conta *</Text>
          <TextInput style={styles.input} value={form.nome_conta} onChangeText={nome_conta => setForm(prev => ({ ...prev, nome_conta }))} placeholder="Ex.: Conta principal" placeholderTextColor={theme.muted} />
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeRow}>{TYPES.map(tipo => (
            <Pressable key={tipo} onPress={() => setForm(prev => ({ ...prev, tipo_conta: tipo }))} style={[styles.chip, form.tipo_conta === tipo && styles.selectedChip]}>
              <Text style={[styles.chipText, form.tipo_conta === tipo && styles.selectedChipText]}>{tipo}</Text>
            </Pressable>
          ))}</View>
          <Text style={styles.label}>Saldo inicial (R$)</Text>
          <TextInput style={styles.input} value={balanceText} onChangeText={setBalanceText} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={theme.muted} />
          <Text style={styles.label}>Agência (opcional)</Text>
          <TextInput style={styles.input} value={form.agencia} onChangeText={agencia => setForm(prev => ({ ...prev, agencia }))} placeholder="Agência" placeholderTextColor={theme.muted} />
          <Text style={styles.label}>Número da conta (opcional)</Text>
          <TextInput style={styles.input} value={form.numero_conta} onChangeText={numero_conta => setForm(prev => ({ ...prev, numero_conta }))} placeholder="Número" placeholderTextColor={theme.muted} />
          <Pressable disabled={saving} style={[styles.primary, saving && styles.disabled]} onPress={() => void save()}>
            <Text style={styles.primaryText}>{saving ? 'Salvando...' : 'Salvar conta'}</Text>
          </Pressable>
        </View>
      )}
      {loading && accounts.length === 0 ? <ActivityIndicator size="large" color={theme.primary} /> : null}
      {!loading && accounts.length === 0 ? <Text style={styles.empty}>Nenhuma conta cadastrada. Toque em “Nova conta” para começar.</Text> : null}
      {accounts.map(account => (
        <View style={styles.card} key={account.id_conta}>
          <Text style={styles.heading}>{account.nome_conta}</Text>
          <Text style={styles.muted}>{account.tipo_conta || 'Conta'}</Text>
          <Text style={styles.balance}>{money(account.saldo_atual)}</Text>
          <Text style={styles.muted}>Saldo atual</Text>
          <View style={styles.actions}>
            <Pressable style={styles.secondary} onPress={() => openForm(account)}><Text style={styles.secondaryText}>Editar</Text></Pressable>
            <Pressable style={styles.delete} onPress={() => confirmDelete(account)}><Text style={styles.deleteText}>Excluir</Text></Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  content: { padding: 22, paddingBottom: 36, gap: 14 },
  brand: { color: theme.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  title: { color: theme.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: theme.muted, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  card: { backgroundColor: theme.white, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: theme.border, gap: 10 },
  heading: { fontWeight: '800', fontSize: 18, color: theme.text },
  muted: { color: theme.muted, fontSize: 13 },
  balance: { fontWeight: '800', fontSize: 25, color: theme.text },
  label: { color: theme.text, fontSize: 13, fontWeight: '700', marginTop: 5 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 14, minHeight: 46, fontSize: 15, color: theme.text, backgroundColor: theme.background },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderColor: theme.border, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 18 },
  selectedChip: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.muted, fontSize: 12, fontWeight: '700' },
  selectedChipText: { color: theme.white },
  primary: { backgroundColor: theme.primary, borderRadius: 13, padding: 15, alignItems: 'center' },
  primaryText: { color: theme.white, fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  secondary: { borderRadius: 10, backgroundColor: '#EEF2FF', padding: 11, flex: 1, alignItems: 'center' },
  secondaryText: { color: theme.primary, fontWeight: '800' },
  delete: { borderRadius: 10, backgroundColor: '#FFF1F2', padding: 11, flex: 1, alignItems: 'center' },
  deleteText: { color: theme.expense, fontWeight: '800' },
  error: { color: theme.expense, fontWeight: '600' },
  empty: { color: theme.muted, textAlign: 'center', padding: 25 },
});
