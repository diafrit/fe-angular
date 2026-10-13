# Frontend Angular Test, Golden Raspberry Awards

Interface para consultar indicados e vencedores da categoria Pior Filme do Golden Raspberry Awards. O layout segue os anexos da avaliação: barra superior, menu lateral (Dashboard e List) e as duas views.

## Requisitos

- Dashboard com quatro painéis:
  - anos com mais de um vencedor;
  - três estúdios com mais vitórias;
  - produtores com o maior e o menor intervalo entre vitórias;
  - vencedores de um ano informado na busca.
- Lista de filmes com paginação e filtros por ano e por vencedor.
- Dados da API `https://challenge.outsera.tech/api/movies`.
- Testes unitários com Vitest e testes de ponta a ponta com Playwright.
- Interface com Spartan UI, o porte Angular do shadcn.

## Como instalar

Requer Node.js `^22.22.3`, `^24.15` ou `>=26` (exigência do Angular CLI; versões intermediárias do Node 24 não são suportadas).

```bash
npm install
npm run e2e:install
```

O `e2e:install` baixa o Chromium usado pelos testes e2e.

## Como iniciar

```bash
npm start
```

A aplicação sobe em `http://127.0.0.1:4317`.

## Como rodar os testes unitários

```bash
npm test
```

## Como rodar os testes e2e

O Playwright sobe a aplicação automaticamente (`npm start`) e reutiliza o servidor se ele já estiver no ar em `http://127.0.0.1:4317`:

```bash
npm run e2e
```

## Qualidade de código

```bash
npm run lint
npm run format:check
```

`npm run format` aplica o Prettier nos arquivos de `src` e `e2e`.
