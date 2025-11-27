# Rotinas & Pontos (PWA) — v7

Aplicativo PWA leve para controle de pontos, resgate de recompensas e registro de atividades para crianças. Projetado para funcionar offline e ser instalado como app na tela inicial.

Principais mudanças e recursos (v7)
---------------------------------
- Navegação com páginas: `Home`, `Recompensas`, `Atividades`, `Metas`, `Relatório`.
- `Atividades`: cadastro de tarefas com pontos (podem ser positivos ou negativos) e aplicação rápida a partir do cartão da criança.
- Estorno de atividades: agora é possível estornar atividades, assim como recompensas. Implementado `undoActivity(childIndex, historyIndex)` que marca a entrada como `reversed` e adiciona uma entrada de `type: 'reversal'`.
- Normalização de datas: todos os inputs de data usam `type="date"` e as datas são armazenadas no histórico no formato `YYYY-MM-DD` (string), sem hora.
- Compatibilidade com histórico antigo: o `renderHistory` detecta lançamentos antigos (ex.: `'plus'`/`'minus'` com descrição `Atividade:` ou `Desconto:`) e os trata como atividades para permitir estorno.
- Correção visual: a cor do balão de pontos no histórico agora é decidida pelo valor (`delta`) para entradas de `type: 'activity'` — pontos positivos ficam verdes e negativos vermelhos.
- Relatório: seleção rápida de período (Semana/Mês/Todo/Personalizado) e preservação dos filtros ao trocar de criança.

Arquitetura e principais arquivos
--------------------------------
- `index.html` — aplicação single-file; contém toda a lógica JavaScript embutida (renderização, armazenamento, UI e navegação entre páginas).
- `service-worker.js` — service worker (estratégias de cache; observe que nomes de cache histórico incluem `v6`).
- `manifest.json` e `icons/` — metadados PWA e imagens.

Modelo de dados (localStorage)
-----------------------------
Estado salvo em `localStorage` na chave `pwa_points_state_v6`.
Estrutura principal do `state` (resumida):

```js
{
  children: [
    {
      name: string,
      points: number,
      photo: string|null, // dataURL
      goals: { weekly: number, monthly: number },
      history: [
        { type: 'plus'|'minus'|'reward'|'activity'|'reversal', delta: number, desc: string, at: 'YYYY-MM-DD', reversed?: true }
      ]
    }
  ],
  rewards: [ { title: string, cost: number } ],
  activities?: [ { title: string, points: number } ]
}
```

Notas importantes
-----------------
- `state.activities` armazena atividades cadastradas; cada aplicação cria uma entrada de `type: 'activity'` com `delta` igual aos pontos da atividade.
- Estornos geram entradas `type: 'reversal'` e marcam a entrada original com `reversed: true`.
- Para compatibilidade com dados anteriores, `renderHistory` considera descrições que começam com `Atividade:` ou `Desconto:` como atividades, mesmo que `type` seja `'plus'`/`'minus'`.

Correções visuais
-----------------
- O componente que mostra o valor (`pill`) agora define a classe com base no `type` e, para `activity`, com base no `delta`:
  - `plus` (verde) para valores positivos
  - `minus` (vermelho) para valores negativos
  - `reward` (azul) para resgates

Testes manuais recomendados
--------------------------
1. Sirva o projeto por HTTP (não usar `file://`):

```bash
python -m http.server 8000
# ou
npx http-server . -p 8000
```

2. Abra `http://localhost:8000` e teste os fluxos:
   - Criar filho, aplicar atividade (positivo/negativo) e verificar cor do balão;
   - Estornar uma atividade e confirmar devolução de pontos e registro de `reversal`;
   - Resgatar recompensa e estornar para comparar comportamento;
   - Usar o relatório filtrando por criança e período.

Changelog resumido
------------------
- v7: adiciona páginas (Home, Recompensas, Atividades, Metas, Relatório).
- v7: atividades com pontos positivos/negativos; aplicação direta no cartão.
- v7: estorno para atividades implementado (`undoActivity`).
- v7: mudança para inputs `date` e armazenamento `YYYY-MM-DD`.
- v7: correção de cor do balão de pontos no histórico.

Próximos passos opcionais
-------------------------
- Limpar escapes nas templates de `<option>` em `index.html`.
- Extrair o JS para `app.js` para facilitar testes e manutenção.
- Criar commit/branch e publicar no repositório remoto, se desejar.

Data da atualização: 26/11/2025
