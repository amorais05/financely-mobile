import { API_BASE_URL } from './api';
import type { Session } from './auth';

export type HistoryTransaction = {
  id_transacao: number;
  descricao: string;
  valor: number | string;
  data_transacao: string;
  id_conta: number | null;
  id_categoria: number | null;
  nome_conta?: string;
  nome_categoria?: string;
  tipo_movimento?: string;
};

export type TransactionUpdate = {
  descricao: string;
  valor: number;
  data_transacao: string;
  id_conta: number;
  id_categoria: number;
  tipo_movimento: 'Entrada' | 'Saída';
};

async function api<T>(session: Session, path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Não foi possível conectar ao Financely. Confira sua internet.');
  }
  const result: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.erro || result.error || 'Erro ao consultar o servidor.');
  return result as T;
}

export async function loadTransactionHistory(session: Session): Promise<HistoryTransaction[]> {
  const all: HistoryTransaction[] = [];
  // A API é paginada. Carregamos em blocos para filtrar o histórico completo, não só a primeira página.
  for (let page = 1; page <= 100; page++) {
    const result = await api<{ registros: HistoryTransaction[]; temMais: boolean }>(
      session,
      `/listar-transacoes?id_usuario=${encodeURIComponent(String(session.id_usuario))}&pagina=${page}&limite=100`,
    );
    if (!Array.isArray(result.registros)) throw new Error('Formato de histórico inesperado.');
    all.push(...result.registros);
    if (!result.temMais) return all;
  }
  throw new Error('Histórico muito grande para carregar integralmente. Nenhuma alteração foi realizada.');
}

export async function updateTransaction(session: Session, id: number, input: TransactionUpdate) {
  return api(session, `/editar-transacao/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...input, valor: input.tipo_movimento === 'Saída' ? -Math.abs(input.valor) : Math.abs(input.valor) }),
  });
}

export async function deleteTransaction(session: Session, id: number) {
  return api(session, `/deletar-transacao/${id}`, { method: 'DELETE' });
}
