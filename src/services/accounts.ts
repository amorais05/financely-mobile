import { API_BASE_URL } from './api';
import type { Session } from './auth';

export type FinancialAccount = {
  id_conta: number;
  nome_conta: string;
  tipo_conta?: string;
  saldo_atual?: number | string;
  saldo_inicial?: number | string;
  agencia?: string | null;
  numero_conta?: string | null;
};

export type AccountInput = {
  nome_conta: string;
  tipo_conta: string;
  saldo_inicial: number;
  agencia: string;
  numero_conta: string;
};

async function request<T>(session: Session, path: string, method = 'GET', body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('Sem conexão com o servidor. Verifique a internet.');
  }
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || data.error || 'Não foi possível concluir a operação.');
  return data as T;
}

export async function getAccounts(session: Session): Promise<FinancialAccount[]> {
  const data = await request<unknown>(session, `/listar-contas?id_usuario=${encodeURIComponent(String(session.id_usuario))}`);
  if (!Array.isArray(data)) throw new Error('Resposta inválida ao consultar as contas.');
  return data as FinancialAccount[];
}

export async function saveAccount(session: Session, input: AccountInput, id?: number): Promise<void> {
  await request(session, id ? `/editar-conta/${encodeURIComponent(String(id))}` : '/cadastrar-conta', id ? 'PUT' : 'POST', {
    id_usuario: session.id_usuario,
    ...input,
  });
}

export async function deleteAccount(session: Session, id: number): Promise<void> {
  await request(session, `/excluir-conta/${encodeURIComponent(String(id))}`, 'DELETE');
}
