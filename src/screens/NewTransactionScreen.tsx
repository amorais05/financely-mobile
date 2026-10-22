import React from 'react';
import { ReceiptCapture } from '../components/ReceiptCapture';
import { ScreenLayout } from '../components/ScreenLayout';

export default function NewTransactionScreen() {
  return (
    <ScreenLayout
      title="Novo lançamento"
      description="Cadastre receitas e despesas e, se desejar, fotografe um comprovante diretamente pelo celular."
    >
      <ReceiptCapture />
    </ScreenLayout>
  );
}
