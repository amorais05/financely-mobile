import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../constants/theme';
import { restoreSession, type Session } from '../services/auth';
import { listAccounts, listCategories, type AccountOption, type CategoryOption } from '../services/transactions';
import { deleteTransaction, loadTransactionHistory, updateTransaction, type HistoryTransaction, type TransactionUpdate } from '../services/transactionHistory';

const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const iso = (value: string) => String(value || '').split('T')[0];
const brDate = (value: string) => iso(value).split('-').reverse().join('/');
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + 'T12:00:00').getTime());
const toNumber = (value: string) => Number(value.trim().replace(/\./g, '').replace(',', '.'));

type SelectOption = { id: number; label: string };
function Choices({ items, value, onChange, allLabel }: { items: SelectOption[]; value: number | null; onChange: (id: number | null) => void; allLabel?: string }) {
  return <View style={styles.chips}>
    {allLabel ? <Pressable onPress={() => onChange(null)} style={[styles.chip, value === null && styles.activeChip]}><Text style={[styles.chipText, value === null && styles.activeText]}>{allLabel}</Text></Pressable> : null}
    {items.map(item => <Pressable key={item.id} onPress={() => onChange(item.id)} style={[styles.chip, value === item.id && styles.activeChip]}><Text style={[styles.chipText, value === item.id && styles.activeText]}>{item.label}</Text></Pressable>)}
  </View>;
}

export default function TransactionsScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<HistoryTransaction[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'Todos' | 'Entrada' | 'Saída'>('Todos');
  const [account, setAccount] = useState<number | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dateTarget, setDateTarget] = useState<'start' | 'end' | 'edit' | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<TransactionUpdate>({ descricao: '', valor: 0, data_transacao: '', id_conta: 0, id_categoria: 0, tipo_movimento: 'Saída' });
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const saved = await restoreSession();
      if (!saved) throw new Error('Sessão expirada. Faça login novamente.');
      const [transactions, accountList, categoryList] = await Promise.all([loadTransactionHistory(saved), listAccounts(saved), listCategories(saved)]);
      setSession(saved);
      setItems(transactions);
      setAccounts(accountList);
      setCategories(categoryList);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao buscar lançamentos.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const filtered = useMemo(() => items.filter(t => {
    const v = Number(t.valor);
    const date = iso(t.data_transacao);
    return t.descricao?.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))
      && (type === 'Todos' || (type === 'Entrada' ? v >= 0 : v < 0))
      && (account === null || Number(t.id_conta) === account)
      && (category === null || Number(t.id_categoria) === category)
      && (!start || date >= start) && (!end || date <= end);
  }), [items, query, type, account, category, start, end]);
  const incoming = filtered.reduce((sum, t) => sum + Math.max(0, Number(t.valor) || 0), 0);
  const outgoing = filtered.reduce((sum, t) => sum + Math.abs(Math.min(0, Number(t.valor) || 0)), 0);

  const beginEdit = (t: HistoryTransaction) => {
    setEditing(Number(t.id_transacao));
    setForm({ descricao: t.descricao || '', valor: Math.abs(Number(t.valor)), data_transacao: iso(t.data_transacao), id_conta: Number(t.id_conta) || 0, id_categoria: Number(t.id_categoria) || 0, tipo_movimento: Number(t.valor) < 0 ? 'Saída' : 'Entrada' });
    setEditValue(String(Math.abs(Number(t.valor))).replace('.', ','));
  };
  const save = async () => {
    if (!session || editing === null || saving) return;
    const amount = toNumber(editValue);
    if (!form.descricao.trim() || !Number.isFinite(amount) || amount <= 0 || !validDate(form.data_transacao) || !form.id_conta || !form.id_categoria) {
      Alert.alert('Confira os dados', 'Preencha descrição, valor positivo, data, conta e categoria.'); return;
    }
    setSaving(true);
    try { await updateTransaction(session, editing, { ...form, valor: amount }); setEditing(null); await reload(); Alert.alert('Tudo certo!', 'Lançamento atualizado no Financely.'); }
    catch (e) { Alert.alert('Erro ao salvar', e instanceof Error ? e.message : 'Tente novamente.'); }
    finally { setSaving(false); }
  };
  const confirmDelete = (t: HistoryTransaction) => {
    Alert.alert('Excluir lançamento?', `Excluir definitivamente “${t.descricao}”? Isso atualizará o saldo da conta.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (!session) return;
        try { await deleteTransaction(session, Number(t.id_transacao)); await reload(); }
        catch (e) { Alert.alert('Erro ao excluir', e instanceof Error ? e.message : 'Tente novamente.'); }
      } },
    ]);
  };
  const dateValue = dateTarget === 'start' ? start : dateTarget === 'end' ? end : form.data_transacao;
  const setPickedDate = (selected: Date) => {
    const selectedIso = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    if (dateTarget === 'start') setStart(selectedIso);
    else if (dateTarget === 'end') setEnd(selectedIso);
    else setForm(current => ({ ...current, data_transacao: selectedIso }));
    setDateTarget(null);
  };
  return <ScrollView style={styles.root} contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} />}>
    <Text style={styles.brand}>financely.</Text>
    <Text style={styles.heading}>Seus lançamentos</Text>
    <Text style={styles.caption}>Consulte e organize receitas e despesas.</Text>
    <View style={styles.summary}>
      <View style={styles.summaryCard}><Text style={styles.caption}>Entradas filtradas</Text><Text style={[styles.summaryValue, { color: theme.income }]}>{money(incoming)}</Text></View>
      <View style={styles.summaryCard}><Text style={styles.caption}>Saídas filtradas</Text><Text style={[styles.summaryValue, { color: theme.expense }]}>{money(outgoing)}</Text></View>
    </View>
    <View style={styles.panel}>
      <Text style={styles.section}>Filtros</Text>
      <TextInput style={styles.input} placeholder="Buscar pela descrição" placeholderTextColor={theme.muted} value={query} onChangeText={setQuery} />
      <View style={styles.chips}>{(['Todos', 'Entrada', 'Saída'] as const).map(v => <Pressable key={v} onPress={() => setType(v)} style={[styles.chip, type === v && styles.activeChip]}><Text style={[styles.chipText, type === v && styles.activeText]}>{v}</Text></Pressable>)}</View>
      <Text style={styles.label}>Conta</Text><Choices allLabel="Todas" items={accounts.map(a => ({ id: Number(a.id_conta), label: a.nome_conta }))} value={account} onChange={setAccount} />
      <Text style={styles.label}>Categoria</Text><Choices allLabel="Todas" items={categories.map(c => ({ id: Number(c.id_categoria), label: c.nome_categoria }))} value={category} onChange={setCategory} />
      <View style={styles.summary}>
        <Pressable style={styles.dateButton} onPress={() => setDateTarget('start')}><Text style={styles.caption}>De</Text><Text style={styles.dateText}>{start ? brDate(start) : 'Selecionar data'}</Text></Pressable>
        <Pressable style={styles.dateButton} onPress={() => setDateTarget('end')}><Text style={styles.caption}>Até</Text><Text style={styles.dateText}>{end ? brDate(end) : 'Selecionar data'}</Text></Pressable>
      </View>
      <Pressable onPress={() => { setQuery(''); setType('Todos'); setAccount(null); setCategory(null); setStart(''); setEnd(''); }}><Text style={styles.link}>Limpar filtros</Text></Pressable>
    </View>
    {error ? <View style={styles.panel}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void reload()}><Text style={styles.link}>Tentar novamente</Text></Pressable></View> : null}
    <Text style={styles.section}>{filtered.length} lançamento(s)</Text>
    {!loading && !error && filtered.length === 0 ? <Text style={styles.caption}>Nenhum lançamento encontrado.</Text> : null}
    {filtered.map(t => <View key={t.id_transacao} style={styles.panel}>
      <View style={styles.between}><View style={styles.flex}><Text style={styles.itemTitle}>{t.descricao || 'Sem descrição'}</Text><Text style={styles.caption}>{brDate(t.data_transacao)} · {t.nome_conta || 'Conta'} · {t.nome_categoria || 'Categoria'}</Text></View><Text style={[styles.amount, { color: Number(t.valor) < 0 ? theme.expense : theme.income }]}>{money(Number(t.valor))}</Text></View>
      <View style={styles.actions}><Pressable onPress={() => beginEdit(t)}><Text style={styles.link}>Editar</Text></Pressable><Pressable onPress={() => confirmDelete(t)}><Text style={styles.remove}>Excluir</Text></Pressable></View>
    </View>)}
    {editing !== null && <View style={styles.panel}><Text style={styles.section}>Editar lançamento</Text>
      <Text style={styles.label}>Tipo</Text><View style={styles.chips}>{(['Entrada','Saída'] as const).map(v => <Pressable key={v} style={[styles.chip, form.tipo_movimento === v && styles.activeChip]} onPress={() => setForm(f => ({ ...f, tipo_movimento: v }))}><Text style={[styles.chipText, form.tipo_movimento === v && styles.activeText]}>{v}</Text></Pressable>)}</View>
      <Text style={styles.label}>Descrição</Text><TextInput style={styles.input} value={form.descricao} onChangeText={descricao => setForm(f => ({ ...f, descricao }))} />
      <Text style={styles.label}>Valor</Text><TextInput keyboardType="decimal-pad" style={styles.input} value={editValue} onChangeText={setEditValue} />
      <Text style={styles.label}>Data</Text><Pressable style={styles.dateButton} onPress={() => setDateTarget('edit')}><Text style={styles.dateText}>{brDate(form.data_transacao)}  📅</Text></Pressable>
      <Text style={styles.label}>Conta</Text><Choices items={accounts.map(a => ({ id: Number(a.id_conta), label: a.nome_conta }))} value={form.id_conta} onChange={id => setForm(f => ({ ...f, id_conta: id || 0 }))} />
      <Text style={styles.label}>Categoria</Text><Choices items={categories.map(c => ({ id: Number(c.id_categoria), label: c.nome_categoria }))} value={form.id_categoria} onChange={id => setForm(f => ({ ...f, id_categoria: id || 0 }))} />
      <View style={styles.actions}><Pressable style={styles.saveButton} onPress={() => void save()} disabled={saving}><Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable><Pressable onPress={() => setEditing(null)}><Text style={styles.link}>Cancelar</Text></Pressable></View>
    </View>}
    {dateTarget && <DateTimePicker value={validDate(dateValue) ? new Date(dateValue + 'T12:00:00') : new Date()} mode="date" locale="pt-BR" display="compact" onChange={(_, date) => { if (date) setPickedDate(date); else setDateTarget(null); }} />}
    <Text style={styles.footer}>Puxe para baixo para atualizar. As alterações são salvas no mesmo backend do Web.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  page: { padding: 18, paddingBottom: 48, gap: 14 },
  brand: { color: theme.primary, fontSize: 19, fontWeight: '900', marginTop: 8 },
  heading: { color: theme.text, fontWeight: '900', fontSize: 26 },
  caption: { color: theme.muted, fontSize: 12, lineHeight: 19 },
  section: { color: theme.text, fontWeight: '800', fontSize: 16 },
  panel: { backgroundColor: theme.white, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: theme.border, gap: 12 },
  summary: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: theme.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.border },
  summaryValue: { fontSize: 17, fontWeight: '900', marginTop: 5 },
  input: { color: theme.text, borderColor: theme.border, borderWidth: 1, borderRadius: 12, minHeight: 46, paddingHorizontal: 12 },
  label: { fontSize: 12, fontWeight: '800', color: theme.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderColor: theme.border, borderWidth: 1 },
  activeChip: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: 12, color: theme.muted, fontWeight: '700' },
  activeText: { color: theme.white },
  dateButton: { flex: 1, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, padding: 12, borderRadius: 12, justifyContent: 'center', minHeight: 51 },
  dateText: { color: theme.text, fontWeight: '700', fontSize: 13 },
  link: { color: theme.primary, fontWeight: '800', fontSize: 13 },
  error: { color: theme.expense, fontWeight: '700' },
  between: { flexDirection: 'row', gap: 9, justifyContent: 'space-between', alignItems: 'flex-start' },
  flex: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: theme.text },
  amount: { fontSize: 14, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 7 },
  remove: { color: theme.expense, fontWeight: '800', fontSize: 13 },
  saveButton: { backgroundColor: theme.primary, padding: 12, borderRadius: 12 },
  saveText: { color: theme.white, fontWeight: '800' },
  footer: { color: theme.muted, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
