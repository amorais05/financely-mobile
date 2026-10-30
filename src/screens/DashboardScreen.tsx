import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet,
  Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../services/api';
import { restoreSession, type Session } from '../services/auth';
import { theme } from '../constants/theme';

type Account = {
  id_conta: number;
  nome_conta: string;
  tipo_conta?: string;
  saldo_atual: number | string;
};
type Movement = {
  id_transacao: number;
  descricao: string;
  valor: number | string;
  data_transacao: string;
  nome_categoria?: string;
  id_conta: number;
};
const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const amount = (value: number | string | undefined) => Number(value || 0) || 0;
const dayOnly = (value: string) => {
  const plain = String(value || '').split('T')[0];
  if (plain.includes('/')) {
    const [d, m, y] = plain.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return plain;
};
const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const shortDate = (value: string) => {
  const [y, m, d] = dayOnly(value).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
};

export default function DashboardScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const saved = await restoreSession();
      if (!saved) throw new Error('Sessão expirada. Faça login novamente.');
      setSession(saved);
      const id = encodeURIComponent(String(saved.id_usuario));
      const headers = { Authorization: `Bearer ${saved.token}` };
      const [accountResponse, movementsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/saldo-por-conta?id_usuario=${id}`, { headers }),
        fetch(`${API_BASE_URL}/listar-transacoes?id_usuario=${id}&limite=999999`, { headers }),
      ]);
      if (!accountResponse.ok || !movementsResponse.ok) {
        throw new Error('Não foi possível carregar os dados financeiros.');
      }
      const accountData: unknown = await accountResponse.json();
      const movementData: unknown = await movementsResponse.json();
      if (!Array.isArray(accountData)) throw new Error('O servidor retornou contas em formato inválido.');
      const list = Array.isArray(movementData) ? movementData :
        (movementData && typeof movementData === 'object' && 'registros' in movementData)
          ? (movementData as { registros: unknown }).registros : null;
      if (!Array.isArray(list)) throw new Error('O servidor retornou lançamentos em formato inválido.');
      setAccounts(accountData as Account[]);
      setMovements(list as Movement[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(true); }, [load]);

  const today = todayKey();
  const thisMonth = today.slice(0, 7);
  const posted = movements.filter(item => dayOnly(item.data_transacao) <= today && !!dayOnly(item.data_transacao));
  const monthly = posted.filter(item => dayOnly(item.data_transacao).slice(0, 7) === thisMonth);
  const income = monthly.reduce((sum, item) => sum + Math.max(0, amount(item.valor)), 0);
  const expense = monthly.reduce((sum, item) => sum + Math.abs(Math.min(0, amount(item.valor))), 0);
  // The Web calculates account balances including future movements.
  // Discount future-dated movements to represent the balance available today.
  const accountBalances = accounts.map(account => {
    const future = movements.filter(m => Number(m.id_conta) === Number(account.id_conta) && dayOnly(m.data_transacao) > today)
      .reduce((sum, m) => sum + amount(m.valor), 0);
    return { ...account, current: amount(account.saldo_atual) - future };
  });
  const total = accountBalances.reduce((sum, item) => sum + item.current, 0);
  const recent = [...posted].sort((a, b) => dayOnly(b.data_transacao).localeCompare(dayOnly(a.data_transacao)) || Number(b.id_transacao) - Number(a.id_transacao)).slice(0, 5);
  const monthLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} tintColor={theme.primary} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>financely<Text style={{ color: theme.income }}>.</Text></Text>
          <Text style={styles.greeting}>Olá{session?.nome ? `, ${session.nome.split(' ')[0]}` : ''} 👋</Text>
          <Text style={styles.subtle}>Seu dinheiro, com mais clareza.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Atualizar dados" onPress={() => void load()}
          style={styles.refreshButton}><Ionicons name="refresh" size={20} color={theme.primary} /></Pressable>
      </View>

      {loading ? <ActivityIndicator style={{ marginVertical: 46 }} size="large" color={theme.primary} /> : (
        <>
          {!!error && <View style={styles.warning}><Text style={styles.warningText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>}
          <View style={styles.hero}>
            <View style={styles.heroTop}><Ionicons name="wallet-outline" color="#C7D2FE" size={21} /><Text style={styles.heroLabel}>Saldo disponível hoje</Text></View>
            <Text style={styles.heroValue} adjustsFontSizeToFit numberOfLines={1}>{money(total)}</Text>
            <Text style={styles.heroFoot}>Somatório das suas contas • até hoje</Text>
            <View style={styles.heroCircleOne} /><View style={styles.heroCircleTwo} />
          </View>

          <Text style={styles.sectionTitle}>Resumo do mês</Text>
          <Text style={styles.period}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#DCFCE7' }]}><Ionicons name="arrow-down" size={20} color="#059669" /></View>
              <Text style={styles.cardLabel}>Entradas</Text>
              <Text style={[styles.cardValue, { color: '#059669' }]} numberOfLines={1} adjustsFontSizeToFit>{money(income)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: '#FFE4E6' }]}><Ionicons name="arrow-up" size={20} color={theme.expense} /></View>
              <Text style={styles.cardLabel}>Saídas</Text>
              <Text style={[styles.cardValue, { color: theme.expense }]} numberOfLines={1} adjustsFontSizeToFit>{money(expense)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Minhas contas</Text>
          {accountBalances.length === 0 ? <Text style={styles.empty}>Nenhuma conta cadastrada.</Text> : accountBalances.map(account => (
            <View key={account.id_conta} style={styles.accountRow}>
              <View style={styles.accountIcon}><Ionicons name="card-outline" size={21} color={theme.primary} /></View>
              <View style={{ flex: 1 }}><Text style={styles.accountName}>{account.nome_conta}</Text><Text style={styles.accountType}>{account.tipo_conta || 'Conta financeira'}</Text></View>
              <Text style={styles.accountValue}>{money(account.current)}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Últimas movimentações</Text>
          {recent.length === 0 ? <Text style={styles.empty}>Ainda não há lançamentos realizados.</Text> : recent.map(item => {
            const positive = amount(item.valor) >= 0;
            return <View key={item.id_transacao} style={styles.transactionRow}>
              <View style={[styles.transactionIcon, { backgroundColor: positive ? '#DCFCE7' : '#FFE4E6' }]}>
                <Ionicons name={positive ? 'arrow-down' : 'arrow-up'} size={18} color={positive ? '#059669' : theme.expense} />
              </View>
              <View style={{ flex: 1 }}><Text style={styles.accountName} numberOfLines={1}>{item.descricao || 'Movimentação'}</Text><Text style={styles.accountType}>{shortDate(item.data_transacao)} · {item.nome_categoria || 'Sem categoria'}</Text></View>
              <Text style={[styles.transactionValue, { color: positive ? '#059669' : theme.text }]}>{positive ? '+' : '−'}{money(Math.abs(amount(item.valor)))}</Text>
            </View>;
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 34 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  brand: { fontSize: 20, fontWeight: '900', color: theme.primary, marginBottom: 13 },
  greeting: { fontSize: 25, fontWeight: '800', color: theme.text },
  subtle: { color: theme.muted, marginTop: 4, fontSize: 13 },
  refreshButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  hero: { backgroundColor: theme.primary, borderRadius: 24, padding: 24, minHeight: 170, overflow: 'hidden', justifyContent: 'center', marginBottom: 26 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 9, zIndex: 1 },
  heroLabel: { color: '#E0E7FF', fontSize: 13, fontWeight: '600' },
  heroValue: { fontSize: 33, fontWeight: '800', color: theme.white, marginTop: 15, zIndex: 1 },
  heroFoot: { color: '#C7D2FE', fontSize: 11, marginTop: 9, zIndex: 1 },
  heroCircleOne: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF13', right: -110, top: -75 },
  heroCircleTwo: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFFFFF13', right: -34, bottom: -60 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 12 },
  period: { fontSize: 12, color: theme.muted, marginTop: -8, marginBottom: 13 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 27 },
  summaryCard: { flex: 1, borderRadius: 18, padding: 15, backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border, minWidth: 0 },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardLabel: { color: theme.muted, fontSize: 12, fontWeight: '600' },
  cardValue: { fontSize: 19, fontWeight: '800', marginTop: 5 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.white, padding: 14, borderRadius: 16, marginBottom: 9 },
  accountIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  accountName: { color: theme.text, fontSize: 13, fontWeight: '700' },
  accountType: { color: theme.muted, fontSize: 11, marginTop: 4 },
  accountValue: { color: theme.text, fontSize: 13, fontWeight: '800' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.white, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.border, marginBottom: 8 },
  transactionIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  transactionValue: { fontSize: 12, fontWeight: '800' },
  empty: { color: theme.muted, backgroundColor: theme.white, borderRadius: 14, padding: 18, marginBottom: 23 },
  warning: { backgroundColor: '#FFF1F2', padding: 16, borderRadius: 14, marginBottom: 15 },
  warningText: { color: '#9F1239', fontSize: 13 },
  retry: { color: theme.primary, fontWeight: '800', marginTop: 10 },
});
