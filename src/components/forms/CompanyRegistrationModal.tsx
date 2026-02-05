/*
 * ESTE COMPONENTE (CompanyRegistrationModal) É O FORMULÁRIO PRINCIPAL PARA CADASTRAR OU EDITAR UMA EMPRESA.
 * Ele funciona como uma janela (modal) que se abre sobre a tela principal e permite gerenciar:
 * - Dados básicos da empresa (CNPJ, Nome, Endereço).
 * - Unidades (Filiais) da empresa.
 * - Setores (Ex: Administrativo, RH, TI).
 * - Cargos (Ex: Gerente, Analista).
 * - Colaboradores (Funcionários) e suas vinculações.
 */

// Importa as ferramentas básicas do React para criar componentes e gerenciar estados (memória local)
import React, { useState, useEffect } from 'react';
// Importa ícones da biblioteca lucide-react para deixar a interface visualmente amigável
import { X, Building, Camera, ChevronRight, Check, Plus, Trash2, Pencil, Users, LayoutGrid, Briefcase, Search, Filter, MoreVertical, AlertTriangle } from 'lucide-react';
// Importa um componente de botão padronizado do próprio projeto
import { Button } from '../ui/Button';

// Define quais informações o componente (janela) precisa receber para funcionar
interface CompanyRegistrationModalProps {
    isOpen: boolean;        // Diz se a janela deve estar aberta ou fechada
    onClose: () => void;    // Função que é chamada quando o usuário clica em fechar
    onSave: (data: any) => void; // Função que salva todos os dados preenchidos
    initialData?: any;      // Dados iniciais se estivermos editando uma empresa existente
    isLoading?: boolean;    // Diz se o sistema está ocupado salvando/carregando
}

// Define as abas de navegação que aparecem no lado esquerdo da janela
type Section = 'dados' | 'unidades' | 'setores' | 'cargos' | 'colaboradores';

// Início da definição principal do componente
export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({ isOpen, onClose, onSave, initialData, isLoading }) => {
    // Se a janela não estiver marcada como aberta, não desenha nada na tela
    if (!isOpen) return null;

    // Define como as informações começam quando o formulário está limpo (em branco)
    const initialEmptyState = {
        // Campos para os dados básicos da empresa
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
        isMultiUnit: false, // Indica se a empresa tem mais de uma filial

        // Listas que guardam os setores e cargos cadastrados
        setores: [] as string[],
        cargos: [] as { nome: string; setor: string }[],
        // Lista que guarda todos os funcionários (colaboradores)
        colaboradores: [] as { nome: string; email: string; telefone: string; cargo: string; setor: string; dataNascimento: string; sexo: string; unidade_id?: number | string }[],

        // Lista de unidades/filiais da empresa (começa com uma chamada 'Matriz')
        units: [{ id: Date.now(), name: 'Matriz', sectors: [] }] as { id: number | string; name: string; sectors: string[] }[],
        // Guarda qual unidade o usuário selecionou no momento para ver os detalhes
        selectedUnitId: null as number | string | null
    };

    // Cria uma variável para controlar qual aba (Dados, Setores, etc.) está selecionada
    const [activeSection, setActiveSection] = useState<Section>('dados');
    // Cria a memória principal que guarda todas as informações que o usuário digita no formulário
    const [formData, setFormData] = useState(initialEmptyState);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                console.log('[INIT] Raw Data:', initialData);

                // 1. Carrega a lista Mestra Global (apenas para referência de legado)
                const globalMasterList = (initialData.setores || []).map((s: string) => String(s).trim()).filter(Boolean);

                // 2. Sanitização Estrita das Unidades
                let sanitizedUnits = (initialData.units || []).map((u: any) => ({
                    ...u,
                    id: String(u.id), // Garante ID como string
                    // CORREÇÃO CRÍTICA: Carrega APENAS 'sectors'. Removemos 'setores' para evitar duplicação global.
                    sectors: (u.sectors || []).map((s: any) => String(s).trim()).filter(Boolean)
                }));

                // 3. Lógica de Legado/Migração (Só roda se for uma empresa antiga de 1 unidade E ela estiver vazia)
                if (sanitizedUnits.length === 1 && sanitizedUnits[0].sectors.length === 0 && globalMasterList.length > 0) {
                    console.log('[INIT] Migração Legada: Copiando setores globais para a única unidade existente.');
                    sanitizedUnits[0].sectors = [...globalMasterList];
                }

                // Se não veio unidade nenhuma do banco, cria a Matriz padrão (sem setores ou com globais se for nova)
                if (sanitizedUnits.length === 0) {
                    sanitizedUnits = [{ id: String(Date.now()), name: 'Matriz', sectors: [] }];
                }

                // 4. Reconstrói a lista global consolidada baseada no que está nas unidades
                const allSectorsConsolidated = Array.from(new Set([
                    ...globalMasterList,
                    ...sanitizedUnits.flatMap((u: any) => u.sectors)
                ])) as string[];

                // 5. Mapeamento de Cargos
                let finalRoles = initialData.cargos || [];
                // Se não tiver cargos estruturados, tenta montar baseado em strings simples
                if (!finalRoles.length && initialData.roles && initialData.roles.length > 0) {
                    finalRoles = initialData.roles.flatMap((r: string) =>
                        allSectorsConsolidated.length > 0
                            ? allSectorsConsolidated.map((s: string) => ({ nome: r, setor: s }))
                            : [{ nome: r, setor: 'Geral' }]
                    );
                }

                setFormData({
                    nomeFantasia: initialData.nomeFantasia || initialData.name || '',
                    razaoSocial: initialData.razaoSocial || initialData.name || '',
                    cnpj: initialData.cnpj || '',
                    responsavel: initialData.responsavel || '',
                    email: initialData.email || '',
                    telefone: initialData.telefone || '',
                    cep: initialData.cep || '',
                    rua: initialData.rua || '',
                    bairro: initialData.bairro || '',
                    cidade: initialData.cidade || '',
                    uf: initialData.uf || '',

                    isMultiUnit: sanitizedUnits.length > 1,

                    setores: allSectorsConsolidated,
                    cargos: finalRoles,

                    colaboradores: (initialData.collaborators || []).map((c: any) => ({
                        ...c,
                        id: String(c.id),
                        dataNascimento: c.dataNascimento || c.data_nascimento || '',
                        unidade_id: c.unidade_id ? String(c.unidade_id) : null,
                        cargo: c.cargo || (formData.cargos.find((r: any) => r.id === c.cargo_id)?.nome) || '',
                        setor: c.setor || (formData.setores.find((s: any, i: number) => i === c.setor_id) || '') // Simplified sector resolution
                    })),

                    units: sanitizedUnits,
                    // Seleciona a primeira unidade por padrão
                    selectedUnitId: sanitizedUnits.length > 0 ? String(sanitizedUnits[0].id) : null
                });
            } else {
                setFormData(initialEmptyState);
            }
            setActiveSection('dados');
        }
    }, [isOpen, initialData]);

    // Variáveis temporárias para guardar o que o usuário está digitando antes de clicar em 'Adicionar'
    const [newSector, setNewSector] = useState(''); // Guarda o nome de um novo setor
    const [newRole, setNewRole] = useState(''); // Guarda o nome de um novo cargo
    const [selectedSectorForRole, setSelectedSectorForRole] = useState(''); // Guarda qual setor foi escolhido para o novo cargo
    const [newUnitName, setNewUnitName] = useState(''); // Guarda o nome de uma nova unidade (filial)

    // --- Auxiliares (Helpers) ---
    // Função que limpa o texto (remove espaços e deixa tudo em minúsculo) para facilitar comparações
    const normalizeText = (text: string) => text.trim().toLowerCase();

    // --- Lógica de Unidades (Filiais) ---
    // Função chamada quando o usuário troca de unidade no seletor (dropdown)
    const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value; // Pega o ID da unidade selecionada
        // Garante que o ID seja tratado como texto para não dar erro em IDs longos
        const newUnitId = value || null;
        // Procura na lista qual é a unidade completa que tem esse ID
        const selectedUnit = formData.units.find(u => String(u.id) === String(newUnitId));

        // Se uma unidade foi selecionada, avisa no console para ajudar no monitoramento
        if (newUnitId) {
            console.log(`[UNIT CHANGE] Switched to Unit: ${selectedUnit?.name || 'Unknown'} (ID: ${newUnitId})`);
        }

        // Limpa os filtros de busca e seleções anteriores para não misturar dados de unidades diferentes
        setSelectedSectorForRole('');
        setNewRole('');
        setCollabSearch('');
        // Reseta o formulário de funcionário para garantir que ele escolha um setor da nova unidade
        setCollaboratorForm(prev => ({ ...prev, setor: '', cargo: '' }));

        // Atualiza a memória principal dizendo qual unidade está ativa agora
        setFormData(prev => ({ ...prev, selectedUnitId: newUnitId }));
    };

    // Função para adicionar uma nova unidade (filial)
    const addUnit = () => {
        if (!newUnitName.trim()) return; // Não faz nada se o nome estiver vazio
        const newUnit = {
            id: String(Date.now()), // Cria um ID único baseado na hora atual
            name: newUnitName.trim(), // Pega o nome digitado removendo espaços inúteis
            sectors: [] // Uma unidade nova começa sem nenhum setor vinculado
        };
        // Adiciona a nova unidade à lista existente na memória
        setFormData(prev => ({
            ...prev,
            units: [...prev.units, newUnit]
        }));
        // Limpa o campo de texto para a próxima unidade
        setNewUnitName('');
    };

    // Função para remover uma unidade (filial)
    const removeUnit = (id: number | string) => {
        // Regra: Não pode apagar se só existir uma unidade (toda empresa precisa de ao menos uma)
        if (formData.units.length <= 1) {
            alert('A empresa deve ter no mínimo uma unidade.');
            return;
        }
        setFormData(prev => {
            // Cria uma nova lista sem a unidade que o usuário quer apagar
            const updatedUnits = prev.units.filter(u => String(u.id) !== String(id));
            // Verifica se a unidade apagada era a que estava selecionada na tela
            const isRemovingSelected = String(prev.selectedUnitId) === String(id);

            return {
                ...prev,
                units: updatedUnits,
                // Se apagou a selecionada, troca automaticamente para a primeira da nova lista
                selectedUnitId: isRemovingSelected
                    ? (updatedUnits.length > 0 ? String(updatedUnits[0].id) : null)
                    : prev.selectedUnitId
            };
        });
    };

    // Função para mudar o nome de uma unidade que já existe
    const updateUnitName = (id: number | string, newName: string) => {
        setFormData(prev => ({
            ...prev,
            // Percorre a lista e só altera o nome daquela que tem o ID correspondente
            units: prev.units.map(u => String(u.id) === String(id) ? { ...u, name: newName } : u)
        }));
    };

    // Variáveis para controlar quando o usuário clica em 'Editar' o nome de uma unidade
    const [editingUnitId, setEditingUnitId] = useState<number | string | null>(null);
    const [tempUnitName, setTempUnitName] = useState(''); // Guarda o nome enquanto o usuário edita

    // Ativa o modo de edição para uma unidade específica
    const startEditUnit = (unit: any) => {
        setEditingUnitId(unit.id);
        setTempUnitName(unit.name);
    };

    // Salva a alteração do nome da unidade e sai do modo de edição
    const saveEditUnit = () => {
        if (editingUnitId === null || !tempUnitName.trim()) return;
        updateUnitName(editingUnitId, tempUnitName.trim());
        setEditingUnitId(null);
        setTempUnitName('');
    };

    // --- Estados de Edição (Geral) ---
    // Controla qual Setor o usuário está editando no momento (guarda a posição na lista)
    const [editingSectorIndex, setEditingSectorIndex] = useState<number | null>(null);
    const [tempSectorName, setTempSectorName] = useState(''); // Guarda o nome do setor durante a edição

    // Controla qual Cargo o usuário está editando no momento
    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
    const [tempRoleName, setTempRoleName] = useState(''); // Guarda o nome do cargo durante a edição

    // --- Estados dos Colaboradores (Funcionários) ---
    // Controla se o formulário de 'Adicionar Novo Funcionário' está aberto ou fechado
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);

    // Estados para a Tabela e Busca de Funcionários
    const [collabSearch, setCollabSearch] = useState(''); // Guarda o que o usuário digita na barra de busca
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false); // Controla se o menu de filtros extras está aberto
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({}); // Guarda quais filtros (Sexo, Cargo, etc) estão ativos

    // Função que marca ou desmarca um filtro específico
    const handleFilterSelect = (column: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[column] || [];
            if (current.includes(value)) {
                // Se já estava marcado, desmarca (remove da lista)
                return { ...prev, [column]: current.filter(v => v !== value) };
            } else {
                // Se não estava marcado, marca (adiciona à lista)
                return { ...prev, [column]: [...current, value] };
            }
        });
    };

    // Lógica para Filtrar a Tabela de Funcionários na Tela
    const filteredCollaborators = formData.colaboradores.filter(colab => {
        // 1. Filtro de Unidade: Só mostra funcionários que pertencem à unidade selecionada
        if (formData.selectedUnitId) {
            if (!colab.unidade_id || String(colab.unidade_id) !== String(formData.selectedUnitId)) {
                return false;
            }
        }

        // 2. Busca Global: Verifica se o nome, setor ou cargo contém o texto digitado na busca
        const searchLower = collabSearch.toLowerCase();
        const matchesSearch =
            (colab.nome || '').toLowerCase().includes(searchLower) ||
            (colab.setor || '').toLowerCase().includes(searchLower) ||
            (colab.cargo || '').toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // 3. Filtros de Coluna: Verifica se o funcionário atende aos filtros de Sexo, Cargo e Setor
        if (selectedFilters['sexo']?.length && !selectedFilters['sexo'].includes(colab.sexo)) return false;
        if (selectedFilters['cargo']?.length && !selectedFilters['cargo'].includes(colab.cargo)) return false;
        if (selectedFilters['setor']?.length && !selectedFilters['setor'].includes(colab.setor)) return false;

        return true; // Se passar por tudo, o funcionário aparece na lista
    });

    // Função que descobre quais são as opções únicas (Ex: quais cargos existem) para mostrar no menu de filtro
    const getUniqueValues = (column: 'sexo' | 'cargo' | 'setor') => {
        // Pega apenas os valores dos funcionários que estão visíveis no momento
        return Array.from(new Set(filteredCollaborators.map(c => c[column]).filter(Boolean)));
    };

    // --- Estados de Controle de Ações (Menus e Modais) ---
    // Controla qual menu de 'três pontinhos' (ações) está aberto na tabela
    const [actionMenuOpenIndex, setActionMenuOpenIndex] = useState<number | null>(null);
    // Guarda qual funcionário o usuário clicou para apagar (esperando confirmação)
    const [deleteConfirmationIndex, setDeleteConfirmationIndex] = useState<number | null>(null);

    // Controle da Janela de Edição de Funcionário
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Abre/fecha o modal de edição
    const [editingCollaboratorIndex, setEditingCollaboratorIndex] = useState<number | null>(null); // Qual funcionário está sendo editado
    // Guarda os dados temporários do funcionário enquanto ele é editado
    const [editCollaboratorForm, setEditCollaboratorForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        setor: '',
        cargo: '',
        dataNascimento: '',
        sexo: ''
    });

    // Guarda os dados do formulário de 'Novo Funcionário'
    const [collaboratorForm, setCollaboratorForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        setor: '',
        cargo: '',
        dataNascimento: '',
        sexo: ''
    });

    // Função que atualiza os campos do formulário de NOVO funcionário conforme o usuário digita
    const handleCollaboratorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCollaboratorForm(prev => {
            // Se o usuário mudar o setor, limpa o cargo atual (pois o cargo depende do setor)
            if (name === 'setor') {
                return { ...prev, [name]: value, cargo: '' };
            }
            return { ...prev, [name]: value };
        });
    };

    // Função que atualiza os campos do formulário de EDIÇÃO de funcionário
    const handleEditCollaboratorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditCollaboratorForm(prev => {
            if (name === 'setor') {
                return { ...prev, [name]: value, cargo: '' };
            }
            return { ...prev, [name]: value };
        });
    };

    // Abre a janelinha para editar um funcionário específico
    const openEditModal = (colab: any, index: number) => {
        setEditingCollaboratorIndex(index); // Salva a posição dele na lista global
        setEditCollaboratorForm({ ...colab }); // Copia os dados dele para o formulário de edição
        setIsEditModalOpen(true); // Abre o modal
        setActionMenuOpenIndex(null); // Fecha o menu de 'três pontinhos'
    };

    // Salva as alterações feitas no funcionário editado
    const saveEditCollaborator = () => {
        if (editingCollaboratorIndex === null) return;
        setFormData(prev => {
            const updated = [...prev.colaboradores];
            // Substitui os dados antigos pelos novos dados do formulário de edição
            updated[editingCollaboratorIndex] = { ...editCollaboratorForm };
            return { ...prev, colaboradores: updated };
        });
        setIsEditModalOpen(false); // Fecha o modal
        setEditingCollaboratorIndex(null);
    };

    // Confirma a exclusão de um funcionário
    const confirmDeleteCollaborator = () => {
        if (deleteConfirmationIndex === null) return;
        removeCollaborator(deleteConfirmationIndex); // Remove da lista
        setDeleteConfirmationIndex(null); // Fecha o aviso de confirmação
    };

    // Adiciona um novo funcionário à lista da empresa
    const addCollaborator = () => {
        // Só adiciona se os campos básicos estiverem preenchidos
        if (!collaboratorForm.nome || !collaboratorForm.email || !collaboratorForm.cargo || !collaboratorForm.setor) return;
        setFormData(prev => ({
            ...prev,
            colaboradores: [...prev.colaboradores, {
                ...collaboratorForm,
                // Vincula o funcionário à unidade que está selecionada no momento
                unidade_id: prev.selectedUnitId || undefined
            }]
        }));
        // Limpa o formulário para a próxima adição
        setCollaboratorForm({
            nome: '',
            email: '',
            telefone: '',
            setor: '',
            cargo: '',
            dataNascimento: '',
            sexo: ''
        });
    };

    // Remove um funcionário da lista (pela posição na lista)
    const removeCollaborator = (index: number) => {
        setFormData(prev => ({
            ...prev,
            colaboradores: prev.colaboradores.filter((_, i) => i !== index)
        }));
    };

    // Função geral para atualizar campos simples de texto na aba 'Dados Gerais'
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            // Se for um 'checkbox', usa o valor 'checked' (v/f), senão usa o texto digitado
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- Lógica de Setores ---
    // Função para adicionar um novo setor (ex: RH, TI, Produção)
    const addSector = () => {
        if (!newSector.trim()) return; // Não faz nada se o nome estiver em branco
        const sName = newSector.trim();
        setFormData(prev => {
            // 1. Atualiza a lista GERAL de setores se o nome for novo (único)
            const newSetores = prev.setores.some(s => normalizeText(s) === normalizeText(sName))
                ? prev.setores // Se já existe, não adiciona de novo
                : [...prev.setores, sName];

            // 2. Vincula o setor à UNIDADE selecionada
            let newUnits = prev.units;
            if (prev.selectedUnitId) {
                // Procura a unidade ativa e coloca o setor na lista dela
                newUnits = prev.units.map(u => {
                    if (String(u.id) === String(prev.selectedUnitId)) {
                        const unitHasSector = u.sectors.some(s => normalizeText(s) === normalizeText(sName));
                        return { ...u, sectors: unitHasSector ? u.sectors : [...u.sectors, sName] };
                    }
                    return u;
                });
            } else if (prev.units.length === 1) {
                // Se só houver uma unidade (Matriz), adiciona automaticamente nela
                newUnits = prev.units.map((u, idx) => {
                    const unitHasSector = u.sectors.some(s => normalizeText(s) === normalizeText(sName));
                    return idx === 0 ? { ...u, sectors: unitHasSector ? u.sectors : [...u.sectors, sName] } : u;
                });
            }

            return { ...prev, setores: newSetores, units: newUnits };
        });
        setNewSector(''); // Limpa o campo para o próximo setor
    };

    // Função para apagar um setor completamente
    const removeSector = (sectorToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            // Remove da lista mestre de setores
            setores: prev.setores.filter(s => normalizeText(s) !== normalizeText(sectorToRemove)),
            // Remove todos os cargos que estavam ligados a esse setor
            cargos: prev.cargos.filter(c => normalizeText(c.setor) !== normalizeText(sectorToRemove)),
            // Remove o setor de dentro de TODAS as filiais (unidades)
            units: prev.units.map(u => ({
                ...u,
                sectors: u.sectors.filter(s => normalizeText(s) !== normalizeText(sectorToRemove))
            }))
        }));
    };

    // Abre o modo de edição para renomear um setor
    const startEditSector = (index: number) => {
        setEditingSectorIndex(index);
        setTempSectorName(formData.setores[index]); // Coloca o nome atual no campo de preenchimento
    };

    // Salva o novo nome do setor e atualiza tudo o que for ligado a ele
    const handleSaveSector = (index: number) => {
        if (!tempSectorName.trim()) return;
        const oldSectorName = formData.setores[index];
        const newSectorName = tempSectorName.trim();

        setFormData(prev => {
            // 1. Atualiza o nome na lista mestre
            const updatedSectors = [...prev.setores];
            updatedSectors[index] = newSectorName;

            // 2. Atualiza o nome do setor em todos os cargos que o utilizavam
            const updatedCargos = prev.cargos.map(cargo =>
                normalizeText(cargo.setor) === normalizeText(oldSectorName)
                    ? { ...cargo, setor: newSectorName }
                    : cargo
            );

            // 3. Atualiza o nome em todas as unidades (filiais) que tinham esse setor
            const updatedUnits = prev.units.map(u => ({
                ...u,
                sectors: u.sectors.map(s =>
                    normalizeText(s) === normalizeText(oldSectorName) ? newSectorName : s
                )
            }));

            return {
                ...prev,
                setores: updatedSectors,
                cargos: updatedCargos,
                units: updatedUnits
            };
        });
        setEditingSectorIndex(null); // Sai do modo de edição
        setTempSectorName('');
    };

    // Cancela a edição sem salvar nada
    const cancelEditSector = () => {
        setEditingSectorIndex(null);
        setTempSectorName('');
    };

    // --- Lógica de Cargos (Funções) ---
    // Função para adicionar um novo cargo (ex: Analista dentro do setor RH)
    const addRole = () => {
        // Só adiciona se o nome for preenchido e um setor for escolhido
        if (!newRole.trim() || !selectedSectorForRole) return;
        const rName = newRole.trim();
        setFormData(prev => {
            // Verifica se esse cargo já existe dentro do mesmo setor
            const roleExists = prev.cargos.some(c =>
                normalizeText(c.nome) === normalizeText(rName) &&
                normalizeText(c.setor) === normalizeText(selectedSectorForRole)
            );
            if (roleExists) return prev; // Se já existe, não faz nada
            return {
                ...prev,
                cargos: [...prev.cargos, { nome: rName, setor: selectedSectorForRole }]
            };
        });
        setNewRole(''); // Limpa o campo do nome
    };

    // Remove um cargo da lista
    const removeRole = (cargoToRemove: { nome: string; setor: string }) => {
        setFormData(prev => ({
            ...prev,
            cargos: prev.cargos.filter(c =>
                !(normalizeText(c.nome) === normalizeText(cargoToRemove.nome) &&
                    normalizeText(c.setor) === normalizeText(cargoToRemove.setor))
            )
        }));
    };

    // Inicia a edição do nome de um cargo
    const startEditRole = (index: number) => {
        setEditingRoleIndex(index);
        setTempRoleName(formData.cargos[index].nome);
    };

    // Salva o novo nome do cargo
    const handleSaveRole = (index: number) => {
        if (!tempRoleName.trim()) return;
        setFormData(prev => {
            const updated = [...prev.cargos];
            updated[index] = { ...updated[index], nome: tempRoleName.trim() };
            return { ...prev, cargos: updated };
        });
        setEditingRoleIndex(null);
        setTempRoleName('');
    };

    const cancelEditRole = () => {
        setEditingRoleIndex(null);
        setTempRoleName('');
    };

    // --- CÁLCULO DE DADOS FILTRADOS (Sources of Truth) ---
    // Estas listas definem o que o usuário vê na tela dependendo da unidade selecionada

    // 1. Lista de Setores Filtrados
    const filteredSectors = (() => {
        // Se NENHUMA unidade estiver selecionada, mostra todos os setores da empresa
        if (!formData.selectedUnitId) {
            return formData.setores;
        }

        // Se uma unidade ESTIVER selecionada, mostra APENAS os setores dela.
        // Se a unidade não tiver nenhum setor, a lista fica vazia [].
        const currentUnit = formData.units.find(u => String(u.id) === String(formData.selectedUnitId));

        if (!currentUnit) {
            console.warn(`[FILTER] Unidade ID ${formData.selectedUnitId} não encontrada!`);
            return [];
        }

        const sectors = (currentUnit.sectors || []);
        // Log para ajudar a entender o que está sendo exibido
        console.log(`[FILTER] Restrito à Unidade: ${currentUnit.name} -> Exibindo ${sectors.length} setores:`, sectors);
        return sectors;
    })();

    // 2. Lista de Cargos Filtrados (Hierárquico)
    const filteredCargos = (() => {
        // Se NENHUMA unidade estiver selecionada, mostra todos os cargos cadastrados
        if (!formData.selectedUnitId) return formData.cargos;

        // Se uma unidade ESTIVER selecionada, só mostra os cargos que pertencem aos setores desta unidade
        return formData.cargos.filter(cargo =>
            filteredSectors.some(fs => normalizeText(fs) === normalizeText(cargo.setor))
        );
    })();

    // Função final que envia todos os dados do formulário para salvar no sistema
    const handleSubmit = () => {
        onSave(formData);
    };

    // --- PARTE VISUAL (O QUE APARECE NA TELA) ---
    return (
        // Fundo escurecido atrás da janela (Modal)
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Janela Principal do Modal */}
            <div className="relative w-full max-w-[90rem] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex h-[85vh] animate-in fade-in zoom-in-95 duration-300">

                {/* --- Barra Lateral Esquerda (Sidebar) --- */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                    {/* Cabeçalho da Barra Lateral / Cartão da Empresa */}
                    <div className="p-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative overflow-hidden group">
                            {/* Detalhe visual (linha azul no topo) */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#35b6cf]" />

                            {/* Logo ou Iniciais da Empresa */}
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 mx-auto mb-4 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform border border-slate-100">
                                {formData.nomeFantasia ? (
                                    <span className="text-2xl font-bold text-slate-400">{formData.nomeFantasia.substring(0, 2).toUpperCase()}</span>
                                ) : (
                                    <Building size={32} />
                                )}
                            </div>

                            {/* Nome e CNPJ da Empresa */}
                            <h2 className="text-xl font-bold text-slate-800 truncate px-2">{formData.nomeFantasia || 'Nova Empresa'}</h2>
                            <p className="text-sm text-slate-500 mt-1">{formData.cnpj || 'CNPJ não informado'}</p>

                            {/* Status da Empresa (Sempre Ativo neste exemplo) */}
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Ativo
                                </span>
                            </div>
                        </div>

                        {/* SELETOR DE UNIDADE: Aparece apenas se a empresa tiver mais de uma filial e o usuário estiver nas abas de Setores, Cargos ou Funcionários */}
                        {formData.units.length > 1 && ['setores', 'cargos', 'colaboradores'].includes(activeSection) && (
                            <div className="mt-4 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-bold text-[#35b6cf] uppercase tracking-widest mb-2 block pl-2 font-mono">Unidade Ativa</label>
                                <div className="relative">
                                    <select
                                        value={String(formData.selectedUnitId || '')}
                                        onChange={handleUnitChange}
                                        className="w-full appearance-none bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 pl-4 pr-10 rounded-2xl outline-none focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 transition-all cursor-pointer shadow-sm hover:border-[#35b6cf]/50"
                                    >
                                        {/* Lista todas as unidades disponíveis para troca rápida */}
                                        {formData.units.map((unit: any) => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#35b6cf]">
                                        <ChevronRight className="rotate-90" size={18} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Menu de Navegação entre as Abas (Dados, Unidades, Setores, etc) */}
                    <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
                        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Gerenciamento</p>

                        {/* Botão: Dados Gerais */}
                        <button
                            onClick={() => setActiveSection('dados')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'dados' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'dados' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Building size={20} />
                                </div>
                                <span className="font-semibold">Dados Gerais</span>
                            </div>
                            {activeSection === 'dados' && <ChevronRight size={18} />}
                        </button>

                        {/* Botão: Unidades (Filiais) */}
                        <button
                            onClick={() => setActiveSection('unidades')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'unidades' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'unidades' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Building size={20} />
                                </div>
                                <span className="font-semibold">Unidades</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">{formData.units.length}</span>
                        </button>

                        {/* Botão: Setores (Exibe a quantidade filtrada pela unidade ativa) */}
                        <button
                            onClick={() => setActiveSection('setores')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'setores' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'setores' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <LayoutGrid size={20} />
                                </div>
                                <span className="font-semibold">Setores</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">
                                {filteredSectors.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveSection('cargos')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'cargos' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'cargos' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Briefcase size={20} />
                                </div>
                                <span className="font-semibold">Cargos</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">
                                {filteredCargos.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveSection('colaboradores')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'colaboradores' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'colaboradores' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Users size={20} />
                                </div>
                                <span className="font-semibold">Colaboradores</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">
                                {filteredCollaborators.length}
                            </span>
                        </button>
                    </nav>
                </div>



                {/* --- Right Content --- */}
                <div className="flex-1 flex flex-col bg-white w-2/3">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {activeSection === 'dados' && 'Dados da Empresa'}
                                {activeSection === 'unidades' && 'Gerenciar Unidades'}
                                {activeSection === 'setores' && 'Gerenciar Setores'}
                                {activeSection === 'cargos' && 'Gerenciar Cargos'}
                                {activeSection === 'colaboradores' && 'Gerenciar Colaboradores'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {activeSection === 'dados' && 'Visualize e edite as informações principais.'}
                                {activeSection === 'unidades' && 'Toda empresa deve ter ao menos uma unidade (Ex: Matriz).'}
                                {activeSection === 'setores' && 'Adicione, renomeie ou remova setores.'}
                                {activeSection === 'cargos' && 'Defina cargos e suas vinculações.'}
                                {activeSection === 'colaboradores' && 'Gerencie o acesso e perfil dos membros.'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Corpo do Modal (Área de Rolagem) */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                        {/* --- SEÇÃO: DADOS DA EMPRESA --- */}
                        {activeSection === 'dados' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 max-w-3xl">
                                {/* Bloco de Identidade e Foto/Logo */}
                                <div className="flex flex-col sm:flex-row gap-8 items-start">
                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">Dados Empresariais</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Nome Fantasia da Empresa */}
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">Nome Fantasia</label>
                                                    <input
                                                        type="text"
                                                        name="nomeFantasia"
                                                        value={formData.nomeFantasia}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                        placeholder="Ex: Gama Center"
                                                    />
                                                </div>
                                                {/* Razão Social (Nome Oficial) */}
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">Razão Social</label>
                                                    <input
                                                        type="text"
                                                        name="razaoSocial"
                                                        value={formData.razaoSocial}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                    />
                                                </div>
                                                {/* CNPJ da Empresa */}
                                                <div className="sm:col-span-2 space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                                                    <input
                                                        type="text"
                                                        name="cnpj"
                                                        value={formData.cnpj}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Espaço para Logo da Empresa */}
                                    <div className="w-full sm:w-auto flex flex-col items-center space-y-3 pt-6">
                                        <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300">
                                            <Camera size={40} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">Logo</span>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Bloco de Informações de Contato */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contato</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Responsável</label>
                                            <input type="text" name="responsavel" value={formData.responsavel} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none" placeholder="Nome completo" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Telefone</label>
                                            <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Bloco de Endereço */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Endereço</h3>
                                    <div className="grid grid-cols-6 gap-4">
                                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600">CEP</label><input type="text" name="cep" value={formData.cep} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-4"><label className="text-xs font-bold text-slate-600">Rua</label><input type="text" name="rua" value={formData.rua} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600">Bairro</label><input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-3"><label className="text-xs font-bold text-slate-600">Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-1"><label className="text-xs font-bold text-slate-600">UF</label><input type="text" name="uf" value={formData.uf} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                    </div>
                                </div>

                                {/* Opção para definir se a empresa é grande (Multi-unidade) */}
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isMultiUnit: !prev.isMultiUnit }))}>
                                    <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.isMultiUnit ? 'bg-[#35b6cf] border-[#35b6cf] text-white' : 'bg-white border-slate-300'}`}>
                                        {formData.isMultiUnit && <Check size={14} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Empresa com Multi-unidades</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Marque se esta empresa gerencia múltiplas filiais.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- SEÇÃO: UNIDADES (FILIAIS/FILIAIS) --- */}
                        {activeSection === 'unidades' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                                <div className="space-y-4">
                                    {/* Campo de entrada para criar uma nova filial */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newUnitName}
                                            onChange={(e) => setNewUnitName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addUnit()}
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Nome da unidade (ex: Matriz, Filial SP)..."
                                        />
                                        <button onClick={addUnit} className="bg-[#35b6cf] text-white p-3 rounded-xl hover:bg-[#2ca3bc]"><Plus size={24} /></button>
                                    </div>

                                    {/* Lista das Unidades cadastradas */}
                                    <div className="border-t border-slate-100 pt-4 space-y-3">
                                        {formData.units.map((unit, idx) => (
                                            <div key={unit.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                                {/* Modo de Edição do Nome da Unidade */}
                                                {editingUnitId === unit.id ? (
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <input
                                                            value={tempUnitName}
                                                            onChange={(e) => setTempUnitName(e.target.value)}
                                                            className="flex-1 p-2 rounded border border-[#35b6cf] outline-none"
                                                            autoFocus
                                                        />
                                                        <button onClick={saveEditUnit} className="text-emerald-500 p-2"><Check size={18} /></button>
                                                        <button onClick={() => setEditingUnitId(null)} className="text-slate-400 p-2"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    /* Modo de Visualização da Unidade */
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg border border-slate-200 text-[#35b6cf]"><Building size={20} /></div>
                                                            <div>
                                                                <span className="font-bold text-slate-700 block">{unit.name}</span>
                                                                {idx === 0 && <span className="text-[10px] uppercase font-black text-[#35b6cf] tracking-widest">Unidade Principal</span>}
                                                            </div>
                                                        </div>
                                                        {/* Botões de Ação (Aparecem ao passar o mouse) */}
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditUnit(unit)} className="p-2 text-slate-400 hover:text-[#35b6cf] transition-colors"><Pencil size={18} /></button>
                                                            <button onClick={() => removeUnit(unit.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- SEÇÃO: SETORES ORGANIZACIONAIS --- */}
                        {activeSection === 'setores' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                                {/* Campo para adicionar um novo setor (Ex: RH, Financeiro) */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSector}
                                        onChange={(e) => setNewSector(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSector()}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Nome do novo setor..."
                                    />
                                    <button onClick={addSector} className="bg-[#35b6cf] text-white p-3 rounded-xl hover:bg-[#2ca3bc]"><Plus size={24} /></button>
                                </div>

                                {/* Lista de Setores (Filtrada pela Unidade selecionada na barra lateral) */}
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    {/* Mensagem caso não existam setores na unidade atual */}
                                    {filteredSectors.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum setor cadastrado nesta unidade.</p>}
                                    {filteredSectors.map((setor, _) => {
                                        // Busca o índice original na lista mestre para permitir edição correta
                                        const globalIdx = formData.setores.findIndex(s => normalizeText(s) === normalizeText(setor));
                                        return (
                                            <div key={setor} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                                {/* Modo de Edição do Setor */}
                                                {editingSectorIndex === globalIdx ? (
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <input
                                                            value={tempSectorName}
                                                            onChange={(e) => setTempSectorName(e.target.value)}
                                                            className="flex-1 p-2 rounded border border-[#35b6cf] outline-none"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleSaveSector(globalIdx)} className="text-emerald-500 p-2"><Check size={18} /></button>
                                                        <button onClick={cancelEditSector} className="text-slate-400 p-2"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    /* Modo de Visualização do Setor */
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400"><LayoutGrid size={16} /></div>
                                                            <span className="font-semibold text-slate-700">{setor}</span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditSector(globalIdx)} className="p-2 text-slate-400 hover:text-[#35b6cf]"><Pencil size={16} /></button>
                                                            <button onClick={() => removeSector(setor)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- SEÇÃO: CARGOS E FUNÇÕES --- */}
                        {activeSection === 'cargos' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Primeiro: Escolhe o setor onde o cargo será criado */}
                                    <select value={selectedSectorForRole} onChange={(e) => setSelectedSectorForRole(e.target.value)} className="col-span-1 border border-slate-200 rounded-xl px-3 outline-none">
                                        <option value="" disabled>Selecione Setor</option>
                                        {/* Apenas setores da unidade ativa aparecem aqui */}
                                        {filteredSectors.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                    </select>
                                    {/* Segundo: Campo de nome do cargo */}
                                    <div className="col-span-2 flex gap-2">
                                        <input
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            placeholder="Nome do cargo"
                                            disabled={!selectedSectorForRole}
                                            className="flex-1 border border-slate-200 rounded-xl px-3 outline-none disabled:bg-slate-50"
                                        />
                                        <button onClick={addRole} disabled={!newRole || !selectedSectorForRole} className="bg-[#35b6cf] text-white p-3 rounded-xl hover:bg-[#2ca3bc]"><Plus size={20} /></button>
                                    </div>
                                </div>
                                {/* Lista de Cargos Filtrados */}
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    {/* Mensagem caso não existam cargos na unidade/setor atual */}
                                    {filteredCargos.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum cargo cadastrado nesta unidade.</p>}
                                    {filteredCargos.map((cargo, idx) => {
                                        // Find original index for editing if needed, or use name-based removal as we already do
                                        // Encontra o índice original para permitir edição
                                        const originalIdx = formData.cargos.findIndex(c => c === cargo);
                                        return (
                                            <div key={`${cargo.nome}-${cargo.setor}`} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                                {/* Modo de Edição do Nome do Cargo */}
                                                {editingRoleIndex === idx ? (
                                                    <div className="flex-1 flex gap-2 items-center">
                                                        <input
                                                            value={tempRoleName}
                                                            onChange={(e) => setTempRoleName(e.target.value)}
                                                            className="flex-1 p-2 rounded border border-[#35b6cf] outline-none"
                                                            autoFocus
                                                        />
                                                        <span className="text-xs text-slate-400 px-2 border-l border-slate-200">{cargo.setor}</span>
                                                        <button onClick={() => handleSaveRole(idx)} className="text-emerald-500 p-2"><Check size={18} /></button>
                                                        <button onClick={cancelEditRole} className="text-slate-400 p-2"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    /* Modo de Visualização do Cargo */
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-slate-700">{cargo.nome}</span>
                                                                <span className="text-xs text-slate-400 flex items-center gap-1"><LayoutGrid size={10} /> {cargo.setor}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditRole(originalIdx)} className="p-2 text-slate-400 hover:text-[#35b6cf]"><Pencil size={16} /></button>
                                                            <button onClick={() => removeRole(cargo)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- SEÇÃO: COLABORADORES (MEMBROS DA EQUIPE) --- */}
                        {activeSection === 'colaboradores' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">

                                {/* Botão Expansível para Adicionar Novo Colaborador */}
                                <div className=" bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                    <button
                                        onClick={() => setIsAddingCollaborator(!isAddingCollaborator)}
                                        className="w-full flex items-center justify-between p-6 hover:bg-slate-100 transition-colors text-left"
                                    >
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <div className="p-1 rounded bg-[#35b6cf]/10 text-[#35b6cf]">
                                                <Plus size={18} />
                                            </div>
                                            Novo Colaborador
                                        </h3>
                                        <ChevronRight
                                            size={20}
                                            className={`text-slate-400 transition-transform duration-300 ${isAddingCollaborator ? 'rotate-90' : ''}`}
                                        />
                                    </button>

                                    {/* Formulário de Cadastro do Colaborador (Aparece ao clicar em 'Novo Colaborador') */}
                                    {isAddingCollaborator && (
                                        <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Campos básicos: Nome e Email */}
                                                <input
                                                    type="text"
                                                    name="nome"
                                                    value={collaboratorForm.nome}
                                                    onChange={handleCollaboratorChange}
                                                    placeholder="Nome completo"
                                                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none"
                                                />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={collaboratorForm.email}
                                                    onChange={handleCollaboratorChange}
                                                    placeholder="Email corporativo"
                                                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none"
                                                />
                                                {/* Detalhes: Nascimento e Sexo */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="date"
                                                        name="dataNascimento"
                                                        value={collaboratorForm.dataNascimento}
                                                        onChange={handleCollaboratorChange}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none text-slate-600"
                                                    />
                                                    <select
                                                        name="sexo"
                                                        value={collaboratorForm.sexo}
                                                        onChange={handleCollaboratorChange}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                                    >
                                                        <option value="" disabled>Sexo</option>
                                                        <option value="Masculino">Masculino</option>
                                                        <option value="Feminino">Feminino</option>
                                                        <option value="Outro">Outro</option>
                                                    </select>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="telefone"
                                                    value={collaboratorForm.telefone}
                                                    onChange={handleCollaboratorChange}
                                                    placeholder="Telefone / WhatsApp"
                                                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none"
                                                />
                                                {/* Seleção Hierárquica: Setor e depois Cargo (apenas cargos do setor aparecem) */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        name="setor"
                                                        value={collaboratorForm.setor}
                                                        onChange={handleCollaboratorChange}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                                    >
                                                        <option value="" disabled>Setor</option>
                                                        {filteredSectors.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                                    </select>
                                                    <select
                                                        name="cargo"
                                                        value={collaboratorForm.cargo}
                                                        onChange={handleCollaboratorChange}
                                                        disabled={!collaboratorForm.setor}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600 disabled:bg-slate-100 disabled:opacity-70"
                                                    >
                                                        <option value="" disabled>Cargo</option>
                                                        {formData.cargos
                                                            .filter(c => normalizeText(c.setor) === normalizeText(collaboratorForm.setor))
                                                            .map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Botão para Confirmar Cadastro Temporário */}
                                            <div className="flex justify-end mt-4">
                                                <Button
                                                    onClick={addCollaborator}
                                                    disabled={!collaboratorForm.nome || !collaboratorForm.email || !collaboratorForm.cargo}
                                                    className="bg-[#35b6cf] text-white px-6 py-2 rounded-xl hover:bg-[#2ca3bc] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Adicionar Colaborador
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Lista/Tabela de Colaboradores já cadastrados */}
                                <div>
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Colaboradores Cadastrados ({filteredCollaborators.length})
                                        </h3>
                                        {/* Barra de busca rápida na tabela */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={collabSearch}
                                                    onChange={(e) => setCollabSearch(e.target.value)}
                                                    placeholder="Buscar nome, cargo..."
                                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#35b6cf]"
                                                />
                                            </div>
                                            {/* Menu de Filtros Avançados */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                                    className={`p-2 rounded-lg border transition-colors ${isFilterMenuOpen || Object.keys(selectedFilters).some(k => selectedFilters[k].length > 0) ? 'bg-[#35b6cf] border-[#35b6cf] text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    <Filter size={20} />
                                                </button>

                                                {/* Popup do Menu de Filtros */}
                                                {isFilterMenuOpen && (
                                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                            {/* Filtro por Sexo */}
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Sexo</div>
                                                                <div className="space-y-1">
                                                                    {getUniqueValues('sexo').map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleFilterSelect('sexo', opt)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedFilters['sexo']?.includes(opt) ? 'bg-[#35b6cf]/10 text-[#35b6cf] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters['sexo']?.includes(opt) ? 'bg-[#35b6cf] border-[#35b6cf]' : 'border-slate-300'}`}>
                                                                                {selectedFilters['sexo']?.includes(opt) && <Check size={12} className="text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* Filtro por Cargo */}
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Cargo</div>
                                                                <div className="space-y-1">
                                                                    {getUniqueValues('cargo').map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleFilterSelect('cargo', opt)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedFilters['cargo']?.includes(opt) ? 'bg-[#35b6cf]/10 text-[#35b6cf] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters['cargo']?.includes(opt) ? 'bg-[#35b6cf] border-[#35b6cf]' : 'border-slate-300'}`}>
                                                                                {selectedFilters['cargo']?.includes(opt) && <Check size={12} className="text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* Filtro por Setor */}
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Setor</div>
                                                                <div className="space-y-1">
                                                                    {getUniqueValues('setor').map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleFilterSelect('setor', opt)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedFilters['setor']?.includes(opt) ? 'bg-[#35b6cf]/10 text-[#35b6cf] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters['setor']?.includes(opt) ? 'bg-[#35b6cf] border-[#35b6cf]' : 'border-slate-300'}`}>
                                                                                {selectedFilters['setor']?.includes(opt) && <Check size={12} className="text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Botão de Limpar Filtros */}
                                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                                            <button
                                                                onClick={() => setSelectedFilters({})}
                                                                className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                Limpar Filtros
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabela de Colaboradores */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold relative z-10">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-xl">Nome</th>
                                                    <th className="px-4 py-3">Nascimento</th>
                                                    <th className="px-4 py-3">Sexo</th>
                                                    <th className="px-4 py-3">Cargo</th>
                                                    <th className="px-4 py-3">Setor</th>
                                                    <th className="px-4 py-3 rounded-tr-xl text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredCollaborators.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                                            Nenhum colaborador encontrado nesta unidade.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCollaborators.map((colab, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="px-4 py-3 text-slate-800 font-medium flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-bold">
                                                                    {colab.nome.charAt(0).toUpperCase()}
                                                                </div>
                                                                {colab.nome}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500">{colab.dataNascimento ? new Date(colab.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{colab.sexo || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                                                    {colab.cargo}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500 text-xs">{colab.setor}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="relative inline-block text-left">
                                                                    <button
                                                                        onClick={() => setActionMenuOpenIndex(actionMenuOpenIndex === idx ? null : idx)}
                                                                        className="p-1.5 text-slate-400 hover:text-[#35b6cf] hover:bg-slate-100 rounded-lg transition-colors"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>

                                                                    {/* Menu de Ações (Editar/Excluir) */}
                                                                    {actionMenuOpenIndex === idx && (
                                                                        <>
                                                                            {/* Camada Invisível para fechar menu ao clicar fora */}
                                                                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpenIndex(null)}></div>
                                                                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                                                <button
                                                                                    onClick={() => openEditModal(colab, formData.colaboradores.indexOf(colab))}
                                                                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#35b6cf] flex items-center gap-2"
                                                                                >
                                                                                    <Pencil size={14} /> Editar
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setDeleteConfirmationIndex(formData.colaboradores.indexOf(colab));
                                                                                        setActionMenuOpenIndex(null);
                                                                                    }}
                                                                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-500 flex items-center gap-2"
                                                                                >
                                                                                    <Trash2 size={14} /> Excluir
                                                                                </button>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* --- RODAPÉ DO MODAL (Ações Finais de Salvar/Cancelar) --- */}
                    <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 z-10">
                        {/* Botão de Cancelar - Fecha tudo sem salvar */}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                            Cancelar
                        </Button>
                        {/* Botão de Salvar Alterações - Envia tudo para o banco de dados */}
                        <Button
                            onClick={handleSubmit}
                            variant="primary"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 flex items-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    <span>Salvar Alterações</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmationIndex !== null && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmationIndex(null)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4 mx-auto">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Excluir Colaborador?</h3>
                            <p className="text-sm text-slate-500 text-center mb-6">
                                Tem certeza que deseja remover este colaborador? Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmationIndex(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteCollaborator}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Collaborator Modal */}
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Pencil size={18} className="text-[#35b6cf]" />
                                    Editar Colaborador
                                </h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                                        <input
                                            type="text"
                                            name="nome"
                                            value={editCollaboratorForm.nome}
                                            onChange={handleEditCollaboratorChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={editCollaboratorForm.email}
                                            onChange={handleEditCollaboratorChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Nascimento</label>
                                            <input
                                                type="date"
                                                name="dataNascimento"
                                                value={editCollaboratorForm.dataNascimento}
                                                onChange={handleEditCollaboratorChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none text-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Sexo</label>
                                            <select
                                                name="sexo"
                                                value={editCollaboratorForm.sexo}
                                                onChange={handleEditCollaboratorChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                            >
                                                <option value="" disabled>Selecione</option>
                                                <option value="Masculino">Masculino</option>
                                                <option value="Feminino">Feminino</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                        <input
                                            type="tel"
                                            name="telefone"
                                            value={editCollaboratorForm.telefone}
                                            onChange={handleEditCollaboratorChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Setor</label>
                                            <select
                                                name="setor"
                                                value={editCollaboratorForm.setor}
                                                onChange={handleEditCollaboratorChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                            >
                                                <option value="" disabled>Selecione</option>
                                                {formData.setores.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                                            <select
                                                name="cargo"
                                                value={editCollaboratorForm.cargo}
                                                onChange={handleEditCollaboratorChange}
                                                disabled={!editCollaboratorForm.setor}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600 disabled:bg-slate-100"
                                            >
                                                <option value="" disabled>Selecione</option>
                                                {formData.cargos
                                                    .filter(c => normalizeText(c.setor) === normalizeText(editCollaboratorForm.setor))
                                                    .map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                                <Button onClick={saveEditCollaborator} className="bg-[#35b6cf] text-white hover:bg-[#2ca3bc]">Salvar Alterações</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};


