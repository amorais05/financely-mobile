# Financely Mobile

**Disciplina:** Desenvolvimento para Dispositivos Móveis — Sistemas de Informação, Unochapecó (2026)  
**Integrantes:** Amanda Morais Martinelli e Michelli Riffel Walker

## Proposta

Aplicativo mobile para organização financeira pessoal. É uma extensão do **Financely Web**: a proposta é compartilhar **a mesma conta, API e dados** entre as versões Web e Mobile.

## Situação atual

**Entrega da estrutura inicial do trabalho final.** Este repositório contém o esqueleto do aplicativo em React Native, Expo e TypeScript, telas iniciais e uma navegação **demonstrativa**. As telas ainda exibem textos de planejamento: login, persistência, CRUD, calendário efetivo e sincronização com o backend **não estão implementados**. O botão “Ver protótipo” não autentica o usuário.

## Tecnologias previstas

- React Native e Expo
- TypeScript
- API já existente do Financely (integração futura)

## Como executar

Requisitos: Node.js e npm. No terminal, dentro da pasta do projeto:

```bash
npm install
npx expo start
```

Abra o projeto no Expo Go compatível com a versão do SDK ou use um emulador Android. Antes de executar, pode-se configurar `EXPO_PUBLIC_API_URL` com base no `.env.example`.

## Organização do projeto

```text
financely-mobile/
├── App.tsx                     # Entrada da aplicação
├── src/
│   ├── components/             # Componentes reutilizáveis
│   ├── constants/              # Paleta e estilos
│   ├── navigation/             # Navegação demonstrativa
│   ├── screens/                # Telas do aplicativo
│   ├── services/               # Integração futura com API
│   └── types/                  # Modelos e tipos TypeScript
├── docs/                       # Requisitos e arquitetura
├── .env.example
├── .gitignore
├── app.json
├── package.json
└── tsconfig.json
```

## Telas previstas

Boas-vindas, Login, Cadastro, Dashboard, Lançamentos, Novo lançamento, Calendário, Perfil, Contas e Categorias. Inclusões, edições, filtros e confirmações de exclusão serão detalhados durante a implementação.

## Integração planejada

- [Financely Web — código](https://github.com/amorais05/financely)
- [Financely Web — aplicação](https://financely-app.vercel.app)
- [Backend / API](https://financely-app.onrender.com)
- [Protótipo Figma](https://www.figma.com/design/zKUyXPjYlK9jF093mcPjQ8/Sem-t%C3%ADtulo?node-id=0-1)

## Próximas etapas

1. Implementar autenticação compartilhada com a versão Web.
2. Implementar dashboard e listagem de lançamentos.
3. Implementar cadastro, edição e exclusão de lançamentos.
4. Gerenciar contas e categorias.
5. Implementar calendário, filtros, validações e testes.

> Este repositório não contém senhas, tokens nem chaves da API.
