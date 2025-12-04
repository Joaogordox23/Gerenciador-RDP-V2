const fs = require('fs');
const path = require('path');

// 1. Atualizar RdpSshView.js
const rdpSshPath = path.join(__dirname, 'src', 'views', 'RdpSshView.js');
let rdpContent = fs.readFileSync(rdpSshPath, 'utf8');

// Adicionar viewMode aos props
rdpContent = rdpContent.replace(
    /(function RdpSshView\(\{[^}]+)(}\))/,
    '$1, viewMode$2'
);

// Passar viewMode para o componente Group
rdpContent = rdpContent.replace(
    /(\s+onShowAddServerModal=\{onShowAddServerModal}\s+)/g,
    '$1viewMode={viewMode}\n                        '
);

fs.writeFileSync(rdpSshPath, rdpContent, 'utf8');
console.log('✅ RdpSshView.js atualizado!');

// 2. Atualizar VncView.js
const vncPath = path.join(__dirname, 'src', 'views', 'VncView.js');
let vncContent = fs.readFileSync(vncPath, 'utf8');

// Adicionar viewMode aos props
vncContent = vncContent.replace(
    /(function VncView\(\{[^}]+)(}\))/,
    '$1, viewMode$2'
);

// Passar viewMode para o componente VncGroup
vncContent = vncContent.replace(
    /(\s+onDeleteVncConnection=\{onDeleteVncConnection}\s+)/g,
    '$1viewMode={viewMode}\n                        '
);

fs.writeFileSync(vncPath, vncContent, 'utf8');
console.log('✅ VncView.js atualizado!');

// 3. Atualizar Group.js para receber viewMode
const groupPath = path.join(__dirname, 'src', 'components', 'Group.js');
let groupContent = fs.readFileSync(groupPath, 'utf8');

// Adicionar viewMode aos props
if (!groupContent.includes(', viewMode')) {
    groupContent = groupContent.replace(
        /(function Group\(\{[^}]+)(}\))/,
        '$1, viewMode$2'
    );
}

// Passar viewMode para Server e aplicar classe list-view
if (!groupContent.includes('viewMode={viewMode}')) {
    groupContent = groupContent.replace(
        /(\s+onDelete=)/g,
        'viewMode={viewMode}\n                        $1'
    );

    // Adicionar classe list-view ao servers-row
    groupContent = groupContent.replace(
        /className="servers-row"/g,
        'className={`servers-row ${viewMode === \'list\' ? \'list-view\' : \'\'}`}'
    );
}

fs.writeFileSync(groupPath, groupContent, 'utf8');
console.log('✅ Group.js atualizado!');

// 4. Atualizar Server.js para receber viewMode
const serverPath = path.join(__dirname, 'src', 'components', 'Server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Adicionar viewMode aos props
if (!serverContent.includes(', viewMode')) {
    serverContent = serverContent.replace(
        /(function Server\(\{[^}]+)(}\))/,
        '$1, viewMode$2'
    );
}

// Aplicar classe list-view-item ao card principal
if (!serverContent.includes('list-view-item')) {
    serverContent = serverContent.replace(
        /className="server-card"/,
        'className={`server-card ${viewMode === \'list\' ? \'list-view-item\' : \'\'}`}'
    );
}

fs.writeFileSync(serverPath, serverContent, 'utf8');
console.log('✅ Server.js atualizado!');

// 5. Atualizar VncGroup.js para receber viewMode
const vncGroupPath = path.join(__dirname, 'src', 'components', 'VncGroup.js');
let vncGroupContent = fs.readFileSync(vncGroupPath, 'utf8');

// Adicionar viewMode aos props
if (!vncGroupContent.includes(', viewMode')) {
    vncGroupContent = vncGroupContent.replace(
        /(function VncGroup\(\{[^}]+)(}\))/,
        '$1, viewMode$2'
    );
}

// Passar viewMode para VncConnection e aplicar classe list-view
if (!vncGroupContent.includes('viewMode={viewMode}')) {
    vncGroupContent = vncGroupContent.replace(
        /(\s+onDelete=\{handleDelete}\s+)/g,
        '$1viewMode={viewMode}\n                        '
    );

    // Adicionar classe list-view ao servers-row
    vncGroupContent = vncGroupContent.replace(
        /className="servers-row"/g,
        'className={`servers-row ${viewMode === \'list\' ? \'list-view\' : \'\'}`}'
    );
}

fs.writeFileSync(vncGroupPath, vncGroupContent, 'utf8');
console.log('✅ VncGroup.js atualizado!');

// 6. Atualizar VncConnection.js para receber viewMode
const vncConnectionPath = path.join(__dirname, 'src', 'components', 'VncConnection.js');
let vncConnectionContent = fs.readFileSync(vncConnectionPath, 'utf8');

// Adicionar viewMode aos props
if (!vncConnectionContent.includes(', viewMode')) {
    vncConnectionContent = vncConnectionContent.replace(
        /(function VncConnection\(\{[^}]+)(}\))/,
        '$1, viewMode$2'
    );
}

// Aplicar classe list-view-item
if (!vncConnectionContent.includes('list-view-item')) {
    vncConnectionContent = vncConnectionContent.replace(
        /className="server-card"/,
        'className={`server-card ${viewMode === \'list\' ? \'list-view-item\' : \'\'}`}'
    );
}

fs.writeFileSync(vncConnectionPath, vncConnectionContent, 'utf8');
console.log('✅ VncConnection.js atualizado!');

console.log('\n🎉 Todos os arquivos foram atualizados com viewMode!');
