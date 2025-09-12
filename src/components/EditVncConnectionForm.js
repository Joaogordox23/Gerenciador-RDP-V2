// src/components/EditVncConnectionForm.js

import React, { useState } from 'react';

/**
 * Componente de formulário para editar uma conexão VNC existente.
 * @param {object} props - As propriedades do componente.
 * @param {object} props.connectionInfo - Os dados atuais da conexão a ser editada.
 * @param {function} props.onSave - Função a ser chamada quando as alterações são salvas.
 * @param {function} props.onCancel - Função a ser chamada para cancelar a edição.
 */
function EditVncConnectionForm({ connectionInfo, onSave, onCancel }) {
    // Inicia o estado do formulário com os dados da conexão existente.
    const [formData, setFormData] = useState({ ...connectionInfo });
    const [errors, setErrors] = useState({});

    /**
     * Valida os campos do formulário para garantir que os dados essenciais estão presentes.
     * @returns {boolean} - Retorna true se o formulário for válido, false caso contrário.
     */
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.ipAddress.trim()) newErrors.ipAddress = 'IP/Hostname é obrigatório';
        if (!formData.port) newErrors.port = 'Porta é obrigatória';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Atualiza o estado do formulário conforme o usuário digita ou seleciona opções.
     * @param {React.ChangeEvent<HTMLInputElement>} event - O evento de mudança do input.
     */
    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    /**
     * Lida com o envio do formulário, validando os dados e chamando a função onSave.
     * @param {React.FormEvent<HTMLFormElement>} event - O evento de envio do formulário.
     */
    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            onSave(formData); // Envia os dados atualizados para o componente pai.
        }
    };

    return (
        // A classe 'server-edit-form-inline' aplica um estilo consistente com outras edições.
        <div className="server-edit-form-inline">
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    {/* Campo Nome */}
                    <div className="form-row">
                        <label className="form-label">Nome *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            autoFocus
                        />
                    </div>

                    {/* Campo IP/Hostname */}
                    <div className="form-row">
                        <label className="form-label">IP/Hostname *</label>
                        <input
                            type="text"
                            name="ipAddress"
                            value={formData.ipAddress}
                            onChange={handleInputChange}
                            className={`form-input ${errors.ipAddress ? 'error' : ''}`}
                        />
                    </div>

                    {/* Campo Porta */}
                    <div className="form-row">
                        <label className="form-label">Porta *</label>
                        <input
                            type="number"
                            name="port"
                            value={formData.port}
                            onChange={handleInputChange}
                            className={`form-input ${errors.port ? 'error' : ''}`}
                        />
                    </div>

                    {/* Campo Senha */}
                    <div className="form-row">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Deixe em branco para não alterar"
                        />
                    </div>

                    {/* Checkbox Apenas Visualização */}
                    <div className="form-row" style={{ alignSelf: 'center' }}>
                         <div className="protocol-option">
                            <input
                                type="checkbox"
                                id={`vnc-viewonly-edit-${formData.id}`}
                                name="viewOnly"
                                checked={formData.viewOnly}
                                onChange={handleInputChange}
                            />
                            <label htmlFor={`vnc-viewonly-edit-${formData.id}`} className="protocol-label">
                                Apenas Visualização
                            </label>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="form-actions" style={{ marginTop: '16px' }}>
                    <button type="button" onClick={onCancel} className="btn-cancel">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-submit">
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditVncConnectionForm;