import React, { useState } from 'react';
import { X, Upload, Building, User, MapPin, Mail, Phone, Camera, ChevronRight, Check, Plus, Trash2, ArrowLeft, Pencil } from 'lucide-react'; // Added Pencil
import { Button } from '../ui/Button';

interface CompanyRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

type Step = 1 | 2 | 3;

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [formData, setFormData] = useState({
        // Step 1: Company Data
        nomeFantasia: '',
        razaoSocial: '',
        cnpj: '',
        responsavel: '',
        email: '',
        telefone: '',
        cep: '',
        rua: '',
        bairro: '',
        cidade: '',
        uf: '',
        isMultiUnit: false,

        // Step 2: Sectors
        setores: [] as string[],

        // Step 3: Roles
        cargos: [] as { nome: string; setor: string }[]
    });

    const [newSector, setNewSector] = useState('');
    const [newRole, setNewRole] = useState('');
    const [selectedSectorForRole, setSelectedSectorForRole] = useState('');

    // Editing State
    const [editingSectorIndex, setEditingSectorIndex] = useState<number | null>(null);
    const [tempSectorName, setTempSectorName] = useState('');

    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
    const [tempRoleName, setTempRoleName] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- Sector Logic ---
    const addSector = () => {
        if (!newSector.trim()) return;
        setFormData(prev => ({
            ...prev,
            setores: [...prev.setores, newSector.trim()]
        }));
        setNewSector('');
    };

    const removeSector = (index: number) => {
        const sectorToRemove = formData.setores[index];
        setFormData(prev => ({
            ...prev,
            setores: prev.setores.filter((_, i) => i !== index),
            // Also remove roles linked to this sector to maintain consistency
            cargos: prev.cargos.filter(c => c.setor !== sectorToRemove)
        }));
    };

    const startEditSector = (index: number) => {
        setEditingSectorIndex(index);
        setTempSectorName(formData.setores[index]);
    };

    const handleSaveSector = (index: number) => {
        if (!tempSectorName.trim()) return;
        const oldSectorName = formData.setores[index];

        setFormData(prev => {
            const updatedSectors = [...prev.setores];
            updatedSectors[index] = tempSectorName.trim();

            const updatedCargos = prev.cargos.map(cargo =>
                cargo.setor === oldSectorName
                    ? { ...cargo, setor: tempSectorName.trim() }
                    : cargo
            );

            return {
                ...prev,
                setores: updatedSectors,
                cargos: updatedCargos
            };
        });
        setEditingSectorIndex(null);
        setTempSectorName('');
    };

    const cancelEditSector = () => {
        setEditingSectorIndex(null);
        setTempSectorName('');
    };

    // --- Role Logic ---
    const addRole = () => {
        if (!newRole.trim() || !selectedSectorForRole) return;
        setFormData(prev => ({
            ...prev,
            cargos: [...prev.cargos, { nome: newRole.trim(), setor: selectedSectorForRole }]
        }));
        setNewRole('');
        // Keep sector selected for convenience
    };

    const removeRole = (index: number) => {
        setFormData(prev => ({
            ...prev,
            cargos: prev.cargos.filter((_, i) => i !== index)
        }));
    };

    const startEditRole = (index: number) => {
        setEditingRoleIndex(index);
        setTempRoleName(formData.cargos[index].nome);
    };

    const handleSaveRole = (index: number) => {
        if (!tempRoleName.trim()) return;
        setFormData(prev => {
            const updatedCargos = [...prev.cargos];
            updatedCargos[index] = { ...updatedCargos[index], nome: tempRoleName.trim() };
            return {
                ...prev,
                cargos: updatedCargos
            };
        });
        setEditingRoleIndex(null);
        setTempRoleName('');
    };

    const cancelEditRole = () => {
        setEditingRoleIndex(null);
        setTempRoleName('');
    };


    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(prev => (prev + 1) as Step);
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => (prev - 1) as Step);
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

                {/* Header with Stepper */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Cadastrar Nova Empresa</h2>
                            <p className="text-slate-500 text-sm">Passo {currentStep} de 3</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Stepper Visual */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                    className={`h-full ${step <= currentStep ? 'bg-[#35b6cf]' : 'bg-transparent'} transition-all duration-300`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Body - Scrollable */}
                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">

                    {/* STEP 1: Company Data */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Identity & Profile Photo */}
                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                <div className="flex-1 space-y-6 w-full">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Building size={16} className="text-[#35b6cf]" />
                                            Dados Empresariais
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">Nome Fantasia</label>
                                                <input
                                                    type="text"
                                                    name="nomeFantasia"
                                                    value={formData.nomeFantasia}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                                    placeholder="Ex: Gama Center"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">Razão Social</label>
                                                <input
                                                    type="text"
                                                    name="razaoSocial"
                                                    value={formData.razaoSocial}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                                    placeholder="Ex: Gama Center LTDA"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 space-y-1.5">
                                                <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                                                <input
                                                    type="text"
                                                    name="cnpj"
                                                    value={formData.cnpj}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                                    placeholder="00.000.000/0001-00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto flex flex-col items-center space-y-3 pt-6">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300 group-hover:bg-slate-200 transition-colors">
                                            <Camera size={40} />
                                        </div>
                                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload size={24} className="text-white" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-[#35b6cf] text-white p-2 rounded-full border-2 border-white shadow-sm">
                                            <Upload size={14} />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">Logo da Empresa</span>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Contact Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <User size={16} className="text-[#35b6cf]" />
                                    Contato
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Nome do Responsável</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                name="responsavel"
                                                value={formData.responsavel}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="Nome completo"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Email Corporativo</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="email@empresa.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Telefone / WhatsApp</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="tel"
                                                name="telefone"
                                                value={formData.telefone}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Address Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin size={16} className="text-[#35b6cf]" />
                                    Endereço
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">CEP</label>
                                        <input
                                            type="text"
                                            name="cep"
                                            value={formData.cep}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="00000-000"
                                        />
                                    </div>
                                    <div className="md:col-span-4 space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Rua</label>
                                        <input
                                            type="text"
                                            name="rua"
                                            value={formData.rua}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Av. Paulista, 1000"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Bairro</label>
                                        <input
                                            type="text"
                                            name="bairro"
                                            value={formData.bairro}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Bela Vista"
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Cidade</label>
                                        <input
                                            type="text"
                                            name="cidade"
                                            value={formData.cidade}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="São Paulo"
                                        />
                                    </div>
                                    <div className="md:col-span-1 space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">UF</label>
                                        <input
                                            type="text"
                                            name="uf"
                                            value={formData.uf}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="SP"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Unit Configuration Checkbox */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isMultiUnit: !prev.isMultiUnit }))}>
                                <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.isMultiUnit ? 'bg-[#35b6cf] border-[#35b6cf] text-white' : 'bg-white border-slate-300'}`}>
                                    {formData.isMultiUnit && <Check size={14} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Empresa com Multi-unidades</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Marque esta opção se a empresa possui filiais ou unidades separadas que precisam ser gerenciadas individualmente.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Sectors */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center max-w-lg mx-auto mb-8">
                                <h3 className="text-xl font-bold text-slate-800">Definir Setores</h3>
                                <p className="text-slate-500 mt-2">Cadastre os setores ou departamentos da empresa para organizar os colaboradores.</p>
                            </div>

                            <div className="max-w-xl mx-auto">
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={newSector}
                                        onChange={(e) => setNewSector(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSector()}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Nome do setor (ex: RH, Vendas, TI)"
                                    />
                                    <button
                                        onClick={addSector}
                                        className="bg-[#35b6cf] text-white p-3 rounded-xl hover:bg-[#2ca3bc] transition-colors"
                                    >
                                        <Plus size={24} />
                                    </button>
                                </div>

                                {formData.setores.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400">Nenhum setor cadastrado ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.setores.map((setor, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-[#35b6cf]/50 transition-colors group">

                                                {/* Edit Mode for Sector */}
                                                {editingSectorIndex === idx ? (
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={tempSectorName}
                                                            onChange={(e) => setTempSectorName(e.target.value)}
                                                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#35b6cf] focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 text-slate-700 bg-slate-50"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSector(idx)}
                                                        />
                                                        <button onClick={() => handleSaveSector(idx)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg">
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={cancelEditSector} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // View Mode for Sector
                                                    <>
                                                        <span className="font-medium text-slate-700 pl-2">{setor}</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => startEditSector(idx)}
                                                                className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-[#35b6cf]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Editar"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => removeSector(idx)}
                                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Remover"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Roles */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center max-w-lg mx-auto mb-8">
                                <h3 className="text-xl font-bold text-slate-800">Definir Cargos</h3>
                                <p className="text-slate-500 mt-2">Cadastre os cargos para padronizar as funções dos colaboradores e vincule-os aos setores.</p>
                            </div>

                            <div className="max-w-xl mx-auto">
                                <div className="flex flex-col gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-1">
                                            <select
                                                value={selectedSectorForRole}
                                                onChange={(e) => setSelectedSectorForRole(e.target.value)}
                                                className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none text-slate-600 bg-white"
                                            >
                                                <option value="" disabled>Selecione o Setor</option>
                                                {formData.setores.map((setor, idx) => (
                                                    <option key={idx} value={setor}>{setor}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2 flex gap-2">
                                            <input
                                                type="text"
                                                value={newRole}
                                                onChange={(e) => setNewRole(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                                                disabled={!selectedSectorForRole}
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                                                placeholder={selectedSectorForRole ? "Nome do cargo" : "Selecione um setor primeiro"}
                                            />
                                            <button
                                                onClick={addRole}
                                                disabled={!selectedSectorForRole || !newRole.trim()}
                                                className="bg-[#35b6cf] text-white p-3 rounded-xl hover:bg-[#2ca3bc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {formData.cargos.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400">Nenhum cargo cadastrado ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.cargos.map((cargo, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-[#35b6cf]/50 transition-colors group">

                                                {/* Edit Mode for Role */}
                                                {editingRoleIndex === idx ? (
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={tempRoleName}
                                                            onChange={(e) => setTempRoleName(e.target.value)}
                                                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#35b6cf] focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 text-slate-700 bg-slate-50"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRole(idx)}
                                                            placeholder="Nome do cargo"
                                                        />
                                                        <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1 border-l border-slate-200">
                                                            <Building size={10} />
                                                            {cargo.setor}
                                                        </span>
                                                        <button onClick={() => handleSaveRole(idx)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg">
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={cancelEditRole} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // View Mode for Role
                                                    <>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-700 pl-2">{cargo.nome}</span>
                                                            <span className="text-xs text-slate-400 pl-2 font-medium bg-slate-50 w-fit px-2 py-0.5 rounded-full mt-1 border border-slate-100 flex items-center gap-1">
                                                                <Building size={10} />
                                                                {cargo.setor}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => startEditRole(idx)}
                                                                className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-[#35b6cf]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Editar"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => removeRole(idx)}
                                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Remover"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        {currentStep > 1 && (
                            <Button variant="ghost" onClick={handleBack} className="text-slate-500 flex items-center gap-2 pl-0 hover:bg-transparent hover:text-slate-800">
                                <ArrowLeft size={16} />
                                Voltar
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="text-slate-500">
                            Cancelar
                        </Button>
                        {currentStep < 3 ? (
                            <Button
                                onClick={handleNext}
                                variant="primary"
                                className="bg-[#35b6cf] hover:bg-[#2ca3bc] text-white px-8 flex items-center gap-2"
                            >
                                Próximo
                                <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                variant="primary"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 flex items-center gap-2"
                            >
                                <Check size={16} />
                                Finalizar Cadastro
                            </Button>
                        )}
                    </div>
                </div>

            </div>
        </div >
    );
};
