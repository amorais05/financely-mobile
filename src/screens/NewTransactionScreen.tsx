import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CurrentLocation } from '../components/CurrentLocation';
import { ReceiptCapture } from '../components/ReceiptCapture';
import { ScreenLayout } from '../components/ScreenLayout';

export default function NewTransactionScreen() {
  return (
    <ScreenLayout
      title="Novo lançamento"
      description="Cadastre receitas e despesas e, se desejar, adicione um comprovante e sua localização atual."
    >
      <View style={styles.resources}>
        <ReceiptCapture />
        <CurrentLocation />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  resources: { gap: 24 },
});
