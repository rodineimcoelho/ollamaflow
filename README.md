# Ollama Balancer

Ollama Balancer é um gateway desenvolvido em NestJS para balanceamento de carga entre múltiplas instâncias do Ollama, otimizando o uso de LLMs em containers distintos. O sistema distribui requisições de geração de texto de forma inteligente, levando em conta o tempo estimado de processamento de cada container, a fila de tokens e o desempenho de cada instância.

## Funcionalidades

- Balanceamento de carga entre múltiplos containers Ollama
- Estimativa de tempo de resposta baseada em tokens e desempenho
- Fila de requisições com priorização
- API REST para geração de texto
- Monitoramento de saúde da aplicação

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose

## Instalação local

Caso prefira rodar o projeto localmente, siga os passos abaixo:

1. Clone o repositório e acesse a pasta do projeto:

   ```bash
   git clone https://github.com/rodineimcoelho/ollama-balancer.git
   cd ollama-balancer
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:

   - Copie o arquivo `.env.example` para `.env` e ajuste os valores conforme necessário.

4. Certifique-se de que o Redis e as instâncias do Ollama estejam rodando.

   > **Importante:** Após subir os containers, adicione as informações de cada instância Ollama no arquivo `containers.config.json`, localizado na raiz do projeto. Esse arquivo deve conter a configuração (host, porta, etc.) de cada container Ollama que será utilizado pelo balancer.

5. Inicie a aplicação em modo desenvolvimento:

   ```bash
   npm run start:dev
   ```

A API estará disponível em `http://localhost:3000`.

## Como executar o projeto

Basta executar o comando abaixo para subir todas as dependências (Redis, Ollama) e a aplicação NestJS:

```bash
docker-compose up -d
```

A API estará disponível em `http://localhost:3000`.

> **Atenção:** Após subir os containers, é necessário instalar manualmente os modelos desejados em cada container Ollama utilizando o comando `ollama pull <nome-do-modelo>`. Certifique-se de acessar cada container e instalar os modelos que pretende utilizar.

## Configuração de variáveis de ambiente

O projeto utiliza variáveis de ambiente para configurar portas, conexão com Redis e parâmetros de concorrência. Para isso, utilize um arquivo `.env` na raiz do projeto. Um exemplo de configuração está disponível no arquivo `.env.example`. Basta copiá-lo e renomear para `.env`, ajustando os valores conforme necessário.

## Geração

Após iniciar a aplicação, faça uma requisição POST para o endpoint `/ollama/generate`:

Exemplo usando `curl`:

```bash
curl -X POST http://localhost:3000/ollama/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explique o que é balanceamento de carga.",
    "model": "tinyllama"
  }'
```

A resposta será um JSON com o resultado da geração do modelo.

## Testes de Carga

Para realizar testes de carga, utilize os scripts K6 disponíveis no diretório `k6`. (É necessário ter o k6 instalado).

## Estrutura do Projeto

- `src/` - Código-fonte principal
- `docker-compose.yaml` - Orquestração dos containers
- `containers.config.json` - Configuração dos containers Ollama
