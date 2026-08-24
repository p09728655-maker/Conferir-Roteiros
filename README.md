# Conferência de Roteiro — Patrimar Móveis

App de auditoria de roteiro de produção do ERP Industrial. Lê o relatório
**Engenharia › Processos de Produção (Todos os Níveis)** em PDF e aponta
inconsistências de cadastro, agrupadas por item, com a ação recomendada para cada uma.

É um **PWA**: publicado na Vercel, instala no celular, tablet ou desktop com ícone
próprio e funciona **offline** — o pdf.js está no repositório (`vendor/`), sem CDN.
Aberto por duplo clique no `index.html` continua funcionando como página comum.

---

## Uso

1. No Industrial, gere o relatório de processos de produção do produto (todos os níveis) em PDF.
2. Abra o app e arraste (ou escolha) o PDF na área indicada.
3. Leia o veredito, corrija item por item, imprima a folha de conferência se for trabalhar na tela do ERP.
   O roteiro completo também sai no papel, pelo botão **Imprimir roteiro** dentro da tabela.

Se o PDF for digitalizado (imagem) o texto não é extraível — use a opção
"colar o texto do relatório".

### Cruzar com a estrutura (opcional)

Na tela de resultado há uma caixa para soltar um segundo PDF do mesmo produto —
**Engenharia › Estrutura Sumarizada** ou, melhor, **Engenharia › Sumarizado Nível
a Nível** (a hierarquia diz qual material pertence a qual peça e habilita a E5).
O cruzamento confere roteiro × estrutura:

| Regra | Verificação |
|---|---|
| E1 (bloqueador) | Peça fabricada na estrutura **sem roteiro** no relatório de processos — a OP não gera |
| E2 | Roteiro de peça que a estrutura não produz (roteiro órfão ou estrutura desatualizada) |
| E3 | Quantidade divergente entre estrutura e roteiro para a mesma peça |
| E4 | Estrutura consome material de uma família (PU 605, UV 604, fita de borda 609, embalagem 607) e o roteiro não tem a fase correspondente (formato Sumarizada, produto inteiro) |
| E5 | Como a E4, mas **por peça** (formato Nível a Nível): a peça consome o material e o roteiro *dela* não tem a fase — aparece no cartão do item |

O mapeamento família → fase fica em `CFG.estrutura.materialFase`. A Estrutura
Sumarizada **não traz a fase de consumo do componente** — essa coerência continua
exigindo conferência na tela (se o Industrial tiver um relatório de estrutura
analítica com a coluna de fase, ele destrava essa checagem).

### Instalar como app

- **Android / Chrome / Edge** — abra o endereço publicado e toque em **Instalar app**
  no cabeçalho (ou menu do navegador › "Instalar aplicativo").
- **iPhone / iPad (Safari)** — Compartilhar › **Adicionar à Tela de Início**.

Depois de instalado o app abre e analisa PDFs sem internet.

### Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | O app inteiro — tela, parser e regras |
| `logo-patrimar.png` | Logomarca — padrão visual dos apps Patrimar (topo e folha impressa) |
| `sw.js` | Service worker: cache offline e **versão do app** |
| `manifest.webmanifest` | Identidade do app instalado (nome, ícone, cores) |
| `vendor/` | pdf.js local (build legacy, compatível com tablets antigos) |
| `icons/` | Ícones do app |

### Publicar uma atualização

Toda mudança publicada exige **incrementar `VERSAO` no topo do `sw.js`** — é ela que
invalida o cache. No próximo acesso o app baixa a versão nova e mostra o aviso
"Nova versão do app pronta › Atualizar"; a troca só acontece quando o usuário aceita.

---

## O que ela verifica

### Bloqueador — impede a OP de gerar ou o apontamento de fechar

| Regra | Verificação |
|---|---|
| B1 | Quantidade fracionária do item no produto (pela Qtd.Estru do relatório; no formato antigo, inferida pela razão Hrs Total / Hrs Ind.). Sub-peças de lote múltiplo (sufixo .100) são isentas |
| B2 | Fase fora de ordem crescente dentro do roteiro |
| B3 | Nº de operação duplicado dentro do item — a chave da sequência da OP fica ambígua |
| B4 | Nº de operação fora de ordem crescente dentro do item — a OP roda numa sequência diferente da impressa |

### Atenção — distorce custo ou carga-máquina

| Regra | Verificação |
|---|---|
| A1 | Operação sem tempo cadastrado |
| A4 | Item com pintura PU (fase 70) sem acabamento UV (fase 75) |
| A5 | Hrs Ind. muito fora da mediana da mesma operação **na mesma máquina** no produto (provável erro de digitação) |
| A6 | Operação minoritária numa máquina que executa outra operação como padrão (ex.: PINTAR PU numa máquina que só faz PINTAR UV) |
| A7 | Operação numa fase minoritária quando o produto tem fase dominante para ela (fase errada desvia o avanço de fase); linha já apontada pela A6 não repete |

### Informativo — padronização de cadastro

| Regra | Verificação |
|---|---|
| I2 | Roteiro que não inicia em 010 |
| I3 | Mesma operação distribuída em máquinas diferentes — só quando as máquinas nunca dividem o mesmo item (máquinas juntas no mesmo item são etapas do processo) |

Além dos achados, a ferramenta soma a **carga por máquina** do produto, que mostra
onde está concentrado o tempo — não a capacidade disponível.

---

## O que ela NÃO verifica

- **Consumo de material.** O relatório de processos não traz esse dado. A quantidade de
  estrutura (Qtd.Estru) passou a vir no relatório atual: é exibida por item e conferida
  pela B1. O parser lê os dois formatos — com e sem a coluna.
- **Coerência entre a fase do componente e a fase do roteiro.** A Estrutura Sumarizada
  não traz a fase de consumo. O cruzamento (regras E) cobre parte do risco — peça sem
  roteiro, quantidade divergente, material sem fase — mas a fase de consumo em si
  continua exigindo conferência na tela.
- **Marcação de fim de fase.** Não consta no relatório.
- **Nº de funcionários.** A quantidade não tem relevância no cadastro da Patrimar
  (convenção confirmada em 24/08/2026) — a antiga regra A3 foi removida por isso.
  O dado continua saindo no CSV.
- **Se o tempo cadastrado corresponde ao tempo real.** A ferramenta confere consistência
  interna, não realidade de chão de fábrica.
- **Duplicidade de operação.** Um passe legítimo (um lado por operação) e uma linha
  duplicada por engano ficam idênticos no relatório. Não há como separar os dois.

---

## Convenções da Patrimar codificadas

Estão no objeto `CFG`, no topo do bloco `<script>`. Ajuste ali conforme a parametrização
do ERP evoluir — não é preciso mexer no resto do código.

```js
const CFG = {
  exigeFase: [ {se:70, entao:75, texto:'...'} ],  // fase que exige outra fase
  tolQtd: 0.05,            // tolerância para considerar a quantidade inteira
  sufixoLoteMultiplo: ['.100'], // sub-peças de lote múltiplo: fração de qtd é convenção, B1 não aponta
  tempoFora: {fator:8, min:3}, // A5: ≥8× (ou ≤1/8) da mediana da operação, mín. 3 amostras
  opMaquina: {minPadrao:3, fator:3}, // A6: dominante ≥3 ocorrências e ≥3× a minoritária
  opFase:    {minPadrao:3, fator:3}, // A7: mesma lógica, para a fase da operação
  prefixoSemTempo: ['1']   // itens cujo tempo zerado é esperado
};
```

**`prefixoSemTempo: ['1']`** — o produto acabado (1xx) é cabeçalho de estrutura. O tempo
de embalagem fica no item de volume (5xx), não no pai. Tempo zerado ali é o cadastro correto.

**Observação por passe** — a observação em "Informação p/ OF" descreve **cada operação**,
não o total. Duas linhas "1 LD ACABAMENTO" significam dois lados, uma operação por lado.
Por isso não existe regra de operação repetida.

**Pintura PU em etapas** — as operações "PINTAR PU" de um item passam por máquinas
diferentes da mesma linha (cabines, lixadeira) sob o mesmo nome de operação, com tempos
legitimamente diferentes. Por isso a A5 compara por operação **e** máquina, e o I3 ignora
operações cujas máquinas trabalham juntas dentro do mesmo item.

**Sub-peças de lote múltiplo (sufixo .100)** — quantidade fracionária (ex.: 0,5 por
produto) é o cadastro correto: o lote dessas peças roda fixado em múltiplo. A B1 não
as aponta (confirmado em 24/08/2026).

---

## Publicar na Vercel

Site estático com `index.html` na raiz. Não precisa de `vercel.json` nem de configuração
de build. Conecte o repositório e publique. O PWA exige HTTPS — a Vercel já entrega.

---

## Estado

Parser validado contra o relatório real da PENTEADEIRA PRINCESA BRANCO (114.003.001):
108 operações e 20 itens lidos, sem falha de leitura.

Descrição comprida não é mais cortada: a coluna Descrição do relatório corta na
largura (30 caracteres) e o excedente desce para a linha de baixo do PDF — o parser
emenda a continuação de volta. No cruzamento com a estrutura, a descrição completa
que vem de lá substitui qualquer resto de corte.

Duas regras foram removidas depois de confrontadas com a convenção real da fábrica —
geravam falso positivo. Regra que não distingue erro de padrão não deve existir.
