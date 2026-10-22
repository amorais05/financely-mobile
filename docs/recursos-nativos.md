# Recursos nativos — câmera, localização, permissões e notificações

Implementação da branch `feature/recursos-nativos`, responsável pela parte de Michelli no trabalho final de Desenvolvimento para Dispositivos Móveis.

## Referência da disciplina

A implementação foi adaptada a partir do projeto `MeuAppExpo` do professor, no commit permanente:

`7ece43eb78797c93b34e82625b7b8711b4750349`

No exemplo da disciplina, os recursos ficam centralizados em `MeuAppExpo/src/services/nativos.js`. No Financely a mesma ideia foi mantida em TypeScript através de `src/services/nativeResources.ts`.

## Compatibilidade com Expo SDK 58

A branch parte da base do projeto em Expo SDK 58 e usa os módulos compatíveis com essa linha:

- `expo-image-picker ~58.0.10`
- `expo-location ~58.0.18`
- `expo-notifications ~58.1.6`

As dependências devem ser instaladas localmente antes dos testes:

```bash
npm install
npx expo-doctor@latest
npm run typecheck
npx expo start -c
```

O `package-lock.json` deve ser regenerado pelo `npm install` e revisado antes de o pull request sair de draft.

## Câmera para comprovantes

A câmera é aberta através de `expo-image-picker`, seguindo a abordagem do exemplo do professor.

Fluxo implementado:

1. O usuário toca em **Fotografar comprovante**.
2. A permissão da câmera é solicitada somente nesse momento.
3. Se concedida, a câmera do sistema é aberta.
4. A foto capturada é exibida em prévia.
5. É possível tirar outra foto ou remover o comprovante.
6. Cancelar a câmera não bloqueia nem gera falha no lançamento.
7. Se a permissão estiver bloqueada, o app oferece acesso às configurações do dispositivo.

A imagem permanece como URI local nesta etapa. O envio do arquivo ao backend não faz parte deste requisito.

## Geolocalização

O aplicativo solicita apenas localização em primeiro plano.

Fluxo implementado:

1. O usuário toca em **Usar localização atual**.
2. A permissão é solicitada de forma contextual.
3. O app verifica se os serviços de localização estão ativos.
4. A posição atual é obtida com precisão balanceada.
5. Latitude, longitude e precisão são exibidas na tela.
6. É possível atualizar ou remover a localização.
7. Recusa de permissão ou GPS desligado não impedem o uso do restante do app.

Não há rastreamento em segundo plano.

## Permissões e estados de erro

Câmera, localização e notificações seguem o mesmo princípio:

- a permissão só é solicitada quando o recurso é usado;
- uma recusa simples mostra uma explicação e mantém o app funcional;
- quando `canAskAgain` é `false`, é oferecido acesso às configurações do dispositivo;
- recursos nativos são tratados como indisponíveis na versão web;
- nenhum recurso recusado impede a navegação ou o uso básico do Financely.

## Notificação local

O Calendário possui um lembrete financeiro demonstrável.

Ao tocar em **Testar lembrete em 10 segundos**:

1. no Android é criado o canal `financial-reminders`;
2. a permissão de notificações é consultada e, se necessário, solicitada;
3. uma notificação local é agendada para aproximadamente 10 segundos;
4. o aviso exibe o título `Financely • Lembrete financeiro` e uma mensagem para registrar as despesas do dia.

Não é utilizado push remoto, Expo Push Token, FCM ou APNs.

## Roteiro de testes em celular real

### Câmera

- [ ] Conceder permissão e capturar comprovante.
- [ ] Confirmar exibição da prévia.
- [ ] Tirar outra foto.
- [ ] Remover a foto.
- [ ] Cancelar a câmera e continuar no app.
- [ ] Negar permissão e confirmar que o app não trava.
- [ ] Bloquear a permissão e testar **Abrir configurações**.

### Localização

- [ ] Conceder permissão e visualizar latitude/longitude.
- [ ] Conferir exibição da precisão.
- [ ] Atualizar a localização.
- [ ] Remover a localização.
- [ ] Negar permissão e continuar usando o app.
- [ ] Desativar a localização/GPS e conferir o estado de indisponibilidade.

### Notificações

- [ ] Conceder permissão.
- [ ] Agendar lembrete em 10 segundos.
- [ ] Confirmar a chegada da notificação local.
- [ ] Testar com o app aberto.
- [ ] Testar com o app em segundo plano.
- [ ] Negar permissão e confirmar que o app continua utilizável.

## Evidências para a entrega

Registrar capturas ou vídeo curto contendo:

1. solicitação de permissão da câmera;
2. câmera aberta;
3. foto do comprovante e prévia;
4. solicitação de localização;
5. coordenadas exibidas;
6. estado de permissão recusada sem travamento;
7. solicitação de notificações;
8. lembrete agendado;
9. notificação aparecendo no dispositivo.

## Limitações conhecidas

- A foto do comprovante ainda não é enviada nem persistida no backend.
- A localização é usada apenas em primeiro plano e não há rastreamento em background.
- As notificações implementadas são exclusivamente locais.
- Os textos personalizados de permissões definidos em `app.json` são aplicados ao binário nativo; durante testes no Expo Go o sistema pode exibir textos relacionados ao próprio Expo Go.
- A câmera deve ser validada preferencialmente em dispositivo físico; simuladores podem não representar o comportamento real da câmera.

## Arquivos principais

```text
src/services/nativeResources.ts
src/components/ReceiptCapture.tsx
src/components/CurrentLocation.tsx
src/components/FinancialReminder.tsx
src/screens/NewTransactionScreen.tsx
src/screens/CalendarScreen.tsx
app.json
package.json
```

A implementação não altera os serviços de autenticação nem o armazenamento seguro do token, que permanecem sob responsabilidade da branch de autenticação.
