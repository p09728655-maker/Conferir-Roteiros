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

### Instalar como app

- **Android / Chrome / Edge** — abra o endereço publicado e toque em **Instalar app**
  no cabeçalho (ou menu do navegador › "Instalar aplicativo").
- **iPhone / iPad (Safari)** — Compartilhar › **Adicionar à Tela de Início**.

Depois de instalado o app abre e analisa PDFs sem internet.

### Estrutura

| Arquivo | Papel |
|---|---|
| `index.html` | O app inteiro — tela, parser e regras |
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
| B1 | Quantidade fracionária do item no produto (Hrs Total < Hrs Ind.) |
| B2 | Fase fora de ordem crescente dentro do roteiro |

### Atenção — distorce custo ou carga-máquina

| Regra | Verificação |
|---|---|
| A1 | Operação sem tempo cadastrado |
| A3 | Nº de funcionários divergente para a mesma máquina entre itens |
| A4 | Item com pintura PU (fase 70) sem acabamento UV (fase 75) |
| A5 | Hrs Ind. muito fora da mediana da mesma operação no produto (provável erro de digitação) |

### Informativo — padronização de cadastro

| Regra | Verificação |
|---|---|
| I2 | Roteiro que não inicia em 010 |
| I3 | Mesma operação distribuída em máquinas diferentes |

Além dos achados, a ferramenta soma a **carga por máquina** do produto, que mostra
onde está concentrado o tempo — não a capacidade disponível.

---

## O que ela NÃO verifica

- **Consumo de material e quantidades de estrutura.** O relatório de processos não traz esses dados.
- **Coerência entre a fase do componente e a fase do roteiro.** Mesmo motivo. É a origem
  de boa parte dos erros reais de cadastro e continua exigindo conferência na tela.
- **Marcação de fim de fase.** Não consta no relatório.
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
  ignoraFunc: [],          // máquinas isentas da checagem de nº de funcionários
  tempoFora: {fator:8, min:3}, // A5: ≥8× (ou ≤1/8) da mediana da operação, mín. 3 amostras
  prefixoSemTempo: ['1']   // itens cujo tempo zerado é esperado
};
```

**`prefixoSemTempo: ['1']`** — o produto acabado (1xx) é cabeçalho de estrutura. O tempo
de embalagem fica no item de volume (5xx), não no pai. Tempo zerado ali é o cadastro correto.

**Observação por passe** — a observação em "Informação p/ OF" descreve **cada operação**,
não o total. Duas linhas "1 LD ACABAMENTO" significam dois lados, uma operação por lado.
Por isso não existe regra de operação repetida.

---

## Publicar na Vercel

Site estático com `index.html` na raiz. Não precisa de `vercel.json` nem de configuração
de build. Conecte o repositório e publique. O PWA exige HTTPS — a Vercel já entrega.

---

## Estado

Parser validado contra o relatório real da PENTEADEIRA PRINCESA BRANCO (114.003.001):
108 operações e 20 itens lidos, sem falha de leitura.

Duas regras foram removidas depois de confrontadas com a convenção real da fábrica —
geravam falso positivo. Regra que não distingue erro de padrão não deve existir.
