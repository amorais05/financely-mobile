import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { logout, restoreSession, type Session } from '../services/auth';
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

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const tabs: { screen: Tab; label: string; icon: IconName; activeIcon: IconName }[] = [
  { screen: 'Início', label: 'Início', icon: 'home-outline', activeIcon: 'home' },
  { screen: 'Lançamentos', label: 'Histórico', icon: 'receipt-outline', activeIcon: 'receipt' },
  { screen: 'Novo', label: 'Novo', icon: 'add', activeIcon: 'add' },
  { screen: 'Calendário', label: 'Agenda', icon: 'calendar-outline', activeIcon: 'calendar' },
  { screen: 'Perfil', label: 'Perfil', icon: 'person-outline', activeIcon: 'person' },
];

export default function AppNavigator() {
  const [screen, setScreen] = useState<Screen | 'Boas-vindas'>('Boas-vindas');
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then(saved => {
        if (!active) return;
        setSession(saved);
        if (saved) setScreen('Início');
      })
      .finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setSession(null);
      setScreen('Boas-vindas');
    } catch {
      // Mantém acesso protegido caso não seja possível remover a sessão segura.
    }
  }

  if (restoring) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator style={{ flex: 1 }} color={theme.primary} size="large" />
      </SafeAreaView>
    );
  }

  const currentScreen = !session &&
    (tabs.some(tab => tab.screen === screen) || screen === 'Contas' || screen === 'Categorias')
    ? 'Login' : screen;

  function renderScreen() {
    switch (currentScreen) {
      case 'Boas-vindas': return <WelcomeScreen />;
      case 'Login': return <LoginScreen onLogin={saved => { setSession(saved); setScreen('Início'); }} />;
      case 'Cadastro': return <RegisterScreen onRegistered={() => setScreen('Login')} />;
      case 'Início': return <DashboardScreen />;
      case 'Lançamentos': return <TransactionsScreen />;
      case 'Novo': return <NewTransactionScreen />;
      case 'Calendário': return <CalendarScreen />;
      case 'Perfil': return <ProfileScreen />;
      case 'Contas': return <AccountsScreen />;
      case 'Categorias': return <CategoriesScreen />;
      default: return <WelcomeScreen />;
    }
  }

  const privateArea = Boolean(session) &&
    (tabs.some(tab => tab.screen === screen) || screen === 'Contas' || screen === 'Categorias');
  const profileArea = screen === 'Perfil' || screen === 'Contas' || screen === 'Categorias';
  const activeTab: Tab = screen === 'Contas' || screen === 'Categorias' ? 'Perfil' : screen as Tab;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.main}>{renderScreen()}</View>

      {!privateArea && (
        <View style={styles.authBar}>
          <SmallAction label="Boas-vindas" onPress={() => setScreen('Boas-vindas')} />
          <SmallAction label="Login" onPress={() => setScreen('Login')} />
          <SmallAction label="Cadastro" onPress={() => setScreen('Cadastro')} />
        </View>
      )}

      {privateArea && (
        <>
          {profileArea && (
            <View style={styles.profileActions}>
              <SmallAction label="Contas" icon="wallet-outline" active={screen === 'Contas'} onPress={() => setScreen('Contas')} />
              <SmallAction label="Categorias" icon="pricetags-outline" active={screen === 'Categorias'} onPress={() => setScreen('Categorias')} />
              <SmallAction label="Sair" icon="log-out-outline" onPress={() => { void handleLogout(); }} />
            </View>
          )}
          <View style={styles.tabBar} accessibilityRole="tablist">
            {tabs.map(tab => {
              const active = tab.screen === activeTab;
              if (tab.screen === 'Novo') {
                return (
                  <Pressable
                    key={tab.screen}
                    accessibilityRole="button"
                    accessibilityLabel="Novo lançamento"
                    accessibilityState={{ selected: active }}
                    onPress={() => setScreen('Novo')}
                    style={styles.addTab}
                  >
                    <View style={[styles.addCircle, active && styles.addCircleActive]}>
                      <Ionicons name="add" size={29} color={theme.white} />
                    </View>
                    <Text style={[styles.tabLabel, active && styles.activeLabel]}>Novo</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={tab.screen}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => setScreen(tab.screen)}
                  style={styles.tab}
                >
                  <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
                    <Ionicons name={active ? tab.activeIcon : tab.icon} size={23} color={active ? theme.primary : theme.muted} />
                  </View>
                  <Text style={[styles.tabLabel, active && styles.activeLabel]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function SmallAction({ label, onPress, icon, active = false }: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  active?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.smallAction, active && styles.smallActionActive]}>
      {icon && <Ionicons name={icon} size={16} color={active ? theme.primary : theme.muted} />}
      <Text style={[styles.smallActionText, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  main: { flex: 1 },
  authBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.white, borderTopWidth: 1, borderTopColor: theme.border },
  profileActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: theme.background },
  smallAction: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 12, backgroundColor: theme.white, borderWidth: 1, borderColor: theme.border },
  smallActionActive: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  smallActionText: { fontSize: 12, color: theme.muted, fontWeight: '700' },
  tabBar: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: theme.white, borderTopWidth: 1, borderTopColor: theme.border, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 9 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 57, gap: 4 },
  iconContainer: { width: 50, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  activeIconContainer: { backgroundColor: '#EEF2FF' },
  tabLabel: { fontSize: 10, color: theme.muted, fontWeight: '700' },
  activeLabel: { color: theme.primary, fontWeight: '800' },
  addTab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 57, gap: 3 },
  addCircle: { width: 49, height: 49, marginTop: -17, borderRadius: 17, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: theme.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  addCircleActive: { backgroundColor: theme.primaryDark },
});
