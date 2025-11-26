
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
  rewards: [ { title: string, cost: number } ]
}
```

Observações importantes sobre o histórico
-----------------------------------------
- Quando um resgate é feito, a entrada no histórico é criada com `type: 'reward'` e `delta` negativo (ex: -50).
- Ao estornar um resgate, a função `undoRedeem(childIndex, historyIndex)`:
	- soma o valor positivo equivalente aos pontos devolvidos no total do filho;
	- marca a entrada original com `reversed = true`;
	- adiciona uma nova entrada `type: 'reversal'` com `delta` positivo e descrição `Estorno: ...`.
- O cálculo de relatórios foi ajustado para que o total de "Recompensas" mostre o valor líquido (reward + reversal = 0) — ou seja, estornos neutralizam o efeito do resgate no relatório rápido.

Controle por período e filtro de histórico
-----------------------------------------
- Existe um seletor no topo (`Período`) com as opções: `Semana`, `Mês`, `Todo`, `Personalizado`.
- `Personalizado` habilita dois campos `datetime-local` (início/fim) e um botão `Aplicar`.
- A função `getReportRange()` calcula `{ from, to }` com base no seletor e nos inputs customizados.
- `renderHistory(index, range)` agora filtra as entradas do histórico pelo intervalo (`from <= at <= to`) antes de renderizar.
- O botão `Estornar` renderizado ao lado de um `reward` usa o índice global da entrada no array real de histórico (para que `undoRedeem(childIndex, historyIndex)` aja sobre a entrada correta, mesmo quando a lista exibida está filtrada).

Datas e registro de eventos
---------------------------
- Cada cartão tem `datetime-local` para ações (`date-<index>`) e para resgates (`redeem-date-<index>`).
- Ao aplicar pontos (via `applyCustom`, `+10`, `-5` ou `Resgatar`), o valor do campo `datetime-local` é usado para gravar `at` como uma ISO string — permitindo histórico com datas passadas.

Funcionalidades técnicas (implementação)
--------------------------------------
- `renderChildren()` — gera o HTML dos cartões das crianças dinamicamente e exibe um resumo rápido por período (semana/mês) e o histórico filtrado pela seleção atual.
- `redeemReward(childIndex)` — lê a opção selecionada (com fallback caso `value` não seja um número) e aplica o custo; aceita um `redeem-date` opcional.
- `undoRedeem(childIndex, historyIndex)` — realiza o estorno: atualiza pontos, marca `reversed` e adiciona entrada `reversal` com `delta` positivo.
- `periodSum(history, fromDate)` — calcula somatórios para relatório semanal/mensal e foi ajustada para considerar `reward` e `reversal`.

Service Worker
--------------
- Cache names:
	- `pwa-cache-static-v6` (assets estáticos)
	- `pwa-cache-html-v6` (HTML cache)
- Estratégia resumida:
	- Requisições de navegação/HTML: network-first, depois cache se offline.
	- Assets em `ASSETS`: cache-first (atualizados via nova versão do SW).
- Ao clicar em "Zerar dados" o app também limpa caches cujo nome contém `pwa-cache`.

Testes manuais recomendados
--------------------------
1. Abrir `index.html` no navegador (ou recarregar se já aberto).
2. Adicionar um filho (`Adicionar`) e verificar cartão gerado.
3. Conceder pontos com `+10` e confirmar histórico (use o campo de data para variar a data do evento).
4. Adicionar recompensa no catálogo e resgatar:
	- Selecionar a recompensa no `select` e clicar `Resgatar`;
	- Validar que pontos foram deduzidos e histórico recebeu entrada `reward` com a data escolhida.
5. Testar filtros de período:
	- No topo, altere `Período` para `Semana`/`Mês`/`Todo` e observe o histórico filtrado;
	- Escolha `Personalizado`, defina intervalo que inclua/exclua entradas e clique `Aplicar` para ver apenas as entradas naquele intervalo.
6. Estornar o resgate:
	- No histórico filtrado (ou `Todo`), clique em `Estornar` ao lado da entrada de resgate;
	- Validar pontos restaurados, entrada `reversal` adicionada e resgate marcado como `(Estornado)`;
	- Confirmar em `Relatório rápido` que o campo "Recompensas" mostra o valor líquido.
7. Testar modo offline: instalar PWA ou abrir devtools → Offline e navegar pelo app para confirmar que recursos essenciais continuam funcionando.

Changelog (v6)
--------------
- Corrigido bug no botão "Resgatar" relacionado ao `select` e seus valores.
- Implementado fallback mais robusto em `redeemReward` para ler o índice da opção corretamente.
- Adicionado funcionalidade de `Estornar` (undoRedeem) que devolve pontos e registra reversão no histórico.
- Ajustado `periodSum` para contabilizar estornos e apresentar relatórios líquidos.
- Adicionado filtro de histórico por período e suporte a intervalos customizados (`getReportRange` + `renderHistory` filtrada).
- Adicionado suporte a datas para ações via `datetime-local` (registro de eventos no passado).
- Service Worker com versionamento `v6` (parcialmente para forçar atualização de cache).

Próximos passos (opcionais)
---------------------------
- Remover escapes extras no template das `<option>` em `renderChildren` (limpeza de código) — compatível mas opcional.
- Refatorar para extração do JavaScript para arquivo separado (`app.js`) para facilitar testes e manutenção.
- Converter handlers inline para delegação de eventos para melhorar testabilidade e separação de responsabilidades.
- Adicionar testes automatizados (unitários para funções de cálculo e integração simples).

Como commitar e publicar (exemplo)
---------------------------------
```
git init
git add .
git commit -m "v6: corrige resgatar, adiciona estorno, datas e filtro por período"
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

Arquivo atualizado automaticamente com mudanças e arquitetura em 25/11/2025.

