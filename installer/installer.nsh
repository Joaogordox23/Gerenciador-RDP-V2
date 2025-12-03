!macro customInstall
  DetailPrint "Configurando Registro para Delegação de Credenciais..."
  
  ; Garante escrita no Registro de 64 bits
  SetRegView 64
  
  ; Cria as chaves (subkeys) necessárias primeiro
  ; Nota: Não criamos valores DWORD com o mesmo nome das chaves para evitar conflito
  
  ; Adiciona TERMSRV/* na lista de AllowSavedCredentials
  WriteRegStr HKLM "SOFTWARE\Policies\Microsoft\Windows\CredentialsDelegation\AllowSavedCredentials" "1" "TERMSRV/*"
  
  ; Adiciona TERMSRV/* na lista de AllowSavedCredentialsWhenNtlmOnly
  WriteRegStr HKLM "SOFTWARE\Policies\Microsoft\Windows\CredentialsDelegation\AllowSavedCredentialsWhenNtlmOnly" "1" "TERMSRV/*"
  
  ; Opcional: ConcatenarDefaults se necessário, mas geralmente apenas adicionar a lista basta para ativar a política
!macroend
