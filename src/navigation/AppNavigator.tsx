import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import type { Screen, Tab } from '../types';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import NewTransactionScreen from '../screens/NewTransactionScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AccountsScreen from '../screens/AccountsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';

const tabs: Tab[] = ['Início', 'Lançamentos', 'Novo', 'Calendário', 'Perfil'];

/** Navegação demonstrativa para a entrega da estrutura.
 * A autenticação real e a navegação definitiva serão implementadas posteriormente. */
export default function AppNavigator() {
  const [screen, setScreen] = useState<Screen | 'Boas-vindas'>('Boas-vindas');
  const renderScreen = () => {
    switch (screen) {
      case 'Boas-vindas': return <WelcomeScreen />;
      case 'Login': return <LoginScreen />;
      case 'Cadastro': return <RegisterScreen />;
      case 'Início': return <DashboardScreen />;
      case 'Lançamentos': return <TransactionsScreen />;
      case 'Novo': return <NewTransactionScreen />;
      case 'Calendário': return <CalendarScreen />;
      case 'Perfil': return <ProfileScreen />;
      case 'Contas': return <AccountsScreen />;
      case 'Categorias': return <CategoriesScreen />;
    }
  };
  const privateArea = tabs.includes(screen as Tab) || screen === 'Contas' || screen === 'Categorias';
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.main}>{renderScreen()}</View>
      {!privateArea && (
        <View style={styles.row}>
          <Action label="Boas-vindas" onPress={() => setScreen('Boas-vindas')} />
          <Action label="Login" onPress={() => setScreen('Login')} />
          <Action label="Cadastro" onPress={() => setScreen('Cadastro')} />
          <Action label="Ver protótipo" onPress={() => setScreen('Início')} />
        </View>
      )}
      {privateArea && (
        <>
          {screen === 'Perfil' || screen === 'Contas' || screen === 'Categorias' ? (
            <View style={styles.row}>
              <Action label="Contas" onPress={() => setScreen('Contas')} />
              <Action label="Categorias" onPress={() => setScreen('Categorias')} />
              <Action label="Sair" onPress={() => setScreen('Boas-vindas')} />
            </View>
          ) : null}
          <View style={styles.row}>{tabs.map(tab => <Action key={tab} label={tab === 'Novo' ? '+' : tab} selected={screen === tab} onPress={() => setScreen(tab)} />)}</View>
        </>
      )}
    </SafeAreaView>
  );
}
function Action({ label, onPress, selected }: { label: string; onPress: () => void; selected?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
    <Text style={[styles.actionText, selected && styles.selected]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  main: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 4, backgroundColor: theme.white, borderTopWidth: 1, borderTopColor: theme.border },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 34 },
  actionText: { fontSize: 11, fontWeight: '700', color: theme.muted, textAlign: 'center' },
  selected: { color: theme.primary },
});
