import React from 'react';
import { FinancialReminder } from '../components/FinancialReminder';
import { ScreenLayout } from '../components/ScreenLayout';

export default function CalendarScreen() {
  return (
    <ScreenLayout
      title="Calendário"
      description="Acompanhe movimentações por data e teste lembretes financeiros usando notificações locais do dispositivo."
    >
      <FinancialReminder />
    </ScreenLayout>
  );
}
