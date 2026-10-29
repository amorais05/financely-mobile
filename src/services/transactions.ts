import { API_BASE_URL } from './api';
import type { Session } from './auth';

export type AccountOption = {
  id_conta: number;
  nome_conta: string;
  saldo_atual?: number | string;
};

export type CategoryOption = {
  id_categoria: number;
  nome_categoria: string;
};

export type TransactionMovement = 'Entrada' | 'Saída';

export type NewTransactionInput = {
  description: string;
  value: number;
  date: string;
  movement: TransactionMovement;
  accountId: number;
  categoryId: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.erro || data.error || 'Não foi possível concluir a solicitação.');
  }
  return data as T;
}

function headers(session: Session, withBody = false): Record<string, string> {
  return {
    Authorization: `Bearer ${session.token}`,
    ...(withBody ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function listAccounts(session: Session): Promise<AccountOption[]> {
  const id = encodeURIComponent(String(session.id_usuario));
  const response = await fetch(`${API_BASE_URL}/listar-contas?id_usuario=${id}`, {
    headers: headers(session),
  });
  const data = await parseResponse<unknown>(response);
  if (!Array.isArray(data)) throw new Error('O servidor retornou uma lista de contas inválida.');
  return data as AccountOption[];
}

export async function listCategories(session: Session): Promise<CategoryOption[]> {
  const id = encodeURIComponent(String(session.id_usuario));
  const response = await fetch(`${API_BASE_URL}/listar-categorias?id_usuario=${id}`, {
    headers: headers(session),
  });
  const data = await parseResponse<unknown>(response);
  if (!Array.isArray(data)) throw new Error('O servidor retornou uma lista de categorias inválida.');
  return data as CategoryOption[];
}

export async function createTransaction(session: Session, input: NewTransactionInput): Promise<void> {
  const absoluteValue = Math.abs(input.value);
  const signedValue = input.movement === 'Saída' ? -absoluteValue : absoluteValue;

  const response = await fetch(`${API_BASE_URL}/nova-transacao`, {
    method: 'POST',
    headers: headers(session, true),
    body: JSON.stringify({
      descricao: input.description.trim(),
      valor: signedValue,
      id_categoria: input.categoryId,
      id_conta: input.accountId,
      data_transacao: input.date,
      tipo_movimento: input.movement,
      id_usuario: session.id_usuario,
    }),
  });

  await parseResponse(response);
}
