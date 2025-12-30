// src/components/VncCsvImportModal.js
// ✨ v5.11: Modal de importação de VNC via CSV
import React, { useState, useRef, useCallback } from 'react';
import Modal from './Modal';
import {
    UploadFileIcon,
    DeleteForeverIcon,
    CheckCircleIcon,
    WarningIcon,
    CloseIcon
} from './MuiIcons';

function VncCsvImportModal({ isOpen, onClose, onImportComplete }) {
    const [csvContent, setCsvContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [preview, setPreview] = useState([]);
    const [cleanImport, setCleanImport] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [confirmText, setConfirmText] = useState('');
    const fileInputRef = useRef(null);

    // Limpa estado ao fechar
    const handleClose = useCallback(() => {
        setCsvContent('');
        setFileName('');
        setPreview([]);
        setCleanImport(false);
        setIsImporting(false);
        setResult(null);
        setConfirmText('');
        onClose();
    }, [onClose]);

    // Processa arquivo CSV
    const processFile = useCallback((file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            setCsvContent(content);
            setFileName(file.name);

            // Gera preview das primeiras 5 linhas
            const lines = content.split('\n').filter(l => l.trim()).slice(0, 6);
            const previewData = lines.map((line, idx) => {
                const parts = line.split(';').map(p => p.trim());
                return {
                    isHeader: idx === 0 && (parts[0].toLowerCase().includes('nome') || parts[0].toLowerCase().includes('host')),
                    values: parts
                };
            });
            setPreview(previewData);
        };
        reader.readAsText(file, 'UTF-8');
    }, []);

    // Handler de drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            processFile(file);
        }
    }, [processFile]);

    // Handler de seleção de arquivo
    const handleFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    // Executa importação
    const handleImport = useCallback(async () => {
        if (!csvContent) return;

        // Confirmação para importação limpa
        if (cleanImport && confirmText !== 'CONFIRMAR') {
            return;
        }

        setIsImporting(true);
        setResult(null);

        try {
            const importResult = await window.api.vnc.importCsv(csvContent, cleanImport);
            setResult(importResult);

            if (importResult.success && importResult.imported > 0) {
                // Notifica o componente pai para recarregar dados
                if (onImportComplete) {
                    onImportComplete(importResult);
                }
            }
        } catch (error) {
            setResult({
                success: false,
                error: error.message || 'Erro desconhecido na importação'
            });
        } finally {
            setIsImporting(false);
        }
    }, [csvContent, cleanImport, confirmText, onImportComplete]);

    // Conta linhas válidas (excluindo cabeçalho)
    const validLineCount = preview.length > 0
        ? preview.filter((p, i) => !(i === 0 && p.isHeader)).length
        : 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Importar VNC via CSV"
            icon={<UploadFileIcon sx={{ fontSize: 24 }} />}
            size="medium"
        >
            <div className="space-y-4">
                {/* Resultado da importação */}
                {result && (
                    <div className={`p-4 rounded-lg border ${result.success
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {result.success ? (
                                <CheckCircleIcon sx={{ fontSize: 20 }} />
                            ) : (
                                <WarningIcon sx={{ fontSize: 20 }} />
                            )}
                            <span className="font-semibold">
                                {result.success ? 'Importação Concluída!' : 'Erro na Importação'}
                            </span>
                        </div>
                        {result.success ? (
                            <div className="text-sm space-y-1">
                                <p>✅ {result.imported} conexões importadas</p>
                                {result.groupsCreated > 0 && <p>📁 {result.groupsCreated} grupos criados</p>}
                                {result.skipped > 0 && <p>⏭️ {result.skipped} duplicatas ignoradas</p>}
                                {result.failed > 0 && <p>❌ {result.failed} erros</p>}
                            </div>
                        ) : (
                            <p className="text-sm">{result.error}</p>
                        )}
                    </div>
                )}

                {/* Dropzone */}
                {!csvContent && !result && (
                    <div
                        className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center
                            hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadFileIcon sx={{ fontSize: 48 }} className="text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">
                            Arraste um arquivo CSV aqui ou clique para selecionar
                        </p>
                        <p className="text-xs text-gray-600">
                            Formato: Nome;Host;Porta;Senha;Grupo
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>
                )}

                {/* Preview do arquivo */}
                {csvContent && !result && (
                    <>
                        <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
                            <div className="flex items-center gap-2">
                                <UploadFileIcon sx={{ fontSize: 20 }} className="text-primary" />
                                <span className="text-sm font-medium text-white">{fileName}</span>
                                <span className="text-xs text-gray-500">
                                    ({validLineCount} conexões)
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setCsvContent('');
                                    setFileName('');
                                    setPreview([]);
                                }}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>

                        {/* Tabela de preview */}
                        <div className="border border-gray-700 rounded-lg overflow-hidden">
                            <div className="text-xs text-gray-500 px-3 py-1.5 bg-dark-bg border-b border-gray-700">
                                Preview (primeiras {preview.length} linhas)
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-dark-elevated sticky top-0">
                                        <tr>
                                            <th className="px-2 py-1.5 text-left text-gray-400">Nome</th>
                                            <th className="px-2 py-1.5 text-left text-gray-400">Host</th>
                                            <th className="px-2 py-1.5 text-left text-gray-400">Porta</th>
                                            <th className="px-2 py-1.5 text-left text-gray-400">Grupo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, idx) => (
                                            <tr
                                                key={idx}
                                                className={`border-t border-gray-800 ${row.isHeader ? 'text-gray-500 italic' : 'text-white'
                                                    }`}
                                            >
                                                <td className="px-2 py-1.5 truncate max-w-[120px]">{row.values[0] || '-'}</td>
                                                <td className="px-2 py-1.5">{row.values[1] || '-'}</td>
                                                <td className="px-2 py-1.5">{row.values[2] || '5900'}</td>
                                                <td className="px-2 py-1.5 truncate max-w-[100px]">{row.values[4] || 'Importados CSV'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Opção de importação limpa */}
                        <div className={`p-4 rounded-lg border ${cleanImport
                                ? 'bg-red-500/10 border-red-500/50'
                                : 'bg-dark-bg border-gray-700'
                            }`}>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cleanImport}
                                    onChange={(e) => {
                                        setCleanImport(e.target.checked);
                                        setConfirmText('');
                                    }}
                                    className="mt-1 w-4 h-4 accent-red-500"
                                />
                                <div>
                                    <span className="font-medium text-white flex items-center gap-2">
                                        <DeleteForeverIcon sx={{ fontSize: 18 }} className="text-red-500" />
                                        Importação Limpa
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">
                                        ⚠️ Remove TODAS as conexões e grupos VNC antes de importar.
                                        <br />
                                        <span className="text-red-400">Esta ação é irreversível! RDP/SSH não são afetados.</span>
                                    </p>
                                </div>
                            </label>

                            {/* Confirmação para importação limpa */}
                            {cleanImport && (
                                <div className="mt-3 pt-3 border-t border-red-500/30">
                                    <label className="text-xs text-gray-400 block mb-1">
                                        Digite CONFIRMAR para habilitar:
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                        placeholder="CONFIRMAR"
                                        className="w-full px-3 py-2 bg-dark-surface border border-red-500/50 
                                            rounded-lg text-sm text-white uppercase
                                            focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Botões */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={handleClose}
                                disabled={isImporting}
                                className="px-4 py-2 bg-dark-elevated text-gray-300 rounded-lg
                                    hover:bg-dark-border transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || (cleanImport && confirmText !== 'CONFIRMAR')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${cleanImport
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-primary hover:bg-primary-hover text-black'
                                    }`}
                            >
                                {isImporting ? 'Importando...' : cleanImport ? 'Limpar e Importar' : 'Importar'}
                            </button>
                        </div>
                    </>
                )}

                {/* Botão de fechar após resultado */}
                {result && (
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-primary hover:bg-primary-hover text-black 
                                rounded-lg font-medium transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default VncCsvImportModal;
