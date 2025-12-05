# 📘 Documentação Técnica Completa
## Gerenciador de Conexões Enterprise v4.1.0

---

## 📑 Índice

1. [Visão Geral](#vis\u00e3o-geral)
2. [Arquitetura e Stack Tecnológico](#arquitetura-e-stack-tecnol\u00f3gico)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Sistemas e Módulos](#sistemas-e-m\u00f3dulos)
5. [Design System](#design-system)
6. [Configurações e Variáveis](#configura\u00e7\u00f5es-e-vari\u00e1veis)
7. [Persistência de Dados](#persist\u00eancia-de-dados)
8. [API Interna (IPC)](#api-interna-ipc)
9. [Fluxos de Trabalho](#fluxos-de-trabalho)
10. [Segurança](#seguran\u00e7a)
11. [Deploy e Distribuição](#deploy-e-distribui\u00e7\u00e3o)

---

##  1. Visão Geral

### 1.1 Propósito da Aplicação

O **Gerenciador de Conexões Enterprise** é uma aplicação desktop multiplataforma desenvolvida para centralizar e simplificar o gerenciamento de conexões remotas em ambientes corporativos. Suporta três protocolos principais:
- **RDP** (Remote Desktop Protocol) - Windows
- **SSH** (Secure Shell) - Linux/Unix
- **VNC** (Virtual Network Computing) - Multiplataforma

### 1.2 Principais Capacidades

- ✅ Gerenciamento centralizado de servidores e conexões
- ✅ Monitoramento de conectividade em tempo real
- ✅ Integração com Active Directory
- ✅ Sistema de grupos hierárquicos
- ✅ Persistência local em arquivos de conexão nativos
- ✅ Dashboard de monitoramento visual
- ✅ Sistema de temas (claro/escuro)
- ✅ Drag & Drop para reorganização
- ✅ Alteração de credenciais em massa

---

## 2. Arquitetura e Stack Tecnológico

### 2.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────┐
│              CAMADA DE UI (React)               │
│  - Componentes                                  │
│  - Views                                        │
│  - Hooks                                        │
│  - Design System                                │
└────────────────┬────────────────────────────────┘
                 │ IPC Communication
┌────────────────▼────────────────────────────────┐
│        CAMADA DE PROCESSO (Electron)            │
│  - Electron Main Process                        │
│  - IPC Handlers                                 │
│  - File System Manager                          │
│  - Connectivity Tester                          │
│  - Active Directory Integration                 │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         CAMADA DE PERSISTÊNCIA                  │
│  - electron-store (dados da aplicação)         │
│  - Arquivos .rdp (conexões RDP)                │
│  - Arquivos .bat (conexões SSH)                │
│  - Arquivos .vnc (conexões VNC)                │
└─────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico

#### Frontend
- **React** 18.3.1 - Biblioteca UI
- **Material-UI** 7.3.5 - Componentes e ícones
- **react-beautiful-dnd** 13.1.1 - Drag and Drop
- **recharts** 3.5.1 - Gráficos do dashboard
- **lucide-react** 0.555.0 - Ícones adicionais

#### Backend/Desktop
- **Electron** 31.0.2 - Framework desktop
- **Node.js** - Runtime JavaScript
- **electron-store** 7.0.3 - Persistência de dados
- **activedirectory2** 2.2.0 - Integração AD

#### Build & Development
- **react-scripts** 5.0.1 - Build React
- **electron-builder** 24.13.3 - Empacotamento
- **concurrently** 8.2.2 - Execução paralela
- **wait-on** 7.2.0 - Sincronização de inicialização

#### Utilitários
- **net**, **dns** (Node.js built-in) - Testes de conectividade
- **child_process** (Node.js built-in) - Execução de programas externos

### 2.3 Estrutura de Diretórios

```
Gerenciador-RDP-V2/
├── public/
│   ├── electron.js          # Processo principal do Electron
│   ├── preload.js           # Script de preload (IPC bridge)
│   ├── ConnectivityTester.js # Sistema de testes de conectividade
│   └── FileSystemManager.js # Gerenciamento de arquivos de conexão
├── src/
│   ├── components/          # Componentes React
│   │   ├── layout/          # Layout (Header, Sidebar)
│   │   ├── toast/           # Sistema de notificações
│   │   ├── AddGroupForm.js
│   │   ├── AddServerForm.js
│   │   ├── AddVncConnectionForm.js
│   │   ├── EditServerModal.js
│   │   ├── EditVncModal.js
│   │   ├── ADImportModal.js
│   │   ├── BulkPasswordModal.js
│   │   ├── Group.js
│   │   ├── Server.js
│   │   ├── VncConnection.js
│   │   ├── VncListItem.js
│   │   ├── Modal.js
│   │   └── ConfirmationDialog.js
│   ├── views/               # Telas principais
│   │   ├── DashboardView.js
│   │   ├── RdpSshView.js
│   │   ├── VncView.js
│   │   └── VncWallView.js
│   ├── hooks/               # Custom Hooks
│   │   ├── useGroups.js
│   │   ├── useConnectivity.js
│   │   └── useToast.js
│   ├── styles/              # Design System
│   │   ├── cards.css
│   │   └── forms.css
│   ├── theme/               # Temas Material-UI
│   │   └── AppTheme.js
│   ├── main/                # Serviços do Electron
│   │   └── services/
│   │       └── VncProxyService.js
│   ├── App.js               # Componente principal
│   ├── App.css              # Estilos globais
│   └── index.js             # Entry point
├── assets/                  # Assets estáticos
│   ├── putty.exe            # Cliente SSH
│   └── tvnviewer.exe        # Cliente VNC (TightVNC)
├── package.json             # Dependências e scripts
└── README.md                # Documentação básica
```

---

## 3. Funcionalidades Principais

### 3.1 Gerenciamento de Servidores RDP/SSH

#### 3.1.1 Criação de Servidores
- **Formulário intuitivo** com seleção de protocolo (RDP/SSH)
- **Validação automática** de campos obrigatórios
- **Portas padrão** preenchidas automaticamente (RDP: 3389, SSH: 22)
- **Campos específicos por protocolo**:
  - RDP: Nome, IP, Usuário, Senha, Domínio (opcional), Porta
  - SSH: Nome, IP, Usuário, Senha, Porta

#### 3.1.2 Edição de Servidores
- Modal centralizado `EditServerModal.js`
- Atualização em tempo real
- Sincronização automática com arquivos de conexão

#### 3.1.3 Conexão a Servidores
- **RDP**: Usa `mstsc.exe` (cliente nativo do Windows)
  - Criação de arquivo `.rdp` temporário com credenciais
  - Uso de `cmdkey` para salvar credenciais no Windows Credential Manager
  - Suporte a domínio (credenciais de domínio vs genéricas)
- **SSH**: Usa `putty.exe` (incluído em assets)
  - Passagem direta de credenciais via linha de comando
  - Suporte a autenticação por senha

#### 3.1.4 Exclusão de Servidores
- Confirmação obrigatória via diálogo
- Remoção automática de arquivos de conexão
- Parada de monitoramento ativo (se houver)

### 3.2 Gerenciamento de Conexões VNC

#### 3.2.1 Criação de Conexões VNC
- Formulário dedicado `AddVncConnectionForm.js`
- Campos: Nome, IP, Porta (padrão: 5900), Senha, View-Only
- Agrupamento por categorias

#### 3.2.2 Modos de Visualização
- **Modo Grid**: Cards visuais com informações resumidas
- **Modo Lista**: Listagem compacta
- **Modo Wall**: Parede de monitoramento (carrossel)

#### 3.2.3 Conexão VNC
- Usa **TightVNC Viewer** (`tvnviewer.exe`)
- Descriptografia automática de senha
- Suporte a modo view-only

#### 3.2.4 VNC Wall View
- Carrossel automático entre servidores selecionados
- Controles de navegação (play/pause, velocidade)
- Seleção múltipla de servidores
- Grid de visualização simultânea (1-9 colunas)

### 3.3 Sistema de Grupos

#### 3.3.1 Criação de Grupos
- Formulário premium com validação
- Nome único obrigatório
- Limite de 50 caracteres com contador visual
- Suporte a grupos RDP/SSH e VNC separados

#### 3.3.2 Edição de Grupos
- Edição inline do nome do grupo
- Renomeação com confirmação automática
- Atualização de todos os arquivos associados

#### 3.3.3 Exclusão de Grupos
- Confirmação obrigatória
- Opção de excluir ou manter servidores
- Remoção de arquivos e pastas

#### 3.3.4 Organização (Drag & Drop)
- Reorganização de servidores entre grupos
- Reordenação visual
- Persistência automática

### 3.4 Dashboard de Monitoramento

#### 3.4.1 Métricas Principais
- **Total de Servidores**: Contagem de todos os servidores cadastrados
- **Servidores Online**: Quantidade de servidores acessíveis
- **Servidores Offline**: Quantidade de servidores inacessíveis
- **Servidores Monitorados**: Quantidade em monitoramento ativo

#### 3.4.2 Visualizações
- **Gráfico de Distribuição de Status**: Pie chart com proporções
- **Gráfico de Latência**: Histórico de latência ao longo do tempo
- **Tabela de Status**: Lista detalhada de todos os servidores

#### 3.4.3 Ações do Dashboard
- Teste de conectividade em lote
- Navegação rápida para servidores específicos

---

## 4. Sistemas e Módulos

### 4.1 Sistema de Conectividade

#### 4.1.1 ConnectivityTester (Backend)
Localização: `public/ConnectivityTester.js`

**Responsabilidades**:
- Testes de ping ICMP
- Testes de porta TCP
- Resolução DNS
- Cálculo de latência
- Cache de resultados

**Métodos principais**:
```javascript
testServerConnectivity(serverInfo) // Teste único
testMultipleServers(servers)       // Teste em lote
clearCache()                       // Limpa cache
getCacheStats()                    // Estatísticas
```

**Níveis de Status**:
- `online`: Todas as verificações bem-sucedidas
- `partial`: Algumas verificações falharam
- `offline`: Servidor inacessível
- `unknown`: Não testado

#### 4.1.2 useConnectivity Hook (Frontend)
Localização: `src/hooks/useConnectivity.js`

**Funcionalidades**:
- Gerencia cache de resultados no frontend
- Coordena testes de conectividade
- Controla monitoramento ativo
- Provê interface para componentes

**Context Provider**:
```javascript
<ConnectivityProvider>
  {/* App */}
</ConnectivityProvider>
```

**Hook API**:
```javascript
const {
  results,           // Map de resultados por serverKey
  isTesting,         // Set de servers sendo testados
  monitoredServers,  // Set de servers monitorados
  testServer,        // Função de teste
  startMonitoring,   // Inicia monitoramento
  stopMonitoring,    // Para monitoramento
  testAllServers     // Testa todos
} = useConnectivity();
```

#### 4.1.3 Monitoramento Ativo
- Intervalo configurável (padrão: 30 segundos)
- Testes automáticos periódicos
- Notificação de mudanças de status
- Cache inteligente para evitar sobrecarga

#### 4.1.4 IPC Handlers de Conectividade
```javascript
// Teste único
ipcMain.handle('test-connectivity', async (event, serverInfo) => {...})

// Teste em lote
ipcMain.handle('test-multiple-servers', async (event, servers) => {...})

// Iniciar monitoramento
ipcMain.handle('start-connectivity-monitoring', async (event, serverInfo) => {...})

// Parar monitoramento
ipcMain.handle('stop-connectivity-monitoring', async (event, serverKey) => {...})
```

### 4.2 Sistema de Persistência (FileSystemManager)

#### 4.2.1 Estrutura de Persistência
Localização: `public/FileSystemManager.js`

**Diretório Base**: `%USERPROFILE%\Documents\GerenciadorRDP`

**Estrutura de Pastas**:
```
Documents/GerenciadorRDP/
├── RDP/
│   ├── GrupoA/
│   │   ├── Servidor1.rdp
│   │   └── Servidor2.rdp
│   └── GrupoB/
├── SSH/
│   ├── GrupoA/
│   │   └── ServidorLinux1.bat
│   └── GrupoC/
└── VNC/
    ├── Grupo1A/
    │   ├── Conexão1.vnc
    │   └── Conexão2.vnc
    └── Grupo1B/
```

#### 4.2.2 Formatos de Arquivo

**Arquivo RDP (.rdp)**:
```ini
screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:32
full address:s:192.168.1.10
username:s:usuario
domain:s:DOMINIO
```

**Arquivo SSH (.bat)**:
```batch
@echo off
start "" "C:\caminho\putty.exe" -ssh usuario@192.168.1.20 -P 22 -pw "senha"
```

**Arquivo VNC (.vnc)**:
```ini
[connection]
host=192.168.1.30
port=5900
password=[senha_criptografada]
[options]
viewonly=0
fullscreen=0
```

#### 4.2.3 Sincronização Bidirecional

O sistema trata o **disco como fonte da verdade**:

**Inicialização (`initializeStore`)**:
1. Escaneia diretório de arquivos
2. Importa para electron-store
3. Remove do store o que não está no disco
4. Mantém sincronizado

**Operações**:
- `saveConnectionFile(server)`: Salva/atualiza arquivo
- `deleteConnectionFile(server)`: Remove arquivo
- `deleteGroup(groupName, protocol)`: Remove pasta inteira
- `scanServers()`: Escaneia e retorna todos os servidores
- `ensureDirectories()`: Garante estrutura de pastas

#### 4.2.4 electron-store

Armazena dados em JSON no diretório de dados do usuário.

**Chaves principais**:
- `groups`: Array de grupos RDP/SSH
- `vncGroups`: Array de grupos VNC
- `theme`: Tema atual (light/dark)

**Formato de Grupo**:
```javascript
{
  id: 1234567890,
  name: "Servidores de Produção",
  groupName: "Servidores de Produção",
  servers: [
    {
      id: "server-1",
      name: "AppServer01",
      ipAddress: "192.168.1.10",
      username: "admin",
      password: "[base64_encrypted]",
      domain: "CORP",
      protocol: "rdp",
      port: "3389",
      groupName: "Servidores de Produção"
    }
  ]
}
```

### 4.3 Integração Active Directory

#### 4.3.1 ADImportModal Component
Localização: `src/components/ADImportModal.js`

**Funcionalidades**:
- Conexão a servidor AD
- Busca de computadores por OU
- Filtragem por nome
- Importação em lote
- Criação automática de grupos

#### 4.3.2 Configuração AD
```javascript
const adConfig = {
  url: 'ldap://domain-controller.corpativo.local',
  baseDN: 'DC=corpativo,DC=local',
  username: 'usuario@corpativo.local',
  password: '[senha_criptografada]'
};
```

#### 4.3.3 IPC Handler
```javascript
ipcMain.handle('ad-search', async (event, { url, baseDN, username, password, filter }) => {
  // Busca computadores no AD
  // Retorna lista de computadores
});
```

#### 4.3.4 Fluxo de Importação
1. Usuário fornece credenciais AD
2. Sistema conecta ao LDAP
3. Busca computadores na OU especificada
4. Filtra resultados (opcional)
5. Usuário seleciona computadores
6. Sistema cria servidores RDP automaticamente
7. Agrupa por local/departamento (se disponível)

### 4.4 Alteração de Credenciais em Massa

#### 4.4.1 BulkPasswordModal Component
Localização: `src/components/BulkPasswordModal.js`

**Modos**:
- **RDP/SSH**: Atualiza usuário, senha e domínio
- **VNC**: Atualiza apenas senha

**Funcionalidades**:
- Seleção múltipla de servidores
- Filtros por grupo/protocolo
- Pré-visualização de alterações
- Atualização em lote

#### 4.4.2 IPC Handler
```javascript
ipcMain.handle('bulk-update-password', async (event, { type, servers, credentials }) => {
  // type: 'rdp'|'ssh'|'vnc'
  // servers: Array de IDs
  // credentials: { username, password, domain }
  
  // Atualiza store
  // Atualiza arquivos de conexão
  // Retorna resultados
});
```

#### 4.4.3 Processo de Atualização
1. Usuário seleciona servidores
2. Insere novas credenciais
3. Confirma alterações
4. Sistema atualiza:
   - electron-store
   - Arquivos de conexão (.rdp, .bat, .vnc)
5. Retorna relatório de sucesso/falha

### 4.5 Sistema de Temas

#### 4.5.1 ThemeProvider (Material-UI)
Localização: `src/theme/AppTheme.js`

**Temas**:
- **Light**: Fundo claro, texto escuro
- **Dark**: Fundo escuro, texto claro

**Persistência**:
- Salvo em `electron-store`
- Carregado na inicialização
- Sincronizado com `data-color-scheme` no HTML

#### 4.5.2 Toggle de Tema
```javascript
const handleToggleTheme = () => {
  const newTheme = theme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  window.api.setData('theme', newTheme);
  document.documentElement.setAttribute('data-color-scheme', newTheme);
};
```

#### 4.5.3 CSS Variables por Tema
```css
:root, [data-color-scheme="light"] {
  --color-background: #fcfcf9;
  --color-surface: #fffffd;
  --color-text: #13343b;
  --color-primary: #00af74;
}

[data-color-scheme="dark"] {
  --color-background: #1f2121;
  --color-surface: #262828;
  --color-text: #f5f5f5;
  --color-primary: #00fca8;
}
```

### 4.6 Sistema de Toast Notifications

#### 4.6.1 useToast Hook
Localização: `src/hooks/useToast.js`

**API**:
```javascript
const { toast } = useToast();

toast.success('Operação concluída!');
toast.error('Erro ao processar.');
toast.warning('Atenção necessária.');
toast.info('Informação relevante.');
```

#### 4.6.2 ToastContainer Component
- Posicionamento fixo (topo direito)
- Animações de entrada/saída
- Auto-dismiss configurável
- Fila de toasts

---

## 5. Design System

### 5.1 Paleta de Cores

#### 5.1.1 Cores Primitivas
```css
--color-black: rgba(0, 0, 0, 1);
--color-white: rgba(255, 255, 255, 1);
--color-cream-100: rgba(255, 255, 253, 1);
--color-cream-50: rgba(252, 252, 249, 1);
--color-gray-200: rgba(245, 245, 245, 1);
--color-gray-300: rgba(167, 169, 169, 1);
--color-gray-400: rgba(119, 124, 124, 1);
```

#### 5.1.2 Cores de Destaque
```css
--color-teal-300: rgba(0, 252, 168, 1);
--color-teal-500: rgba(0, 175, 116, 1);
--color-teal-600: rgba(0, 140, 93, 1);
--color-teal-700: rgba(0, 105, 70, 1);
```

#### 5.1.3 Cores de Estado
```css
--color-red-500: rgba(192, 21, 47, 1);    /* Erro */
--color-orange-500: rgba(168, 75, 47, 1); /* Aviso */
--color-teal-500: rgba(0, 175, 116, 1);   /* Sucesso */
```

### 5.2 Tipografia

#### 5.2.1 Fontes
```css
--font-family-base: "FKGroteskNeue", "Geist", "Inter", -apple-system, 
                     BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-family-mono: "Berkeley Mono", ui-monospace, SFMono-Regular, monospace;
```

#### 5.2.2 Tamanhos de Fonte
- **Heading 1**: 32px / 2rem
- **Heading 2**: 24px / 1.5rem
- **Heading 3**: 18px / 1.125rem
- **Body**: 16px / 1rem
- **Small**: 14px / 0.875rem
- **Tiny**: 12px / 0.75rem

### 5.3 Espaçamento e Bordas

#### 5.3.1 Sistema de Espaçamento
```css
--space-4: 4px;
--space-8: 8px;
--space-12: 12px;
--space-16: 16px;
--space-20: 20px;
--space-24: 24px;
--space-32: 32px;
```

#### 5.3.2 Border Radius
```css
--radius-base: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
--card-radius: 12px;
```

### 5.4 Cards (`cards.css`)

#### 5.4.1 Estilos Base
```css
.server-card-base {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### 5.4.2 Glassmorphism
- `backdrop-filter: blur(10px)` - Efeito de vidro
- Backgrounds translúcidos com alpha
- Bordas sutis com baixa opacidade

### 5.5 Formulários (`forms.css`)

#### 5.5.1 Inputs
```css
.form-control {
  width: 100%;
  height: 36px;
  padding: 8px 10px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 13px;
}
```

#### 5.5.2 Botões
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}
```

#### 5.5.3 Validação
- Estados de erro com bordas vermelhas
- Mensagens de erro abaixo dos inputs
- Ícones de validação

### 5.6 Animações e Transições

#### 5.6.1 Durations
```css
--duration-fast: 150ms;
--duration-normal: 250ms;
```

#### 5.6.2 Easing
```css
--ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
```

#### 5.6.3 Animações Comuns
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); }
  to { transform: translateY(0); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

---

## 6. Configurações e Variáveis

### 6.1 Variáveis de Ambiente

#### 6.1.1 Development
```bash
BROWSER=none                  # Desabilita abertura automática do navegador
NODE_OPTIONS=--openssl-legacy-provider  # Compatibilidade OpenSSL
```

### 6.2 electron-builder Configuration

```json
{
  "appId": "com.seu-nome.gerenciador-rdp",
  "productName": "Gerenciador de Conexões Enterprise",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "build/**/*",
    "public/electron.js",
    "public/preload.js",
    "public/ConnectivityTester.js",
    "public/FileSystemManager.js",
    "src/main/**/*"
  ],
  "extraResources": [
    { "from": "assets", "to": "assets" }
  ],
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowToChangeInstallationDirectory": true
  }
}
```

### 6.3 Scripts NPM

```json
{
  "start": "cross-env BROWSER=none NODE_OPTIONS=--openssl-legacy-provider react-scripts start",
  "build:react": "react-scripts build",
  "electron:start": "concurrently \"npm:start\" \"wait-on http://localhost:3000 && electron .\"",
  "package": "npm run build:react && electron-builder",
  "build": "npm run build:react && electron-builder --win --x64"
}
```

### 6.4 Configurações Padrão

#### 6.4.1 Portas Padrão
- **RDP**: 3389
- **SSH**: 22
- **VNC**: 5900

#### 6.4.2 Timeouts
- **Teste de Conectividade**: 5000ms
- **Cache de Resultados**: 30000ms (30s)
- **Intervalo de Monitoramento**: 30000ms (30s)

#### 6.4.3 Limites
- **Nome de Grupo**: 50 caracteres
- **Nome de Servidor**: 100 caracteres
- **Servidores por Teste em Lote**: Ilimitado (recomendado: max 50)

---

## 7. Persistência de Dados

### 7.1 electron-store

#### 7.1.1 Inicialização
```javascript
const Store = require('electron-store');
const store = new Store();
```

#### 7.1.2 Operações Básicas
```javascript
// Leitura
const groups = store.get('groups', []);

//  Escrita
store.set('groups', updatedGroups);

// Limpeza
store.clear();
```

#### 7.1.3 Estrutura de Dados

**Grupos RDP/SSH**:
```javascript
[
  {
    id: 1638273894561,
    name: "Produção",
    groupName: "Produção",
    servers: [
      {
        id: "server-1638273894562",
        name: "WebServer01",
        ipAddress: "192.168.1.10",
        username: "admin",
        password: "QmFzZTY0RW5jcnlwdGVk...",  // Base64 encrypted
        domain: "CORP",
        protocol: "rdp",
        port: "3389",
        groupName: "Produção"
      }
    ]
  }
]
```

**Grupos VNC**:
```javascript
[
  {
    id: 1638273894563,
    name: "1A Residentes",
    groupName: "1A Residentes",
    connections: [
      {
        id: "vnc-1638273894564",
        name: "1A RESIDENTES",
        ipAddress: "172.16.1.100",
        port: "5900",
        password: "QmFzZTY0RW5jcnlwdGVk...",  // Base64 encrypted
        viewOnly: false,
        protocol: "vnc",
        groupName: "1A Residentes"
      }
    ]
  }
]
```

### 7.2 Segurança de Dados

#### 7.2.1 Criptografia de Senhas
```javascript
const { safeStorage } = require('electron');

// Criptografar
const encryptedPassword = safeStorage.encryptString(plainPassword);
const base64 = encryptedPassword.toString('base64');

// Descriptografar
const buffer = Buffer.from(base64, 'base64');
const plainPassword = safeStorage.decryptString(buffer);
```

#### 7.2.2 Salvaguardas
- Senhas sempre criptografadas com `safeStorage` do Electron
- Dados armazenados em diretório protegido do usuário
- Arquivos de conexão salvos com permissões restritas

### 7.3 Sincronização de Dados

#### 7.3.1 Fluxo de Sincronização na Inicialização
```
1. Electron App inicia
2. initializeStore() é chamado
3. FileSystemManager.scanServers() escaneia disco
4. Compara disco vs store:
   - Adiciona ao store o que está no disco
   - Remove do store o que não está no disco
5. Atualiza store
6. Envia dados ao frontend via IPC
```

#### 7.3.2 Fluxo de Sincronização em Operações
```
1. Usuário cria/edita/exclui servidor no frontend
2. Frontend envia via IPC para backend
3. Backend atualiza store
4. Backend atualiza arquivos de conexão
5. Backend retorna sucesso/falha
6. Frontend atualiza UI
```

### 7.4 Importação/Exportação

#### 7.4.1 Exportação
- Menu: Arquivo > Exportar Configurações
- Formato: JSON com `groups` e `vncGroups`
- Inclui timestamp de exportação

#### 7.4.2 Importação
- Menu: Arquivo > Importar Configurações
- Valida estrutura JSON
- Sobrescreve dados existentes
- Reinicia aplicação após importação

#### 7.4.3 Importação Manual VNC
- Arquivo `vnc_import.json` na raiz do projeto
- Detectado e processado na inicialização
- Renomeado para `.imported` após processamento

---

## 8. API Interna (IPC)

### 8.1 Handlers de Dados

#### 8.1.1 Leitura
```javascript
ipcMain.handle('get-data', (event, key) => {
  return store.get(key);
});
```

#### 8.1.2 Escrita
```javascript
ipcMain.on('set-data', (event, key, value) => {
  // Lógica especial para groups/vncGroups
  // - Criptografa senhas
  // - Salva arquivos de conexão
  // - Detecta exclusões
  store.set(key, value);
});
```

#### 8.1.3 Limpeza
```javascript
ipcMain.on('clear-data-request', () => {
  store.clear();
  app.relaunch();
  app.quit();
});
```

### 8.2 Handlers de Conexão

#### 8.2.1 Conexão RDP/SSH
```javascript
ipcMain.on('start-connection', async (event, serverInfo) => {
  // 1. Teste prévio de conectividade
  // 2. Descriptografa senha
  // 3. Se RDP:
  //    - Cria arquivo .rdp temporário
  //    - Usa cmdkey para salvar credenciais
  //    - Executa mstsc.exe
  // 4. Se SSH:
  //    - Executa putty.exe com parâmetros
});
```

#### 8.2.2 Conexão VNC
```javascript
ipcMain.handle('connect-vnc', async (event, connectionInfo) => {
  // 1. Descriptografa senha
  // 2. Monta comando tvnviewer.exe
  // 3. Executa cliente VNC
  return { success: true };
});
```

### 8.3 Handlers de Conectividade

#### 8.3.1 Teste Único
```javascript
ipcMain.handle('test-connectivity', async (event, serverInfo) => {
  const result = await connectivityTester.testServerConnectivity(serverInfo);
  return result;
});
```

#### 8.3.2 Teste em Lote
```javascript
ipcMain.handle('test-multiple-servers', async (event, servers) => {
  await connectivityTester.testMultipleServers(servers);
  // Resultados enviados via eventos 'connectivity-result'
});
```

#### 8.3.3 Monitoramento
```javascript
ipcMain.handle('start-connectivity-monitoring', async (event, serverInfo) => {
  const serverKey = generateServerKey(serverInfo);
  const interval = setInterval(() => {
    testServer(serverInfo);
  }, 30000);
  connectivityMonitors.set(serverKey, interval);
});

ipcMain.handle('stop-connectivity-monitoring', async (event, serverKey) => {
  clearInterval(connectivityMonitors.get(serverKey));
  connectivityMonitors.delete(serverKey);
});
```

### 8.4 Handlers de Active Directory

```javascript
ipcMain.handle('ad-search', async (event, { url, baseDN, username, password, filter }) => {
  const ad = new ActiveDirectory({
    url, baseDN,
    username, password
  });
  
  const query = filter || 'objectClass=computer';
  
  return new Promise((resolve, reject) => {
    ad.find(query, (err, results) => {
      if (err) reject(err);
      else resolve(results.computers || []);
    });
  });
});
```

### 8.5 Handlers de Alteração em Massa

```javascript
ipcMain.handle('bulk-update-password', async (event, { type, servers, credentials }) => {
  // type: 'rdp'|'ssh'|'vnc'
  // servers: Array de IDs
  // credentials: { username, password, domain }
  
  // 1. Atualiza store
  // 2. Atualiza arquivos de conexão
  // 3. Retorna relatório
  
  return {
    success: true,
    updated: count,
    failed: 0,
    details: results
  };
});
```

### 8.6 Eventos do Frontend para Backend

```javascript
// Exemplo de uso no frontend
window.api.connection.connect(serverInfo);
window.api.connection.connectVnc(vncInfo);
window.api.setData('groups', updatedGroups);
const groups = await window.api.getData('groups');
```

### 8.7 Eventos do Backend para Frontend

```javascript
// Enviados via webContents.send()
mainWindow.webContents.send('initial-data-loaded', { groups, vncGroups });
mainWindow.webContents.send('connectivity-result', serverKey, result);
mainWindow.webContents.send('connectivity-monitoring-change', action, serverKey);
```

---

## 9. Fluxos de Trabalho

### 9.1 Fluxo de Criação de Servidor RDP

```
1. Usuário clica em "+" no grupo
2. App abre AddServerForm no modal
3. Usuário seleciona protocolo (RDP)
4. Preenche: Nome, IP, Usuário, Senha, Domínio (opcional)
5. Porta preenchida automaticamente (3389)
6. Clica em "Adicionar"
7. Frontend valida campos
8. Frontend chama handleAddServer()
9. handleAddServer() adiciona servidor ao estado
10. handleAddServer() chama window.api.setData('groups', ...)
11. Backend (IPC) recebe 'set-data'
12. Backend criptografa senha
13. Backend salva arquivo .rdp no disco
14. Backend atualiza store
15. Frontend fecha modal
16. Frontend exibe toast de sucesso
17. Servidor aparece no grupo
```

### 9.2 Fluxo de Conexão RDP

```
1. Usuário clica no card do servidor
2. Server.js chama handleConnect()
3. handleConnect() chama window.api.connection.connect(serverInfo)
4. Backend recebe 'start-connection'
5. Backend executa teste prévio de conectividade
6. Se offline/parcial, exibe diálogo de confirmação
7. Se online ou usuário confirma:
   a. Descriptografa senha
   b. Cria arquivo .rdp temporário
   c. Executa cmdkey para salvar credenciais:
      - Se domínio: cmdkey /generic:TERMSRV/IP /user:DOMINIO\usuario /pass:senha
      - Sem domínio: cmdkey /generic:IP /user:usuario /pass:senha
   d. Executa: mstsc.exe arquivo.rdp
8. Cliente RDP nativo abre
9. Backend exibe notificação de "Conexão iniciada"
```

### 9.3 Fluxo de Monitoramento

```
1. Usuário clica no botão de monitoramento (ícone de coração)
2. Server.js chama handleToggleMonitoring()
3. Se não monitorado:
   a. handleToggleMonitoring() chama startMonitoring(serverInfo)
   b. useConnectivity cria serverKey
   c. Adiciona serverKey ao Set monitoredServers
   d. Chama window.api.startMonitoring(serverInfo)
   e. Backend cria interval de 30s
   f. A cada 30s, backend testa conectividade
   g. Backend envia resultado via 'connectivity-result'
   h. Frontend atualiza estado
   i. UI reflete mudanças de status em tempo real
4. Se já monitorado:
   a. handleToggleMonitoring() chama stopMonitoring(serverKey)
   b. Remove do Set monitoredServers
   c. Chama window.api.stopMonitoring(serverKey)
   d. Backend limpa interval
   e. Monitoramento para
```

### 9.4 Fluxo de Importação AD

```
1. Usuário clica em botão "Importar do AD"
2. App abre ADImportModal
3. Usuário preenche:
   - URL LDAP (ex: ldap://dc.empresa.local)
   - Base DN (ex: DC=empresa,DC=local)
   - Usuário AD
   - Senha AD
   - Filtro OU (opcional)
4. Clica em "Conectar"
5. Frontend chama window.api.adSearch({ url, baseDN, username, password, filter })
6. Backend tenta conectar ao LDAP
7. Backend busca computadores na OU
8. Backend retorna lista de computadores
9. Frontend exibe lista em tabela
10. Usuário seleciona computadores desejados
11. Usuário define:
    - Grupo de destino
    - Credenciais padrão (usuário, senha, domínio)
12. Clica em "Importar"
13. Frontend cria objetos de servidor:
    - name: Nome do computador
    - ipAddress: DNS name ou IP
    - username: Credencial fornecida
    - password: Senha fornecida
    - domain: Domínio fornecido
    - protocol: 'rdp'
    - port: '3389'
14. Frontend adiciona servidores ao grupo
15. Frontend chama window.api.setData('groups', ...)
16. Backend salva arquivos .rdp
17. Frontend exibe toast de sucesso
18. Modal fecha
19. Servidores aparecem no grupo
```

### 9.5 Fluxo de Alteração de Senha em Massa

```
1. Usuário ativa modo de edição
2. Usuário clica no botão de cadeado
3. App abre Bulk PasswordModal
4. Usuário seleciona tipo (RDP/SSH ou VNC)
5. Frontend exibe lista de todos os servidores do tipo
6. Usuário seleciona servidores (checkboxes)
7. Usuário preenche novas credenciais:
   - RDP/SSH: Usuário (opcional), Senha, Domínio (opcional)
   - VNC: Senha
8. Clica em "Atualizar Senhas"
9. Frontend chama window.api.bulkUpdatePassword({ type, servers, credentials })
10. Backend:
    a. Para cada servidor selecionado:
       - Atualiza no store
       - Criptografa nova senha
       - Atualiza arquivo de conexão (.rdp, .bat, .vnc)
    b. Retorna relatório: { success, updated, failed, details }
11. Frontend exibe toast com resultado
12. Frontend atualiza estado local
13. Modal fecha
14. Servidores refletem novas credenciais
```

### 9.6 Fluxo de Drag & Drop

```
1. Usuário ativa modo de edição
2. Usuário clica e arrasta um card de servidor
3. react-beautiful-dnd captura evento
4. Card visual segue o mouse
5. Grupo de destino recebe highlight
6. Usuário solta o card no grupo de destino
7. react-beautiful-dnd chama onDragEnd()
8. App.js recebe  resultado do drag:
   - source: { index, droppableId }
   - destination: { index, droppableId }
9. Frontend atualiza estado:
   - Remove servidor do grupo de origem
   - Adiciona servidor ao grupo de destino
   - Atualiza groupName do servidor
10. Frontend chama window.api.setData('groups', ...)
11. Backend move arquivo de conexão:
    - De: Documents/GerenciadorRDP/RDP/GrupoOrigem/Servidor.rdp
    - Para: Documents/GerenciadorRDP/RDP/GrupoDestino/Servidor.rdp
12. Backend atualiza store
13. Frontend reflete nova organização
```

---

## 10. Segurança

### 10.1 Criptografia

#### 10.1.1 Senhas
- **Método**: `safeStorage` do Electron (usa APIs do OS)
- **Windows**: DPAPI (Data Protection API)
- **Formato**: Base64 do buffer criptografado
- **Aplicação**: Todas as senhas (RDP, SSH, VNC)

#### 10.1.2 Exemplo
```javascript
// Criptografia
const encrypted = safeStorage.encryptString(plainPassword);
const base64 = encrypted.toString('base64');

// Descriptografia
const buffer = Buffer.from(base64, 'base64');
const plain = safeStorage.decryptString(buffer);
```

### 10.2 Isolamento de Contexto

#### 10.2.1 Configuração Electron
```javascript
{
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,  // Isola contextos
    nodeIntegration: false,  // Sem acesso direto ao Node
    sandbox: true            // Sandbox do renderer
  }
}
```

#### 10.2.2 preload.js
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Expõe apenas APIs necessárias
  getData: (key) => ipcRenderer.invoke('get-data', key),
  setData: (key, value) => ipcRenderer.send('set-data', key, value),
  // etc.
});
```

### 10.3 Validação de Entrada

#### 10.3.1 Frontend
```javascript
// Validação de campos obrigatórios
if (!formData.name.trim()) {
  errors.name = 'Nome é obrigatório';
}

// Validação de IP
if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(formData.ipAddress)) {
  errors.ipAddress = 'IP inválido';
}

// Sanitização
const sanitized = input.trim().replace(/[<>]/g, '');
```

#### 10.3.2 Backend
```javascript
// Validação de dados recebidos
if (!serverInfo || !serverInfo.ipAddress) {
  throw new Error('Dados inválidos');
}

// Sanitização de caminhos de arquivo
const safePath = path.normalize(filePath);
if (!safePath.startsWith(baseDir)) {
  throw new Error('Path traversal detectado');
}
```

### 10.4 Permissões de Arquivos

#### 10.4.1 Diretórios
- Criados no perfil do usuário (`%USERPROFILE%\Documents`)
- Permissões herdadas do diretório pai
- Apenas usuário atual tem acesso

#### 10.4.2 Arquivos de Conexão
- Criados com permissões padrão do usuário
- Senhas sempre criptografadas (exceto em .rdp, que usa formato nativo)

### 10.5 Tratamento de Erros

#### 10.5.1 Try-Catch em Operações Críticas
```javascript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Erro:', error);
  showErrorDialog(error.message);
  return null;
}
```

#### 10.5.2 Validação de APIs Externas
```javascript
if (!window.api?.connection?.connect) {
  console.error('API não disponível');
  toast.error('Erro: API de conexão não disponível');
  return;
}
```

---

## 11. Deploy e Distribuição

### 11.1 Build de Produção

#### 11.1.1 Comandos
```bash
# 1. Build do React
npm run build:react

# 2. Package Electron (sem instalador)
npm run package

# 3. Build completo com instalador
npm run build
```

#### 11.1.2 Estrutura do Build
```
dist/
├── win-unpacked/          # Aplicação desempacotada
│   ├── Gerenciador de Conexões Enterprise.exe
│   ├── resources/
│   │   ├── app.asar       # Aplicação empacotada
│   │   └── assets/        # Assets (putty, tvnviewer)
│   └── ...
└── Gerenciador de Conexões Enterprise Setup X.X.X.exe  # Instalador
```

### 11.2 Instalador NSIS

#### 11.2.1 Configuração
```json
{
  "nsis": {
    "oneClick": false,                              # Instalador customizável
    "perMachine": true,                             # Instalação por máquina
    "allowToChangeInstallationDirectory": true,     # Usuário escolhe diretório
    "include": "installer/installer.nsh"            # Script customizado
  }
}
```

#### 11.2.2 Processo de Instalação
1. Usuário executa Setup.exe
2. Escolhe diretório de instalação (padrão: `C:\Program Files\Gerenciador de Conexões Enterprise`)
3. Instalador copia arquivos
4. Cria atalhos (Desktop e Menu Iniciar)
5. Registra aplicação no sistema
6. Finaliza instalação

### 11.3 Atualizações

#### 11.3.1 Versionamento
- Formato: `MAJOR.MINOR.PATCH` (ex: 4.1.0)
- Incremento de MAJOR: Mudanças incompatíveis
- Incremento de MINOR: Novas funcionalidades
- Incremento de PATCH: Correções de bugs

#### 11.3.2 Processo de Atualização (Manual)
1. Distribuir novo instalador
2. Usuário executa novo instalador
3. Instalador detecta versão anterior
4. Oferece opção de desinstalar ou sobrescrever
5. Mantém dados do usuário (store permanece)

### 11.4 Distribuição

#### 11.4.1 Canais
- **Instalador Local**: Distribuído via rede interna
- **Download Direto**: Hospedado em servidor corporativo
- **Microsoft Store** (futuro): Distribuição via loja

#### 11.4.2 Requisitos de Sistema
- **SO**: Windows 10/11 (64-bit)
- **RAM**: Mínimo 4GB
- **Espaço**: 300MB livres
- **Rede**: Conectividade para servidores remotos

---

## 12. Manutenção e Suporte

### 12.1 Logs e Debugging

#### 12.1.1 Logs no Console
```javascript
console.log('🔍 Debug:', data);
console.warn('⚠️ Aviso:', warning);
console.error('❌ Erro:', error);
console.time('⏱️ Operação');
// ...
console.timeEnd('⏱️ Operação');
```

#### 12.1.2 Logs em Arquivo
FileSystemManager cria `sync_log.txt` no diretório base:
```
Documents/GerenciadorRDP/sync_log.txt
```

#### 12.1.3 Dev Tools
- Ativar: Menu > Ver > Alternar Ferramentas de Desenvolvedor
- Ou `Ctrl+Shift+I` (Windows)

### 12.2 Troubleshooting Comum

#### 12.2.1 Servidor não Conecta
**Verificar**:
1. IP/DNS está correto?
2. Porta está acessível (firewall)?
3. Credenciais estão corretas?
4. Servidor está online?

**Solução**:
- Usar botão de teste de conectividade
- Verificar logs do Windows Event Viewer (RDP)
- Testar ping manual

#### 12.2.2 Senha não Funciona
**Verificar**:
1. Senha foi salva corretamente?
2. Domínio está configurado (se aplicável)?

**Solução**:
- Recriar servidor com senha correta
- Usar alteração em massa para atualizar
- Verificar cmdkey (RDP): `cmdkey /list`

#### 12.2.3 VNC não Abre
**Verificar**:
1. `tvnviewer.exe` está em `assets/`?
2. Antivírus bloqueando?
3. Porta VNC acessível?

**Solução**:
- Adicionar exceção no antivírus
- Testar conexão manual com TightVNC
- Verificar firewall do servidor VNC

#### 12.2.4 Dados Perdidos
**Verificar**:
1. Arquivos ainda existem em `Documents/GerenciadorRDP`?
2. Store foi limpo acidentalmente?

**Solução**:
- Restaurar de backup (exportação JSON)
- Re-escanear diretório (Menu > Limpar Dados e Reiniciar)

### 12.3 Backup e Restore

#### 12.3.1 Backup Manual
1. Menu > Arquivo > Exportar Configurações
2. Salvar JSON em local seguro
3. Recomendar backup periódico

#### 12.3.2 Restore
1. Menu > Arquivo > Importar Configurações
2. Selecionar arquivo JSON
3. Confirmar sobrescrita
4. Aplicação reinicia automaticamente

### 12.4 Performance

#### 12.4.1 Otimizações
- Componentes React memoizados (`React.memo`)
- Hooks otimizados (`useCallback`, `useMemo`)
- Cache de resultados de conectividade
- Lazy loading (futuro)

#### 12.4.2 Monitoramento
- DevTools > Performance tab
- React DevTools Profiler
- Electron DevTools > Memory

---

## 13. Apêndices

### 13.1 Glossário

- **IPC**: Inter-Process Communication (Comunicação entre processos do Electron)
- **RDP**: Remote Desktop Protocol (Protocolo de Área de Trabalho Remota)
- **SSH**: Secure Shell (Shell Seguro)
- **VNC**: Virtual Network Computing (Computação Virtual em Rede)
- **AD**: Active Directory (Diretório Ativo da Microsoft)
- **LDAP**: Lightweight Directory Access Protocol
- **Store**: electron-store, biblioteca de persistência de dados

### 13.2 Referências Externas

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [React Documentation](https://react.dev/)
- [Material-UI](https://mui.com/)
- [TightVNC](https://www.tightvnc.com/)
- [PuTTY](https://www.putty.org/)
- [Active Directory](https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/)

### 13.3 Contato e Suporte

Para suporte técnico ou dúvidas:
- Issues no GitHub
- Documentação interna Wiki
- Email: [seu-email-de-suporte]

---

**Versão da Documentação**: 1.0.0  
**Última Atualização**: 2025-12-04  
**Versão da Aplicação**: v4.1.0

---

*Esta documentação técnica foi criada para fornecer uma visão completa e detalhada do Gerenciador de Conexões Enterprise, servindo como guia de referência para desenvolvedores, administradores e usuários avançados.*
