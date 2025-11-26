# Rotinas & Pontos (PWA) — v6

Correções importantes:
# Rotinas & Pontos (PWA) — v6

Descrição
--------
Aplicativo PWA leve para controle de pontos e resgate de recompensas para crianças. Projetado para funcionar offline e ser instalado como app na tela inicial.

Principais características
-------------------------
- Adição de filhos com pontos, foto e metas (semanal/mensal).
- Catálogo de recompensas configurável (título + custo em pontos).
- Registro de histórico de pontos (acréscimos, descontos, resgates e estornos).
- Resgate de recompensas com validação (pontos suficientes).
- Estorno de resgates (botão "Estornar" no histórico) que cria uma entrada de reversão e marca o resgate original como `reversed`.
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

Observações importantes sobre o histórico
-----------------------------------------
- Quando um resgate é feito, a entrada no histórico é criada com `type: 'reward'` e `delta` negativo (ex: -50).
- Ao estornar um resgate, a função `undoRedeem(childIndex, historyIndex)`:
	- soma o valor positivo equivalente aos pontos devolvidos no total do filho;
	- marca a entrada original com `reversed = true`;
	- adiciona uma nova entrada `type: 'reversal'` com `delta` positivo e descrição `Estorno: ...`.
- O cálculo de relatórios foi ajustado para que o total de "Recompensas" mostre o valor líquido (reward + reversal = 0) — ou seja, estornos neutralizam o efeito do resgate no relatório rápido.

Funcionalidades técnicas (implementação)
--------------------------------------
- `renderChildren()` — gera o HTML dos cartões das crianças dinamicamente.
	- Observação: o template gera `<select>` com opções de recompensas e botões inline para ações rápidas (`+10`, `-5`, `Aplicar`, `Resgatar`).
	- Nota: havia um problema anterior com escaping incorreto nas `option` (aspas escapadas), que foi tratado e estamos mantendo compatibilidade com fallback na leitura do `select`.
- `redeemReward(childIndex)` — função que lê a opção selecionada (com fallback caso `value` não seja um número) e aplica o custo.
- `undoRedeem(childIndex, historyIndex)` — função adicionada para estornar um resgate: atualiza pontos, marca `reversed` e adiciona entrada `reversal`.
- `periodSum(history, fromDate)` — função que calcula somatórios para relatório semanal/mensal; foi ajustada para considerar `reward` e `reversal` e assim apresentar valores líquidos.

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
3. Conceder pontos com `+10` e confirmar histórico.
4. Adicionar recompensa no catálogo e resgatar:
	 - Selecionar a recompensa no `select` e clicar `Resgatar`;
	 - Validar que pontos foram deduzidos e histórico recebeu entrada `reward`.
5. Estornar o resgate:
	 - Clicar em `Estornar` ao lado da entrada de resgate;
	 - Validar pontos restaurados, entrada `reversal` adicionada e resgate marcado como `(Estornado)`;
	 - Verificar em "Relatório rápido" que o campo "Recompensas" mostra o valor líquido (por exemplo 0 se resgate e estorno cancelarem).
6. Testar modo offline: instalar PWA ou abrir devtools → Offline e navegar pelo app para confirmar que recursos essenciais continuam funcionando.

Changelog (v6)
--------------
- Corrigido bug no botão "Resgatar" relacionado ao `select` e seus valores.
- Implementado fallback mais robusto em `redeemReward` para ler o índice da opção corretamente.
- Adicionado funcionalidade de `Estornar` (undoRedeem) que devolve pontos e registra reversão no histórico.
- Ajustado `periodSum` para contabilizar estornos e apresentar relatórios líquidos.
- Service Worker com versionamento `v6` (parcialmente para forçar atualização de cache).

Próximos passos (opcionais)
---------------------------
- Remover escapes extras no template das `<option>` em `renderChildren` (limpeza de código) — compatível mas opcional.
- Refatorar para extração do JavaScript para arquivo separado (`app.js`) para facilitar testes e manutenção.
- Converter handlers inline para delegação de eventos para melhorar testabilidade e separação de responsabilidades.
- Adicionar testes automatizados (unitários para funções de cálculo e integração simples).

Contato / Observações finais
---------------------------
Este repositório é intencionalmente minimalista e busca simplicidade ao funcionar offline como PWA. Se quiser, posso:
- aplicar a limpeza definitiva dos `option` (removendo escapes),
- mover o JS para módulos separados,
- gerar um changelog mais formal e criar um commit com as alterações atuais.

Arquivo atualizado automaticamente com mudanças e arquitetura em 25/11/2025.

