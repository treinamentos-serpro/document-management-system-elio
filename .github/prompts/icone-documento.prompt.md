---
description: Encontra no Iconify o ícone mais adequado para um documento e orienta sua associação no DMS.
name: icone-documento
argument-hint: extensão ou nome do arquivo; descrição opcional do conteúdo
agent: agent
---

# Associar ícone a documento

Identifique o ícone mais adequado para o documento informado em `${input:documento:extensão ou nome do arquivo}`. Considere também `${input:contexto:descrição opcional do conteúdo ou finalidade}` quando fornecido.

## Pesquisa no Iconify

- Consulte a busca oficial do Iconify em `https://api.iconify.design/search?query={termos}` para encontrar ícones candidatos por tipo, extensão e significado. Codifique os termos da URL e, se necessário, refine a pesquisa com sinônimos em inglês.
- Confirme que o identificador retornado existe no catálogo consultando `https://api.iconify.design/{prefix}/{name}.json` antes de recomendá-lo. Use o identificador completo no formato `prefix:name`.
- Prefira um ícone específico para o formato quando existir; caso contrário, escolha um ícone que represente o conteúdo ou finalidade. Não invente identificadores nem confunda o ícone do formato com o ícone de um aplicativo que o abre.
- Se não for possível acessar a API, informe essa limitação e não afirme que um resultado foi verificado. Sugira uma alternativa claramente identificada como não verificada.

## Associação no DMS

- Examine a estrutura existente e aplique a associação na listagem de documentos, usando os metadados disponíveis, como `originalName` e, se houver, MIME type ou descrição. Não presuma propriedades que não existam.
- Dê prioridade à extensão do arquivo; use conteúdo ou finalidade apenas quando houver descrição textual disponível. Não leia nem envie o conteúdo binário do documento, nomes de arquivos ou dados privados a serviços externos.
- Crie uma resolução determinística com fallback genérico para extensões desconhecidas. Trate maiúsculas/minúsculas e nomes sem extensão.
- Reutilize a abordagem de ícones já presente no projeto. Se não houver uma, escolha a integração Iconify mais simples e compatível com a stack existente; evite fazer uma chamada à API de busca por documento ou a cada renderização.
- Preserve acessibilidade: ícones decorativos devem ser ocultos de leitores de tela; forneça texto acessível quando o ícone transmitir informação que não esteja visível de outra forma.
- Atualize ou acrescente testes focados para os mapeamentos principais e para o fallback, seguindo os padrões do repositório.

Ao concluir, informe o identificador Iconify selecionado para cada tipo coberto, a regra usada para associá-lo, os arquivos alterados e as verificações executadas. Se a tarefa for apenas recomendar um ícone, apresente o identificador e a justificativa sem alterar arquivos do projeto.
