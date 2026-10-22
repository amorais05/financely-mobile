import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './api';

const SESSION_KEY = 'financely.session.v1';

export type Session = {
  token: string;
  id_usuario: number;
  nome: string;
  expiresAt: number;
};

async function request(path: string, body: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
  }
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a solicitação.');
  return data;
}

export async function login(email: string, senha: string): Promise<Session> {
  const data = await request('/login', { email: email.trim().toLowerCase(), senha });
  if (!data.auth || typeof data.token !== 'string' || !data.id_usuario) {
    throw new Error('Resposta de autenticação inválida.');
  }
  const session: Session = {
    token: data.token,
    id_usuario: Number(data.id_usuario),
    nome: String(data.nome || ''),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function register(nome: string, email: string, senha: string): Promise<void> {
  await request('/registrar', { nome: nome.trim(), email: email.trim().toLowerCase(), senha });
}

export async function restoreSession(): Promise<Session | null> {
  try {
    const saved = await SecureStore.getItemAsync(SESSION_KEY);
    if (!saved) return null;
    const session = JSON.parse(saved) as Session;
    if (!session.token || !session.id_usuario || !session.expiresAt || Date.now() >= session.expiresAt) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
