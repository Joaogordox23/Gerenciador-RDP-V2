const fs = require('fs');
const path = require('path');

// Ler App.js
const appPath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Adicionar viewMode state após showBulkPasswordModal
content = content.replace(
    "const [showBulkPasswordModal, setShowBulkPasswordModal] = useState(false);",
    "const [showBulkPasswordModal, setShowBulkPasswordModal] = useState(false);\n    const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'"
);

// 2. Adicionar import do GridViewIcon e ViewListIcon (se ainda não existir)
if (!content.includes('GridViewIcon')) {
    content = content.replace(
        "    LockIcon\n} from './components/MuiIcons';",
        "    LockIcon,\n    GridViewIcon,\n    ViewListIcon\n} from './components/MuiIcons';"
    );
}

// 3. Adicionar botão de toggle no toolbar
content = content.replace(
    `                    </div>
                    <label htmlFor="edit-mode-toggle"`,
    `                    </div>
                    {(activeView === 'RDP/SSH' || activeView === 'VNC') && (
                        <button 
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} 
                            className="toolbar-btn secondary" 
                            title={viewMode === 'grid' ? 'Mudar para Lista' : 'Mudar para Grade'}
                        >
                            {viewMode === 'grid' ? <ViewListIcon sx={{ fontSize: 18 }} /> : <GridViewIcon sx={{ fontSize: 18 }} />}
                            {viewMode === 'grid' ? ' Lista' : ' Grade'}
                        </button>
                    )}
                    <label htmlFor="edit-mode-toggle"`
);

// 4. Passar viewMode para RdpSshView
content = content.replace(
    `                            onShowAddServerModal={setAddingToGroupId}
                        />`,
    `                            onShowAddServerModal={setAddingToGroupId}
                            viewMode={viewMode}
                        />`
);

// 5. Passar viewMode para VNCView  
content = content.replace(
    `                            onDeleteVncConnection={confirmDeleteVncConnection}
                        />`,
    `                            onDeleteVncConnection={confirmDeleteVncConnection}
                            viewMode={viewMode}
                        />`
);

// Salvar arquivo
fs.writeFileSync(appPath, content, 'utf8');
console.log('✅ App.js atualizado com sucesso!');
