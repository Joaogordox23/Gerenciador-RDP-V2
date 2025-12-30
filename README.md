# 🖥️ Gerenciador RDP/VNC/SSH Enterprise

**Sistema unificado para gerenciamento de conexões remotas** - Desktop, multi-protocolo, com interface moderna e recursos enterprise.

![Electron](https://img.shields.io/badge/Electron-28.0-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Funcionalidades Principais

### 🔌 Multi-Protocolo
| Protocolo | Descrição |
|-----------|-----------|
| **RDP** | Conexão Windows via mstsc.exe |
| **VNC** | Visualização integrada com noVNC (WebSocket) |
| **SSH** | Terminal integrado com xterm.js |
| **AnyDesk** | Integração com cliente AnyDesk |

### 📊 Recursos VNC Avançados
- **VNC Wall** - Visualização simultânea de múltiplas conexões
- **Tabs de Conexão** - Múltiplas sessões em abas
- **Clipboard Bidirecional** - Copiar/colar entre local e remoto
- **Controle Remoto** - Mouse, teclado, teclas especiais (Ctrl+Alt+Del)
- **Ping em Massa** - Verificação de status de todas as conexões
- **Importação CSV** - Importação em lote de conexões VNC

### 🎨 Interface Premium
- **Design Moderno** - Tema escuro inspirado em Netflix
- **Glass Effects** - Blur e transparência
- **Tailwind CSS** - Estilização consistente
- **Drag & Drop** - Reorganização de grupos/conexões
- **Responsivo** - Sidebar colapsável

### 🔒 Segurança
- **Criptografia** - Senhas armazenadas com `safeStorage` do Electron
- **SQLite** - Banco local seguro
- **Context Isolation** - Isolamento completo Electron/React

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Windows 10/11 (para RDP nativo)

### Desenvolvimento
```bash
# Clone o repositório
git clone https://github.com/Joaogordox23/Gerenciador-RDP-V2.git
cd Gerenciador-RDP-V2

# Instale dependências
npm install

# Execute em desenvolvimento
npm run electron:start
```

### Build de Produção
```bash
# Build para Windows
npm run build
npm run electron:build

# Build para Linux (requer ambiente Linux)
npm run build
npm run build:linux
```

---

## 📁 Estrutura do Projeto

```
Gerenciador-RDP-V2/
├── public/                     # Backend Electron
│   ├── electron.js             # Main process
│   ├── preload.js              # API bridge
│   ├── DatabaseManager.js      # SQLite manager
│   ├── FileSystemManager.js    # Gerenciador de arquivos .rdp/.vnc
│   └── ipc/                    # IPC Handlers modulares
│       ├── database.handlers.js
│       ├── vnc.handlers.js
│       ├── ssh.handlers.js
│       └── ...
├── src/                        # Frontend React
│   ├── App.js                  # Componente principal
│   ├── components/
│   │   ├── VncDisplay.js       # Visualizador noVNC
│   │   ├── VncToolbar.js       # Toolbar VNC
│   │   ├── VncWallView.js      # Mural VNC
│   │   ├── SshTerminal.js      # Terminal SSH
│   │   └── ...
│   ├── views/                  # Páginas principais
│   └── contexts/               # React Contexts
└── package.json
```

---

## ⚙️ Configuração

### Diretórios de Dados
O sistema salva conexões em:
```
%DOCUMENTOS%/GerenciadorRDP/
├── RDP/           # Arquivos .rdp por grupo
├── VNC/           # Arquivos .vnc por grupo
└── connections.db # Banco SQLite
```

### Variáveis de Ambiente
Não requer configuração adicional. Todos os dados são locais.

---

## 🎮 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `F12` | Abrir DevTools |
| `Ctrl+C/V` | Clipboard VNC (quando no viewer) |
| `Esc` | Fechar modais |

---

## 📝 Changelog (Resumido)

### v5.11 (Atual)
- ✅ Clipboard VNC bidirecional funcionando
- ✅ Botão DevTools no footer
- ✅ Correção das tabs VNC

### v5.10
- ✅ Importação CSV para VNC
- ✅ Ping em massa para conexões VNC
- ✅ Status indicators (online/offline)

### v5.9
- ✅ VNC Wall com carrossel
- ✅ Quick Connect VNC
- ✅ Integração SSH com xterm.js

### v5.8
- ✅ Build Linux (AppImage, deb)
- ✅ System Tray
- ✅ Single Instance Lock

---

## 🐛 Troubleshooting

### VNC não conecta
1. Verifique se a porta está correta (padrão: 5900)
2. Confirme que o servidor VNC está rodando
3. Teste ping no host

### Clipboard VNC não funciona (servidor → local)
1. No TightVNC Server: desmarque "Disable clipboard transfer"
2. Clique no canvas VNC antes de copiar
3. Use o botão 🔄 na toolbar para sincronizar

### Linux: Hostname não resolve
Configure DNS ou winbind:
```bash
sudo apt install libnss-winbind winbind
# Edite /etc/nsswitch.conf: hosts: files dns wins
```

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie sua branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'feat: nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

**João Paulo Andrade**

---

*Desenvolvido com ❤️ usando Electron, React e muita dedicação.*