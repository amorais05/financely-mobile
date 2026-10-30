import { API_BASE_URL } from './api';
import type { Session } from './auth';
import { listAccounts, listCategories } from './transactions';
export { listAccounts, listCategories };

export type FinancialTransaction = {
  id_transacao: number;
  descricao: string;
  valor: number | string;
  data_transacao: string;
  id_conta?: number;
  id_categoria?: number;
  tipo_movimento?: string;
  nome_categoria?: string;
  nome_conta?: string;
};

async function checked<T>(response: Response): Promise<T> {
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || data.error || `Falha na API (${response.status})`);
  return data as T;
}
const authHeaders = (s: Session) => ({ Authorization: `Bearer ${s.token}` });

export async function listTransactions(session: Session): Promise<FinancialTransaction[]> {
  const params = `id_usuario=${encodeURIComponent(String(session.id_usuario))}&limite=999999`;
  const result = await checked<unknown>(await fetch(`${API_BASE_URL}/listar-transacoes?${params}`, {
    headers: authHeaders(session),
  }));
  const data = result as any;
  const items = Array.isArray(data) ? data : data?.registros;
  if (!Array.isArray(items)) throw new Error('Formato inesperado na listagem de lançamentos.');
  return items.map((item: any) => ({ ...item, id_transacao: Number(item.id_transacao ?? item.id), valor: Number(item.valor) }));
}

export async function deleteTransaction(session: Session, id: number): Promise<void> {
  await checked(await fetch(`${API_BASE_URL}/deletar-transacao/${encodeURIComponent(String(id))}`, {
    method: 'DELETE', headers: authHeaders(session),
  }));
}

export async function updateTransaction(session: Session, item: FinancialTransaction): Promise<void> {
  await checked(await fetch(`${API_BASE_URL}/editar-transacao/${encodeURIComponent(String(item.id_transacao))}`, {
    method: 'PUT',
    headers: { ...authHeaders(session), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      descricao: item.descricao,
      valor: Number(item.valor),
      id_categoria: item.id_categoria,
      id_conta: item.id_conta,
      data_transacao: String(item.data_transacao).slice(0, 10),
      tipo_movimento: Number(item.valor) < 0 ? 'Saída' : 'Entrada',
    }),
  }));
}

export function brl(value: number | string | undefined): string {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function brDate(date: string): string {
  const value = String(date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return String(date || '');
  return value.split('-').reverse().join('/');
}
