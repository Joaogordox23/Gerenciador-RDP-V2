// EXEMPLO DE USO DO sanitizeLog em electron.js
// Substitua logs que podem conter dados sensíveis:

// ❌ ANTES (INSEGURO):
// console.log('Conectando ao servidor:', serverInfo);

// ✅ DEPOIS (SEGURO):
// console.log('Conectando ao servidor:', sanitizeLog(serverInfo));

// Linhas específicas em electron.js que precisam ser atualizadas:
// Linha 543: console.log console.log(`🖥️ Pedido de conexão VNC:`, sanitizeLog(connectionInfo));
// Linha 561: REMOVER: console.log('✅ Senha VNC descriptografada com sucesso');
// Linha 699: console.log(`🔗 Pedido de conexão [${protocol}]:`, sanitizeLog(serverInfo));
// Linha 788: console.log('🖥️ Executando comando PuTTY SSH (sem logar password)');

// Campos que serão automaticamente substituídos por [REDACTED]:
// - password, passwd, pwd
// - token
// - secret
// - apikey, api_key
// - auth
