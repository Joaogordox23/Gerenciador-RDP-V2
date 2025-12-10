# 📘 Manual de Instalação e Configuração

## Gerenciador de Conexões Enterprise v4.1

Este manual descreve como instalar, configurar e utilizar o Gerenciador de Conexões Enterprise, uma aplicação desktop para gerenciar conexões RDP, SSH e VNC.

---

## 📋 Índice

1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação do Aplicativo](#instalação-do-aplicativo)
3. [Configuração do Servidor Guacamole](#configuração-do-servidor-guacamole)
4. [Primeiro Acesso](#primeiro-acesso)
5. [Funcionalidades Principais](#funcionalidades-principais)
6. [Solução de Problemas](#solução-de-problemas)

---

## 📦 Requisitos do Sistema

### Cliente (Aplicação Desktop)
| Componente | Requisito |
|------------|-----------|
| Sistema Operacional | Windows 10/11 (x64) |
| RAM | Mínimo 4GB |
| Disco | 500MB livres |
| Rede | Acesso à rede onde estão os servidores |

### Servidor Guacamole (Docker)
| Componente | Requisito |
|------------|-----------|
| Docker | 20.0+ |
| Docker Compose | 2.0+ |
| RAM | 2GB recomendado |
| Portas | 4822 (guacd), 8080 (WebSocket) |

---

## 💻 Instalação do Aplicativo

### Opção 1: Instalador (Recomendado)

1. Baixe o instalador `Gerenciador de Conexões Enterprise Setup.exe`
2. Execute como **Administrador**
3. Siga o assistente de instalação
4. O instalador configura automaticamente a delegação de credenciais RDP

### Opção 2: Build Manual (Desenvolvimento)

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Gerenciador-RDP-V2.git
cd Gerenciador-RDP-V2

# Instale dependências
npm install

# Reconstrua módulos nativos
npx electron-rebuild

# Execute em modo desenvolvimento
npm run electron:start

# Gere o instalador
npm run build
```

---

## 🐳 Configuração do Servidor Guacamole

O servidor Guacamole processa as conexões RDP/SSH remotamente, permitindo visualização no navegador.

### Passo 1: Acesse o Servidor Docker

```bash
ssh usuario@seu-servidor-docker
```

### Passo 2: Configure os Arquivos

Crie a estrutura de pastas:

```bash
mkdir -p guacamole-server/guacamole-lite
cd guacamole-server
```

Crie o `docker-compose.yml`:

```yaml
version: '3.8'

services:
  guacd:
    image: guacamole/guacd:latest
    container_name: guacd
    restart: unless-stopped
    ports:
      - "4822:4822"
    networks:
      - guacamole-net

  guacamole-lite:
    build: ./guacamole-lite
    container_name: guacamole-lite
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - GUACD_HOST=guacd
      - GUACD_PORT=4822
      - SECRET_KEY=GerenciadorRDPv2SecretKey123456!
    depends_on:
      - guacd
    networks:
      - guacamole-net

networks:
  guacamole-net:
    driver: bridge
```

Crie `guacamole-lite/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
```

Crie `guacamole-lite/package.json`:

```json
{
  "name": "guacamole-lite-server",
  "dependencies": {
    "guacamole-lite": "^1.2.0"
  }
}
```

Crie `guacamole-lite/server.js`:

```javascript
const GuacamoleLite = require('guacamole-lite');

const server = new GuacamoleLite(
    { port: process.env.PORT || 8080 },
    { host: process.env.GUACD_HOST, port: parseInt(process.env.GUACD_PORT) },
    { crypt: { cypher: 'AES-256-CBC', key: process.env.SECRET_KEY } }
);

console.log('✅ guacamole-lite server iniciado!');
```

### Passo 3: Inicie os Containers

```bash
docker-compose up -d
```

### Passo 4: Verifique o Status

```bash
docker-compose ps
docker-compose logs -f
```

> **⚠️ Importante:** A `SECRET_KEY` deve ter exatamente 32 caracteres e ser a mesma no servidor e no aplicativo.

---

## 🚀 Primeiro Acesso

### 1. Inicie o Aplicativo

Execute o Gerenciador de Conexões Enterprise.

### 2. Configure o Servidor Guacamole

No primeiro acesso ou via **Configurações**:

1. Escolha o modo:
   - **Local**: guacamole-lite roda na máquina local (desenvolvimento)
   - **Remoto**: servidor Docker dedicado (produção)

2. Preencha os campos:
   - **IP do Servidor**: Endereço do servidor Docker
   - **Porta**: 8080 (padrão)
   - **Chave de Criptografia**: Mesma do Docker

3. Clique em **Testar Conexão** para validar

### 3. Crie Grupos e Conexões

1. Ative o **Modo Edição** na toolbar
2. Clique em **Novo Grupo** para criar uma categoria
3. Dentro do grupo, clique em **+ Adicionar** para criar conexões

---

## 🔧 Funcionalidades Principais

### Conexões RDP/SSH
- Duplo clique para conectar via Guacamole
- Toolbar com clipboard, Ctrl+Alt+Del, screenshot
- Escala automática da tela

### Conexões VNC
- Suporte a noVNC integrado
- Toolbar com controle de qualidade
- VNC Wall para monitoramento múltiplo

### VNC Wall
- Visualize múltiplas conexões VNC simultaneamente
- Modo carrossel com rotação automática
- Grid ajustável (2-6 colunas)

### Monitoramento
- Teste de conectividade em tempo real
- Indicadores visuais de status (online/offline)
- Dashboard com estatísticas

---

## 🔒 Segurança

### Senhas
- Criptografadas com `safeStorage` do Electron
- Nunca armazenadas em texto plano
- Chave vinculada ao usuário do Windows

### Delegação de Credenciais RDP
O instalador configura automaticamente:
```
HKLM\SOFTWARE\Policies\Microsoft\Windows\CredentialsDelegation
```

### Comunicação
- Tokens Guacamole criptografados com AES-256-CBC
- Conexão WebSocket entre app e servidor

---

## ❓ Solução de Problemas

### Erro: "Não foi possível conectar ao servidor Guacamole"

1. Verifique se os containers estão rodando:
   ```bash
   docker-compose ps
   ```

2. Teste a porta WebSocket:
   ```bash
   curl -v http://IP_SERVIDOR:8080
   ```

3. Verifique o firewall

### Erro: "Senha incorreta" ou "Authentication failed"

1. Verifique se a `SECRET_KEY` é a mesma no app e no Docker
2. A chave deve ter exatamente 32 caracteres

### Mouse deslocado em conexões RDP

Isso pode ocorrer se o CSS do viewer aplicar flexbox. A versão atual já corrige isso.

### VNC não conecta

1. Verifique se o servidor VNC está rodando na porta correta (5900+)
2. Confirme que não há firewall bloqueando

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório do projeto.

---

*Última atualização: Dezembro 2024*
