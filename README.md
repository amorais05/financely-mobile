# Financely Mobile

**Disciplina:** Desenvolvimento para Dispositivos Móveis — Sistemas de Informação, Unochapecó (2026)  
**Integrantes:** Amanda Morais Martinelli e Michelli Riffel Walker

## Objetivo
Aplicativo de gestão financeira pessoal em React Native, Expo SDK 58 e TypeScript, desenvolvido como extensão do Financely Web. Utiliza o mesmo backend/API e as mesmas contas de usuário.

## Estado da implementação (22/10/2026)
- Estrutura do aplicativo, navegação e telas iniciais disponíveis.
- Login e cadastro integrados à API do Financely Web.
- Token de sessão armazenado via Expo SecureStore, com restauração de sessão e logout local.
- Login e navegação testados em iPhone com Expo.
- Telas de lançamentos, contas, categorias, calendário e perfil ainda em desenvolvimento.
- Dashboard com consultas financeiras reais em desenvolvimento na branch `feature/dashboard-real-data`, ainda não incorporada à `main`.
- Recursos nativos de câmera, geolocalização, permissões e notificações planejados para a etapa de Michelli; não estão concluídos.

## Como executar
```bash
npm install
npx expo start
```
Abra no Expo Go compatível com o SDK 58. Configure `EXPO_PUBLIC_API_URL` se necessário; o endereço padrão da API é `https://financely-app.onrender.com`. O servidor deve estar ativo para login e cadastro.

## Estrutura
- `App.tsx`: entrada do aplicativo
- `src/navigation/`: navegação e controle de sessão
- `src/screens/`: telas
- `src/services/`: autenticação e API
- `src/components/`: componentes reutilizáveis
- `src/constants/`: estilos e identidade visual
- `docs/`: documentação do projeto

## Divisão do trabalho
**Amanda:** estrutura, autenticação integrada ao Web, armazenamento seguro da sessão e integração financeira.  
**Michelli:** câmera, geolocalização, permissões e notificações locais, em etapa de implementação.

## Referências
- [Financely Web](https://financely-app.vercel.app)
- [Backend/API](https://financely-app.onrender.com)
- [Protótipo Figma](https://www.figma.com/design/zKUyXPjYlK9jF093mcPjQ8/Sem-t%C3%ADtulo?node-id=0-1)
- [Planejamento no Notion](https://app.notion.com/p/3d7a00b7303881d29c78dce3782bcd3b)

## Próximas etapas
Implementar recursos nativos, concluir integração dos dados financeiros, validar segurança das rotas e testar fluxos completos antes da entrega final.

**Observação:** não armazene senhas, tokens, credenciais de banco ou segredos no repositório.
