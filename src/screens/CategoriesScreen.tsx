import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../components/ScreenLayout';
import { theme } from '../constants/theme';
import { restoreSession, type Session } from '../services/auth';
import { createCategory, deleteCategory, fetchCategories, updateCategory, type FinancialCategory } from '../services/categories';

export default function CategoriesScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<FinancialCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const current = await restoreSession();
      if (!current) throw new Error('Sua sessão expirou. Faça login novamente.');
      setSession(current);
      setItems(await fetchCategories(current));
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao carregar categorias.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function closeForm() { setOpen(false); setEditing(null); setName(''); }
  function startEdit(item: FinancialCategory) { setEditing(item); setName(item.nome_categoria); setOpen(true); setError(''); setMessage(''); }

  async function save() {
    if (!session || saving) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError('O nome deve ter pelo menos 2 caracteres.'); return; }
    if (items.some(c => c.nome_categoria.trim().toLocaleLowerCase('pt-BR') === trimmed.toLocaleLowerCase('pt-BR') && c.id_categoria !== editing?.id_categoria)) {
      setError('Já existe uma categoria com esse nome.'); return;
    }
    setSaving(true); setError(''); setMessage('');
    try {
      if (editing) await updateCategory(session, editing, trimmed);
      else await createCategory(session, trimmed);
      closeForm();
      setMessage(editing ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar categoria.'); }
    finally { setSaving(false); }
  }

  function confirmDelete(item: FinancialCategory) {
    if (!session || item.id_usuario !== session.id_usuario) return;
    Alert.alert('Excluir categoria?', `Deseja excluir “${item.nome_categoria}”? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        setSaving(true); setError(''); setMessage('');
        void deleteCategory(session, item)
          .then(async () => { setMessage('Categoria excluída.'); await load(); })
          .catch(e => setError(e instanceof Error ? e.message : 'Erro ao excluir categoria.'))
          .finally(() => setSaving(false));
      } },
    ]);
  }

  const standard = items.filter(c => c.id_usuario == null);
  const personal = session ? items.filter(c => c.id_usuario === session.id_usuario) : [];
  return <ScreenLayout title="Categorias" description="Organize suas movimentações e sincronize as alterações com o Financely Web.">
    <View style={styles.stack}>
      <Pressable accessibilityRole="button" onPress={() => { if (open) closeForm(); else { setEditing(null); setName(''); setOpen(true); } }} style={styles.primary}>
        <Ionicons name={open ? 'close' : 'add'} color={theme.white} size={20} />
        <Text style={styles.primaryText}>{open ? 'Cancelar' : 'Nova categoria'}</Text>
      </Pressable>
      {open && <View style={styles.form}>
        <Text style={styles.heading}>{editing ? 'Editar categoria' : 'Cadastrar categoria'}</Text>
        <Text style={styles.label}>Nome</Text>
        <TextInput accessibilityLabel="Nome da categoria" value={name} onChangeText={setName} placeholder="Ex.: Alimentação" placeholderTextColor={theme.muted} maxLength={60} style={styles.input} />
        <Pressable accessibilityRole="button" disabled={saving || loading} onPress={() => void save()} style={[styles.primary, (saving || loading) && styles.disabled]}>
          {saving ? <ActivityIndicator color={theme.white} /> : <Text style={styles.primaryText}>Salvar categoria</Text>}
        </Pressable>
      </View>}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => void load()} disabled={loading || saving} style={styles.refresh}>
        <Ionicons name="refresh" size={17} color={theme.primary} /><Text style={styles.refreshText}>Atualizar lista</Text>
      </Pressable>
      {loading ? <ActivityIndicator color={theme.primary} /> : null}
      {!loading && <>
        <Text style={styles.heading}>Minhas categorias ({personal.length})</Text>
        {personal.length === 0 ? <Text style={styles.muted}>Você ainda não criou categorias personalizadas.</Text> : null}
        {personal.map(item => <View key={item.id_categoria} style={styles.card}>
          <View style={styles.nameRow}><Ionicons name="pricetag-outline" size={18} color={theme.primary} /><Text style={styles.name}>{item.nome_categoria}</Text></View>
          <View style={styles.actions}>
            <Pressable disabled={saving} accessibilityLabel={`Editar ${item.nome_categoria}`} onPress={() => startEdit(item)}><Text style={styles.edit}>Editar</Text></Pressable>
            <Pressable disabled={saving} accessibilityLabel={`Excluir ${item.nome_categoria}`} onPress={() => confirmDelete(item)}><Text style={styles.delete}>Excluir</Text></Pressable>
          </View>
        </View>)}
        <Text style={styles.heading}>Categorias padrão ({standard.length})</Text>
        <Text style={styles.muted}>As categorias padrão estão protegidas contra edição e exclusão.</Text>
        {standard.map(item => <View key={item.id_categoria} style={styles.card}>
          <View style={styles.nameRow}><Ionicons name="lock-closed-outline" size={17} color={theme.muted} /><Text style={styles.name}>{item.nome_categoria}</Text></View>
        </View>)}
      </>}
    </View>
  </ScreenLayout>;
}
const styles = StyleSheet.create({
  stack: { gap: 13 },
  primary: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: theme.primary, padding: 14, borderRadius: 14, minHeight: 48 },
  primaryText: { color: theme.white, fontWeight: '800' },
  disabled: { opacity: .5 },
  form: { gap: 10, borderRadius: 14, padding: 14, backgroundColor: theme.background },
  heading: { fontSize: 16, color: theme.text, fontWeight: '800', marginTop: 7 },
  label: { fontSize: 12, color: theme.muted, fontWeight: '700' },
  input: { borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 13, color: theme.text, backgroundColor: theme.white, fontSize: 15 },
  error: { color: theme.expense, lineHeight: 20 },
  success: { color: theme.income, lineHeight: 20 },
  muted: { color: theme.muted, lineHeight: 20, fontSize: 13 },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 8 },
  refreshText: { color: theme.primary, fontWeight: '700' },
  card: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 13, gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: theme.text, fontSize: 15, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 22 },
  edit: { color: theme.primary, fontWeight: '700' },
  delete: { color: theme.expense, fontWeight: '700' },
});
