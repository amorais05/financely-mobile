import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { FinancialReminder } from '../components/FinancialReminder';
import { theme } from '../constants/theme';
import { restoreSession } from '../services/auth';
import { brl, listTransactions, type FinancialTransaction } from '../services/financial';

export default function CalendarScreen({ onOpenTransaction }: { onOpenTransaction: (id: number) => void }) {
  const [items, setItems] = useState<FinancialTransaction[]>([]);
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date().getDate());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const session = await restoreSession();
      if (!session) throw new Error('Faça login novamente.');
      setItems(await listTransactions(session));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar lançamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}`;
  const dayItems = useMemo(
    () => items.filter(item => String(item.data_transacao).slice(0, 10) === iso),
    [items, iso],
  );

  const move = (step: number) => {
    setDate(new Date(year, month + step, 1));
    setSelected(1);
  };

  return (
    <ScreenLayout title="Calendário financeiro" description="Encontre movimentações pela data.">
      <View style={styles.stack}>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => move(-1)}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" onPress={() => move(1)}>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.days}>
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
            <Text key={index} style={styles.weekday}>{day}</Text>
          ))}
          {Array.from({ length: first }, (_, index) => <View key={`pad${index}`} style={styles.cell} />)}
          {Array.from({ length: last }, (_, index) => index + 1).map(day => {
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasTransactions = items.some(item => String(item.data_transacao).slice(0, 10) === key);
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`Dia ${day}`}
                onPress={() => setSelected(day)}
                style={[styles.cell, day === selected && styles.selected]}
              >
                <Text style={[styles.day, day === selected && styles.selectedText]}>{day}</Text>
                {hasTransactions ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={() => void load()}>
          <Text style={styles.link}>↻ Atualizar lançamentos</Text>
        </Pressable>

        {loading ? <ActivityIndicator color={theme.primary} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.section}>
          Movimentações de {String(selected).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}/{year}
        </Text>

        {!loading && dayItems.length === 0 ? (
          <Text style={styles.muted}>Nenhuma movimentação nesta data.</Text>
        ) : null}

        {dayItems.map(item => (
          <Pressable
            key={item.id_transacao}
            accessibilityRole="button"
            accessibilityLabel={`Abrir lançamento ${item.descricao || 'sem descrição'}`}
            onPress={() => onOpenTransaction(Number(item.id_transacao))}
            style={({ pressed }) => [styles.line, pressed && styles.linePressed]}
          >
            <View style={styles.transactionText}>
              <Text style={styles.name}>{item.descricao || 'Sem descrição'}</Text>
              <Text style={styles.meta}>
                {item.nome_conta || 'Conta'} · {item.nome_categoria || 'Categoria'}
              </Text>
            </View>
            <View style={styles.amountColumn}>
              <Text style={[styles.amount, { color: Number(item.valor) < 0 ? theme.expense : theme.income }]}>
                {brl(item.valor)}
              </Text>
              <Text style={styles.openHint}>Ver / editar ›</Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.section}>Lembretes</Text>
        <FinancialReminder />
        <Text style={styles.muted}>Toque em uma movimentação para abrir o lançamento correspondente.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { fontSize: 34, color: theme.primary, paddingHorizontal: 10 },
  title: { fontSize: 17, fontWeight: '800', color: theme.text, textTransform: 'capitalize' },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', textAlign: 'center', fontWeight: '800', color: theme.muted, paddingVertical: 12 },
  cell: { width: '14.2857%', height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  selected: { backgroundColor: theme.primary },
  day: { color: theme.text, fontWeight: '600' },
  selectedText: { color: theme.white },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.income },
  section: { color: theme.text, fontWeight: '800', fontSize: 16 },
  line: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
  },
  linePressed: { backgroundColor: '#EEF2FF' },
  transactionText: { flex: 1, gap: 3 },
  name: { color: theme.text, fontWeight: '700' },
  meta: { color: theme.muted, fontSize: 11 },
  amountColumn: { alignItems: 'flex-end', gap: 3 },
  amount: { fontWeight: '800' },
  openHint: { color: theme.primary, fontSize: 11, fontWeight: '700' },
  link: { color: theme.primary, fontWeight: '700' },
  error: { color: theme.expense },
  muted: { color: theme.muted },
});
