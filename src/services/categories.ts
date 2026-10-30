import { API_BASE_URL } from './api';
import type { Session } from './auth';

export type FinancialCategory = {
  id_categoria: number;
  nome_categoria: string;
  id_usuario: number | null;
};

function headers(session: Session, json = false): Record<string, string> {
  return {
    Authorization: `Bearer ${session.token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function checked(response: Response): Promise<any> {
  const raw = await response.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
  if (!response.ok) throw new Error(data.erro || data.error || `Erro ao comunicar com o servidor (${response.status}).`);
  return data;
}

export async function fetchCategories(session: Session): Promise<FinancialCategory[]> {
  const data = await checked(await fetch(`${API_BASE_URL}/listar-categorias?id_usuario=${encodeURIComponent(String(session.id_usuario))}`, {
    headers: headers(session),
  }));
  if (!Array.isArray(data)) throw new Error('O servidor não retornou uma lista válida de categorias.');
  return data.map((item: any) => ({
    id_categoria: Number(item.id_categoria),
    nome_categoria: String(item.nome_categoria || ''),
    id_usuario: item.id_usuario == null ? null : Number(item.id_usuario),
  }));
}

export async function createCategory(session: Session, name: string): Promise<void> {
  await checked(await fetch(`${API_BASE_URL}/categorias`, {
    method: 'POST', headers: headers(session, true),
    body: JSON.stringify({ nome_categoria: name.trim(), id_usuario: session.id_usuario }),
  }));
}

// A UI só deve chamar edição/exclusão para categorias personalizadas do usuário.
// O backend atual ainda precisa validar ownership nos endpoints mutáveis.
export async function updateCategory(session: Session, category: FinancialCategory, name: string): Promise<void> {
  if (category.id_usuario !== session.id_usuario) throw new Error('Categorias padrão não podem ser editadas.');
  await checked(await fetch(`${API_BASE_URL}/editar-categoria/${category.id_categoria}`, {
    method: 'PUT', headers: headers(session, true),
    body: JSON.stringify({ nome_categoria: name.trim() }),
  }));
}

export async function deleteCategory(session: Session, category: FinancialCategory): Promise<void> {
  if (category.id_usuario !== session.id_usuario) throw new Error('Categorias padrão não podem ser excluídas.');
  await checked(await fetch(`${API_BASE_URL}/excluir-categoria/${category.id_categoria}`, {
    method: 'DELETE', headers: headers(session),
  }));
}
