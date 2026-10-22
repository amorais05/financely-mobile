import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../services/api';
import type { Session } from '../services/auth';
import { theme } from '../constants/theme';

type Transaction = { id_transacao: number; descricao?: string; valor: string | number; data_transacao?: string };
type Account = { id_conta: number; nome_conta: string; saldo_atual: string | number };
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const amount = (value: string | number | undefined) => Number(value || 0);
const dateOnly = (value?: string) => value ? value.slice(0, 10) : '';
const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); };

export default function DashboardScreen({ session }: { session: Session }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const id = encodeURIComponent(String(session.id_usuario));
      const headers = { Authorization: `Bearer ${session.token}` };
      const [t, a] = await Promise.all([
        fetch(`${API_BASE_URL}/listar-transacoes?id_usuario=${id}&limite=999999`, { headers }),
        fetch(`${API_BASE_URL}/saldo-por-conta?id_usuario=${id}`, { headers }),
      ]);
      if (!t.ok || !a.ok) throw new Error('Não foi possível consultar os dados financeiros.');
      const transactionData = await t.json();
      const accountData = await a.json();
      const rows = Array.isArray(transactionData) ? transactionData : transactionData.registros;
      if (!Array.isArray(rows) || !Array.isArray(accountData)) throw new Error('O servidor retornou dados inesperados.');
      setTransactions(rows); setAccounts(accountData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar a dashboard.');
    } finally { setLoading(false); }
  }, [session.id_usuario, session.token]);

  useEffect(() => { void load(); }, [load]);
  const currentDay = today();
  const month = currentDay.slice(0, 7);
  const realized = transactions.filter(t => dateOnly(t.data_transacao) && dateOnly(t.data_transacao) <= currentDay);
  const monthly = realized.filter(t => dateOnly(t.data_transacao).startsWith(month));
  const income = monthly.reduce((sum, t) => sum + Math.max(0, amount(t.valor)), 0);
  const expenses = monthly.reduce((sum, t) => sum + Math.abs(Math.min(0, amount(t.valor))), 0);
  const adjusted = accounts.map(a => {
    const future = transactions.filter(t => dateOnly(t.data_transacao) > currentDay && Number((t as Transaction & { id_conta?: number }).id_conta) === Number(a.id_conta)).reduce((sum, t) => sum + amount(t.valor), 0);
    return { ...a, balance: amount(a.saldo_atual) - future };
  });
  const balance = adjusted.reduce((sum, a) => sum + a.balance, 0);
  const latest = [...realized].sort((a, b) => dateOnly(b.data_transacao).localeCompare(dateOnly(a.data_transacao))).slice(0, 5);

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.brand}>Financely.</Text>
    <Text style={styles.title}>Visão geral</Text>
    <Text style={styles.subtitle}>Seus dados financeiros sincronizados com o Web.</Text>
    {loading ? <ActivityIndicator color={theme.primary} size="large" /> : error ? <View style={styles.card}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Tentar novamente</Text></Pressable></View> : <>
      <View style={styles.card}><Text style={styles.label}>Saldo total disponível</Text><Text style={styles.balance}>{money(balance)}</Text></View>
      <View style={styles.row}><View style={[styles.card, styles.half]}><Text style={styles.label}>Receitas do mês</Text><Text style={styles.income}>{money(income)}</Text></View><View style={[styles.card, styles.half]}><Text style={styles.label}>Despesas do mês</Text><Text style={styles.expense}>{money(expenses)}</Text></View></View>
      <Text style={styles.section}>Saldos por conta</Text>
      <View style={styles.card}>{adjusted.length ? adjusted.map(a => <View key={a.id_conta} style={styles.item}><Text style={styles.itemName}>{a.nome_conta}</Text><Text style={styles.itemValue}>{money(a.balance)}</Text></View>) : <Text style={styles.label}>Nenhuma conta cadastrada.</Text>}</View>
      <Text style={styles.section}>Últimos lançamentos</Text>
      <View style={styles.card}>{latest.length ? latest.map((t, index) => <View key={String(t.id_transacao ?? index)} style={styles.item}><View style={styles.flex}><Text style={styles.itemName}>{t.descricao || 'Lançamento'}</Text><Text style={styles.label}>{dateOnly(t.data_transacao)}</Text></View><Text style={amount(t.valor) >= 0 ? styles.income : styles.expense}>{money(amount(t.valor))}</Text></View>) : <Text style={styles.label}>Nenhum lançamento realizado.</Text>}</View>
      <Pressable style={styles.refresh} onPress={() => void load()}><Text style={styles.link}>Atualizar dados</Text></Pressable>
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 32, paddingBottom: 40 },
  brand: { fontSize: 18, fontWeight: '800', color: theme.primary, marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.muted, marginBottom: 22 },
  card: { backgroundColor: theme.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 }, half: { flex: 1 },
  label: { fontSize: 12, color: theme.muted, marginBottom: 6 },
  balance: { fontSize: 30, fontWeight: '800', color: theme.text },
  income: { fontSize: 14, fontWeight: '700', color: '#059669' },
  expense: { fontSize: 14, fontWeight: '700', color: '#e11d48' },
  section: { fontSize: 17, fontWeight: '800', color: theme.text, marginTop: 14, marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.text },
  itemValue: { fontSize: 14, fontWeight: '700', color: theme.text },
  flex: { flex: 1 }, error: { color: '#e11d48', marginBottom: 12 },
  link: { color: theme.primary, fontWeight: '700' }, refresh: { alignItems: 'center', padding: 12 },
});
