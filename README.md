
# Rotinas & Pontos (PWA) — v6

Aplicativo PWA leve para controle de pontos e resgate de recompensas para crianças. Projetado para funcionar offline e ser instalado como app na tela inicial.

Principais características
-------------------------
- Adição de filhos com pontos, foto e metas (semanal/mensal).
- Catálogo de recompensas configurável (título + custo em pontos).
- Registro de histórico de pontos (acréscimos, descontos, resgates e estornos).
- Resgate de recompensas com validação (pontos suficientes) e possibilidade de estorno.
- Filtro de histórico por período (Semana, Mês, Todo, Personalizado).
- Suporta registro de data/hora para cada ação via `datetime-local` (permite inserir eventos no passado).
- Funciona offline via Service Worker; versão da cache: `v6`.

Arquitetura e principais arquivos
--------------------------------
- `index.html` — aplicação single-file; contém toda a lógica JavaScript embutida (renderização, armazenamento, UI).
- `service-worker.js` — service worker com estratégia:
	- Network-first para requisições HTML (garante atualização rápida)
	- Cache-first para assets estáticos listados em `ASSETS` (ícones, manifest)
	- Versionamento de caches com `v6` para forçar atualização quando necessário.
- `manifest.json` e `icons/` — metadados PWA e imagens.

Modelo de dados (localStorage)
-----------------------------
O estado da aplicação é salvo em `localStorage` na chave `pwa_points_state_v6`.
Estrutura principal do `state`:

```
{
```markdown

# Rotinas & Pontos (PWA) — v7

Aplicativo PWA leve para controle de pontos, resgate de recompensas e registro de atividades para crianças. Projetado para funcionar offline e ser instalado como app na tela inicial.

Principais características (v7)
-----------------------------
- Menu de navegação com páginas: `Home`, `Recompensas`, `Atividades`, `Metas`, `Relatório`.
- Dashboard `Home` com cartões por criança (visualização de pontos, metas, histórico e ações rápidas).
- Página `Recompensas` para gerenciar catálogo (adicionar/remover).
- Página `Atividades` para cadastrar tarefas com pontos (agora aceitam valores positivos e negativos).
- Seletor de atividades nos cartões das crianças (aplicar atividade diretamente, como o seletor de recompensas).
- Página `Metas` para setar metas semanais e mensais por criança.
- Página `Relatório` com extrato filtrável por criança e período.
- Suporte a registro de data/hora para cada ação via `datetime-local` (permite inserir eventos no passado).
- Funciona offline via Service Worker (caches versionados — observe que o SW usa chaves com `v6`).

Arquitetura e principais arquivos
--------------------------------
- `index.html` — aplicação single-file; contém toda a lógica JavaScript embutida (renderização, armazenamento, UI e navegação entre páginas).
- `service-worker.js` — service worker com estratégia:
	- Network-first para requisições HTML
	- Cache-first para assets estáticos
	- Versionamento dos caches (nomes atuais incluem `v6`)
- `manifest.json` e `icons/` — metadados PWA e imagens.

Modelo de dados (localStorage)
-----------------------------
O estado da aplicação é salvo em `localStorage` na chave `pwa_points_state_v6`.
Estrutura principal do `state` (atualizada):

```
{
  children: [
    {
      name: string,
      points: number,
      photo: string|null, // dataURL
      goals: { weekly: number, monthly: number },
      history: [
        { type: 'plus'|'minus'|'reward'|'reversal', delta: number, desc: string, at: ISOString, reversed?: true }
      ]
    }
  ],
  rewards: [ { title: string, cost: number } ],
  activities?: [ { title: string, points: number } ]
}
```

Notas sobre `activities`:
- `state.activities` armazena as atividades cadastradas (pontos podem ser positivos ou negativos).
- Na `Home` cada cartão exibe um seletor `actSel-<index>` para aplicar rapidamente uma atividade à criança.

Histórico e estornos
--------------------
- Resgate de recompensa: `type: 'reward'` com `delta` negativo.
- Estorno: `undoRedeem(childIndex, historyIndex)` marca o resgate original (`reversed = true`) e adiciona `type: 'reversal'` com `delta` positivo.
- `periodSum` e funções de relatório contabilizam `reward` + `reversal` para apresentar valores líquidos.

Navegação e páginas
--------------------
- `goToPage(page)` — alterna páginas e executa o renderizador específico.
- Páginas e funções principais:
	- `renderHome()` — monta o dashboard principal (cards das crianças, seletor de atividades e recompensas inline).
	- `renderRewardsPage()` — gerencia recompensas (adicionar, remover).
	- `renderActivitiesPage()` — gerencia atividades (agora permite negativos).
	- `renderGoalsPage()` — configura metas por criança.
	- `renderReportPage()` — extrato filtrável por criança e período.

Datas e registro de eventos
---------------------------
- Cada ação (aplicar atividade, ajuste manual, resgate, estorno) pode usar um campo `datetime-local` para gravar `at` com uma ISO string.

Testes manuais recomendados (v7)
-------------------------------
1. Sirva o projeto por HTTP (não use `file://`) — ex: `python -m http.server` ou `npx http-server`.
2. Abra `http://localhost:8000` (ou a porta escolhida) e navegue pelas abas.
3. `Atividades`:
	- Cadastre atividades com pontos positivos e negativos;
	- Verifique tabela e remova entradas se necessário.
4. `Home`:
	- Adicione um filho e, no cartão, selecione uma atividade no dropdown e clique `Aplicar` (defina data se quiser);
	- Teste aplicar uma recompensa (resgatar) e estornar depois.
5. `Metas`:
	- Ajuste metas semanais/mensais por criança e salve;
	- Verifique barras de progresso no `Home`.
6. `Relatório`:
	- Filtre por criança e por período (Semana/Mês/Todo) para ver o extrato.
7. Offline: instalar PWA ou testar com devtools em modo offline para validar caches.

Changelog
---------
- v7: Adicionado menu e páginas: Home, Recompensas, Atividades, Metas, Relatório.
- v7: Atividades agora aceitam pontos negativos e podem ser aplicadas rapidamente pelo cartão da criança.
- v7: Seletor de atividades no `Home` (equivalente ao seletor de recompensas).
- v6 -> v7: preservadas melhorias anteriores (estorno, datas, filtro por período).

Próximos passos (opcionais)
---------------------------
- Remover escapes extras no template das `<option>` em `renderChildren` (limpeza de código).
- Extrair JS para `app.js` para facilitar testes e manutenção.
- Adicionar testes automatizados para cálculos e fluxos críticos.

Como commitar e publicar (exemplo)
---------------------------------
```
git init
git add .
git commit -m "v7: adiciona menu, páginas e suporte a atividades"
# criar repositório remoto no GitHub e adicionar remote 'origin'
git remote add origin https://github.com/<seu-usuario>/<seu-repo>.git
git push -u origin main
```

Contato / Observações finais
---------------------------
Este repositório é intencionalmente minimalista e busca simplicidade ao funcionar offline como PWA. Se quiser, posso:
- aplicar a limpeza definitiva dos `option` (removendo escapes),
- mover o JS para módulos separados,
- gerar um changelog mais formal e criar um commit com as alterações atuais.

Arquivo atualizado automaticamente com mudanças e arquitetura em 26/11/2025.

