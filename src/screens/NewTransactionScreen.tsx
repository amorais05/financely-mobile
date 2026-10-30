import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CurrentLocation } from '../components/CurrentLocation';
import { ReceiptCapture } from '../components/ReceiptCapture';
import { ScreenLayout } from '../components/ScreenLayout';
import { theme } from '../constants/theme';
import { restoreSession, type Session } from '../services/auth';
import {
  createTransaction,
  listAccounts,
  listCategories,
  type AccountOption,
  type CategoryOption,
  type TransactionMovement,
} from '../services/transactions';

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export default function NewTransactionScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [movement, setMovement] = useState<TransactionMovement>('Saída');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError('');
      try {
        const saved = await restoreSession();
        if (!saved) throw new Error('Sua sessão expirou. Faça login novamente para cadastrar um lançamento.');
        const [accountData, categoryData] = await Promise.all([
          listAccounts(saved),
          listCategories(saved),
        ]);
        if (!active) return;
        setSession(saved);
        setAccounts(accountData);
        setCategories(categoryData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar contas e categorias.');
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setError('');
    setSuccess('');

    if (!session) {
      setError('Sua sessão não está disponível. Faça login novamente.');
      return;
    }

    const numericValue = Number(value.trim().replace(',', '.'));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (!isValidDate(date)) {
      setError('Informe a data no formato AAAA-MM-DD.');
      return;
    }
    if (!accountId) {
      setError('Selecione a conta de origem ou destino.');
      return;
    }
    if (!categoryId) {
      setError('Selecione uma categoria.');
      return;
    }
    if (!description.trim()) {
      setError('Informe uma descrição para o lançamento.');
      return;
    }

    setSaving(true);
    try {
      await createTransaction(session, {
        description,
        value: numericValue,
        date,
        movement,
        accountId,
        categoryId,
      });
      setValue('');
      setDescription('');
      setAccountId(null);
      setCategoryId(null);
      setDate(today());
      setSuccess(`${movement} cadastrada com sucesso e sincronizada com o Financely Web.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenLayout
      title="Novo lançamento"
      description="Cadastre receitas e despesas e, se desejar, adicione um comprovante e sua localização atual."
    >
      <View style={styles.content}>
        <View style={styles.movementRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMovement('Entrada')}
            style={[styles.movementButton, movement === 'Entrada' && styles.incomeButton]}
          >
            <Text style={[styles.movementText, movement === 'Entrada' && styles.activeMovementText]}>Entrada</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMovement('Saída')}
            style={[styles.movementButton, movement === 'Saída' && styles.expenseButton]}
          >
            <Text style={[styles.movementText, movement === 'Saída' && styles.activeMovementText]}>Saída</Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Valor</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="0,00"
            keyboardType="decimal-pad"
            style={styles.input}
            placeholderTextColor={theme.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Data</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Selecionar data"
            style={[styles.input, styles.dateInput]}
            onPress={() => setShowDatePicker(!showDatePicker)}
          >
            <Text style={styles.dateText}>
              {date.split('-').reverse().join('/')}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(`${date}T12:00:00`)}
              mode="date"
              display="compact"
              locale="pt-BR"
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  const year = selectedDate.getFullYear();
                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(selectedDate.getDate()).padStart(2, '0');
                  setDate(`${year}-${month}-${day}`);
                }
                setShowDatePicker(false);
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ex.: Compra no mercado"
            style={[styles.input, styles.descriptionInput]}
            placeholderTextColor={theme.muted}
            multiline
            maxLength={160}
          />
        </View>

        {loadingOptions ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.helper}>Carregando contas e categorias...</Text>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Conta</Text>
              {accounts.length === 0 ? (
                <Text style={styles.helper}>Nenhuma conta cadastrada. Cadastre uma conta antes de lançar uma movimentação.</Text>
              ) : (
                <View style={styles.options}>
                  {accounts.map(account => (
                    <Pressable
                      key={account.id_conta}
                      accessibilityRole="button"
                      onPress={() => setAccountId(account.id_conta)}
                      style={[styles.option, accountId === account.id_conta && styles.optionSelected]}
                    >
                      <Text style={[styles.optionText, accountId === account.id_conta && styles.optionTextSelected]}>
                        {account.nome_conta}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Categoria</Text>
              {categories.length === 0 ? (
                <Text style={styles.helper}>Nenhuma categoria disponível.</Text>
              ) : (
                <View style={styles.options}>
                  {categories.map(category => (
                    <Pressable
                      key={category.id_categoria}
                      accessibilityRole="button"
                      onPress={() => setCategoryId(category.id_categoria)}
                      style={[styles.option, categoryId === category.id_categoria && styles.optionSelected]}
                    >
                      <Text style={[styles.optionText, categoryId === category.id_categoria && styles.optionTextSelected]}>
                        {category.nome_categoria}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={saving || loadingOptions || !session}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            (saving || loadingOptions || !session) && styles.saveButtonDisabled,
            pressed && styles.saveButtonPressed,
          ]}
        >
          {saving ? <ActivityIndicator color={theme.white} /> : <Text style={styles.saveButtonText}>Salvar lançamento</Text>}
        </Pressable>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Recursos opcionais</Text>
        <Text style={styles.helper}>Você também pode registrar um comprovante e consultar sua localização atual.</Text>

        <View style={styles.resources}>
          <ReceiptCapture />
          <CurrentLocation />
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  movementRow: { flexDirection: 'row', gap: 10 },
  movementButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  incomeButton: { backgroundColor: theme.income, borderColor: theme.income },
  expenseButton: { backgroundColor: theme.expense, borderColor: theme.expense },
  movementText: { color: theme.muted, fontWeight: '800' },
  activeMovementText: { color: theme.white },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', color: theme.text },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    paddingHorizontal: 14,
    color: theme.text,
    fontSize: 15,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  dateText: { color: theme.text, fontSize: 15 },
  calendarIcon: { fontSize: 20 },
  descriptionInput: { minHeight: 76, paddingTop: 13, textAlignVertical: 'top' },
  loadingBox: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  helper: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: theme.white,
  },
  optionSelected: { borderColor: theme.primary, backgroundColor: '#EEF2FF' },
  optionText: { color: theme.muted, fontSize: 13, fontWeight: '700' },
  optionTextSelected: { color: theme.primary },
  error: { color: theme.expense, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  success: { color: theme.income, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonPressed: { opacity: 0.85 },
  saveButtonText: { color: theme.white, fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: theme.border, marginTop: 4 },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '800' },
  resources: { gap: 24 },
});
