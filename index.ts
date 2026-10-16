export type Tab = 'Início' | 'Lançamentos' | 'Novo' | 'Calendário' | 'Perfil';
export type Screen = Tab | 'Login' | 'Cadastro' | 'Contas' | 'Categorias';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  accountId?: string;
  categoryId?: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}
