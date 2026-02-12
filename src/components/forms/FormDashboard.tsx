import React, { useState, useEffect } from 'react';
import { Building, Search, Filter, Trash2, Users, FileText, ChevronRight, Edit, X, LayoutGrid, List, LayoutTemplate, Settings, FilePlus, Copy, ExternalLink, Check, HelpCircle, Plus } from 'lucide-react';
import { CompanyRegistrationModal } from './CompanyRegistrationModal';
import { CollaboratorManagerModal } from './CollaboratorManagerModal';
import { FormsListModal } from '../modals/FormsListModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

// --- Form Dashboard: Main component for managing forms and companies ---
interface FormDashboardProps {
    onCreateForm: (initialData?: any) => void;
    // We'll keep these for now but they might need renaming or logic change later
    onEditForm: (company: any) => void;
    onAnalyzeForm: (company: any) => void;
}

// Mock Questions Data (Keeping for now as requested by previous implementation step)
const MOCK_QUESTIONS = [
    { id: 1, text: 'Como você avalia o clima organizacional?', dimension: 'Clima Organizacional' },
    { id: 2, text: 'Você se sente valorizado pelo seu gestor?', dimension: 'Liderança' },
    { id: 3, text: 'As ferramentas de trabalho são adequadas?', dimension: 'Infraestrutura' },
    { id: 4, text: 'Existe equilíbrio entre vida pessoal e profissional?', dimension: 'Bem-estar' },
    { id: 5, text: 'A comunicação interna é eficiente?', dimension: 'Comunicação' },
    { id: 6, text: 'Você recomendaria a empresa para um amigo?', dimension: 'Engajamento' },
    { id: 7, text: 'Os objetivos da empresa são claros para você?', dimension: 'Alinhamento' },
    { id: 8, text: 'Você recebe feedbacks frequentes?', dimension: 'Desenvolvimento' },
    { id: 9, text: 'O ambiente é seguro psicologicamente?', dimension: 'Saúde Mental' },
    { id: 10, text: 'Houve treinamentos recentes na sua área?', dimension: 'Desenvolvimento' },
];


// --- SUB-COMPONENTS FOR MODAL REFRACTOR ---

// --- REFACTORED: CompanySummary and EmployeeManagement removed as they are replaced by CompanyRegistrationModal ---

export const FormDashboard: React.FC<FormDashboardProps> = ({ onCreateForm, onEditForm, onAnalyzeForm }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [companies, setCompanies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection Modal State
    const [selectingFor, setSelectingFor] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);




    // Info Modal State
    const [infoModalCompany, setInfoModalCompany] = useState<any>(null);

    // Collaborator Management Modal
    const [showCollaboratorManager, setShowCollaboratorManager] = useState(false);
    const [managingCompany, setManagingCompany] = useState<any>(null);

    // Forms List Modal
    const [showFormsListModal, setShowFormsListModal] = useState(false);
    const [selectedCompanyForForms, setSelectedCompanyForForms] = useState<any>(null);

    // Summary Modal State
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [expandedView, setExpandedView] = useState<'none' | 'collaborators' | 'questions' | 'description'>('none');
    const [questionSearch, setQuestionSearch] = useState('');
    const [questionFilter, setQuestionFilter] = useState('');
    const [collaboratorSearch, setCollaboratorSearch] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [selectedCollaborators, setSelectedCollaborators] = useState<Set<number>>(new Set());
    const [loadingDetailsFor, setLoadingDetailsFor] = useState<string | number | null>(null);

    const generateSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') + '-' + Date.now();
    };

    useEffect(() => {
        if (user) {
            fetchCompanies();
        }
    }, [user]);

    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            // OPTIMIZED: Use SQL View for direct counters
            const { data: clientsData, error: clientsError } = await supabase
                .from('vw_empresas_dashboard')
                .select('*')
                .eq('empresa_responsavel', user?.id)
                .order('nome_fantasia');

            if (clientsError) throw clientsError;

            if (!clientsData || clientsData.length === 0) {
                setCompanies([]);
                setIsLoading(false);
                return;
            }

            // Simple mapping - no nested logic needed
            const liteCompanies = clientsData.map(client => ({
                id: client.id,
                cliente_uuid: client.cliente_uuid,
                name: client.nome_fantasia || client.razao_social || 'Sem Nome',
                cnpj: client.cnpj,
                total_collaborators: client.total_colaboradores || 0,
                // View returns pre-calculated count. We keep units empty initially.
                units: [],
                roles: [],
                cargos: [],
                collaborators: [],
                setores: [],
                detailsLoaded: false,
                // Helper for UI display
                total_units: client.total_unidades || 0
            }));

            console.log(`[VIEW LOAD] Loaded ${liteCompanies.length} companies from View.`);
            setCompanies(liteCompanies);
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompanyDetails = async (company: any) => {
        if (company.detailsLoaded) return company;

        console.log(`[LAZY LOAD] Fetching details for ${company.name}...`);
        setLoadingDetailsFor(company.id);

        try {
            // Re-fetch clean list of units for this company
            const { data: clientFull, error: cErr } = await supabase
                .from('clientes')
                .select('*')
                .eq('id', company.id)
                .single();

            if (cErr) throw cErr;

            const { data: unitsData, error: uErr } = await supabase
                .from('unidades')
                .select('*')
                .eq('empresa_mae', company.cliente_uuid);

            if (uErr) throw uErr;

            const unitIds = (unitsData || []).map(u => u.id);

            // Fetch Full Collaborators with Joins
            const { data: colaboradoresData, error: colabError } = await supabase
                .from('colaboradores')
                .select(`
                    *,
                    cargo:cargos(id, nome),
                    setor:setor(id, nome)
                `)
                .in('unidade_id', unitIds);

            if (colabError) throw colabError;

            // Fetch Metadata (Roles & Sectors)
            const unitRoleIds = (unitsData || []).flatMap(u => u.cargos || []);
            const unitSectorIds = (unitsData || []).flatMap(u => u.setores || []);

            // Fetch Roles
            let allRolesRaw: any[] = [];
            if (unitRoleIds.length > 0) {
                const { data: rData } = await supabase
                    .from('cargos')
                    .select('id, nome, setor_id')
                    .in('id', unitRoleIds);
                allRolesRaw = rData || [];
            }

            // Consolidate Sector IDs
            const roleSectorIds = allRolesRaw.map(r => r.setor_id).filter(Boolean);
            const allSectorIds = Array.from(new Set([...unitSectorIds, ...roleSectorIds])) as number[];

            // Fetch Sectors
            let allSectorsRaw: any[] = [];
            if (allSectorIds.length > 0) {
                const { data: sData } = await supabase
                    .from('setor')
                    .select('id, nome')
                    .in('id', allSectorIds);
                allSectorsRaw = sData || [];
            }

            // Maps
            const sectorMap = new Map(allSectorsRaw.map(s => [s.id, s.nome]));

            // Reconstruct Units with Details
            const mappedUnits = (unitsData || []).map(u => {
                const explicitSectorIds = u.setores || [];
                const unitRolesIds = u.cargos || [];

                const associatedRoles = allRolesRaw.filter(r => unitRolesIds.includes(r.id));
                const roleSectorIdsFromUnit = associatedRoles.map(r => r.setor_id).filter(Boolean);

                const allUnitSectorIds = Array.from(new Set([...explicitSectorIds, ...roleSectorIdsFromUnit])) as number[];
                const uSectorObjs = allUnitSectorIds.map(id => ({
                    id,
                    name: sectorMap.get(id) || 'Desconhecido'
                })).filter(s => s.name !== 'Desconhecido');

                return {
                    id: u.id,
                    name: u.nome_unidade || u.nome,
                    sectors: uSectorObjs, // Now objects {id, name}
                    sectorIds: allUnitSectorIds,
                    roles: associatedRoles.map(r => ({
                        ...r,
                        setor_name: sectorMap.get(r.setor_id) || 'Geral'
                    }))
                };
            });

            // Process Collaborators
            const uiCollaborators = (colaboradoresData || []).map((c: any) => ({
                ...c,
                cargo: c.cargo?.nome || '',
                setor: c.setor?.nome || '',
                cargo_id: c.cargo?.id,
                setor_id: c.setor?.id
            }));

            // Process Roles & Sectors List
            const allCompanySectorNames = new Set<string>();
            mappedUnits.forEach(u => u.sectors.forEach((s: any) => {
                if (s.name) allCompanySectorNames.add(s.name);
            }));

            const allCompanyRoles = mappedUnits.flatMap(u => u.roles).map(r => ({
                nome: r.nome,
                setor: r.setor_name
            }));
            const uniqueRoleNames = Array.from(new Set(allCompanyRoles.map(r => r.nome)));

            // Merge with new client record
            const updatedCompany = {
                ...company,
                ...clientFull,
                name: clientFull.nome_fantasia || clientFull.razao_social,
                units: mappedUnits,
                setores: Array.from(allCompanySectorNames),
                roles: uniqueRoleNames,
                cargos: allCompanyRoles,
                collaborators: uiCollaborators,
                detailsLoaded: true
            };

            // Update local state so it stays loaded
            setCompanies(prev => prev.map(c => c.id === company.id ? updatedCompany : c));

            return updatedCompany;

        } catch (err) {
            console.error("Error lazy loading details:", err);
            return company; // Return original if fail
        } finally {
            setLoadingDetailsFor(null);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    );



    const handleGerarFormulario = async (company: any) => {
        setSelectedCompanyForForms(company);
        setShowFormsListModal(true);
    };

    const handleCreateNewForm = async () => {
        if (selectedCompanyForForms) {
            setShowFormsListModal(false);

            // LAZY LOAD
            const fullCompany = await fetchCompanyDetails(selectedCompanyForForms);

            // Reset selection state
            setSelectingFor(fullCompany);
            setSelectedUnit(null);
            // If company has only 1 unit, auto-expand it
            if (fullCompany.units.length === 1) {
                setSelectedUnit(fullCompany.units[0]);
            }
        }
    };

    const handleFinishSelection = (company: any, unit: any, sector: string, sectorId: number | null) => {
        // Instead of directly creating, show the summary modal
        setSummaryData({
            company: company,
            unit: unit,
            sector: sector,
            sectorId: sectorId,
            kpiCollaborators: unit.collaborators, // Logic: Use unit collaborators count
            kpiQuestions: 15, // Mock
            formTitle: 'Pesquisa de Clima Organizacional 2024',
            formDesc: 'Avaliação completa de engajamento e satisfação dos colaboradores.',
            publicLink: '' // Will be generated on confirm
        });
        setSelectingFor(null);
        setSummaryModalOpen(true);
        setExpandedView('none'); // Reset expansion
        setIsEditingTitle(false);

        // Default all collaborators to selected
        const allIndices = new Set<number>();
        (company.collaborators || []).forEach((_: any, idx: number) => allIndices.add(idx));
        setSelectedCollaborators(allIndices);
    };

    // Filtered Questions Logic
    const filteredQuestions = MOCK_QUESTIONS.filter(q =>
        q.text.toLowerCase().includes(questionSearch.toLowerCase()) &&
        (questionFilter ? q.dimension === questionFilter : true)
    );

    const questionsDimensions = Array.from(new Set(MOCK_QUESTIONS.map(q => q.dimension)));

    const confirmCreateForm = () => {
        if (!summaryData) return;

        const slug = generateSlug(summaryData.formTitle);
        const publicLink = `${window.location.origin}/form/${slug}`;

        // Update summary data with REAL link to show in success modal
        setSummaryData((prev: any) => ({ ...prev, publicLink }));

        // Collect UUIDs of selected collaborators
        const collaborators = summaryData.company.collaborators || [];
        const selectedUuids = collaborators
            .filter((_: any, idx: number) => selectedCollaborators.has(idx))
            .map((c: any) => c.id)
            .filter(Boolean);

        // Pass data to parent to handle creation (bypassing the wizard)
        onCreateForm({
            company_id: summaryData.company.id,
            company_name: summaryData.company.name,
            unit_id: summaryData.unit.id,
            unit_name: summaryData.unit.name,
            sector: summaryData.sector,
            sector_id: summaryData.sectorId,
            selected_collaborators_count: selectedCollaborators.size,
            colaboladores_inclusos: selectedUuids,
            link: publicLink,
            title: summaryData.formTitle,
            description: summaryData.formDesc,
            slug: slug
        });
        setSummaryModalOpen(false);
        setSuccessModalOpen(true);
    };


    const toggleCollaborator = (idx: number) => {
        const newSelected = new Set(selectedCollaborators);
        if (newSelected.has(idx)) {
            newSelected.delete(idx);
        } else {
            newSelected.add(idx);
        }
        setSelectedCollaborators(newSelected);
    };

    const toggleAllCollaborators = (force?: boolean) => {
        if (force === false || (force === undefined && selectedCollaborators.size === summaryData.company.roles.length)) {
            setSelectedCollaborators(new Set());
        } else {
            const allIndices = new Set<number>();
            summaryData.company.roles.forEach((_: any, idx: number) => allIndices.add(idx));
            setSelectedCollaborators(allIndices);
        }
    };

    const openInfoModal = async (e: React.MouseEvent, company: any) => {
        e.stopPropagation(); // Prevent card navigation
        const fullCompany = await fetchCompanyDetails(company);
        setInfoModalCompany(fullCompany);
    };



    const normalizeText = (text: string) => text.trim().toLowerCase();

    const handleUpdateCompany = async (formData: any) => {
        setIsLoading(true);
        try {
            console.log('Saving company with data:', formData);
            const isNew = infoModalCompany?.isNew;
            let companyId = formData.id || infoModalCompany?.id;
            let parentCompanyUuid = infoModalCompany?.cliente_uuid || formData.cliente_uuid;

            if (isNew) {
                // Generate a new UUID for the company
                parentCompanyUuid = crypto.randomUUID();

                const { data: newCompany, error: createError } = await supabase
                    .from('clientes')
                    .insert({
                        cliente_uuid: parentCompanyUuid,
                        empresa_responsavel: user?.id,
                        nome_fantasia: formData.nomeFantasia,
                        razao_social: formData.razaoSocial,
                        cnpj: formData.cnpj,
                        email: formData.email,
                        telefone: formData.telefone,
                        responsavel: formData.responsavel,
                        endereco: {
                            cep: formData.cep,
                            rua: formData.rua,
                            bairro: formData.bairro,
                            cidade: formData.cidade,
                            uf: formData.uf
                        }
                    })
                    .select('id')
                    .single();

                if (createError) throw createError;
                companyId = newCompany.id;
            } else {
                if (!companyId) {
                    console.error('Company ID missing for update');
                    return;
                }

                // 1. Update Basic Info
                const { error: companyError } = await supabase
                    .from('clientes')
                    .update({
                        nome_fantasia: formData.nomeFantasia,
                        razao_social: formData.razaoSocial,
                        cnpj: formData.cnpj,
                        email: formData.email,
                        telefone: formData.telefone,
                        responsavel: formData.responsavel,
                        // Fix: Supabase JS client automatically handles JSON objects for jsonb columns
                        endereco: {
                            cep: formData.cep,
                            rua: formData.rua,
                            bairro: formData.bairro,
                            cidade: formData.cidade,
                            uf: formData.uf
                        }
                    })
                    .eq('id', companyId);

                if (companyError) throw companyError;
            }

            // 2. Sync Sectors
            const sectorIds: number[] = [];
            const sectorNameMap: Record<string, number> = {};

            if (formData.setores && formData.setores.length > 0) {
                for (const sectorName of formData.setores) {
                    // Try to find existing first
                    const { data: existingSector } = await supabase
                        .from('setor')
                        .select('id')
                        .eq('nome', sectorName)
                        .maybeSingle(); // Fix: Use maybeSingle to avoid 406

                    if (existingSector) {
                        sectorIds.push(existingSector.id);
                        sectorNameMap[sectorName] = existingSector.id;
                    } else {
                        // Create new
                        const { data: newSector, error: sectorError } = await supabase
                            .from('setor')
                            .insert({ nome: sectorName })
                            .select()
                            .single();

                        if (sectorError) {
                            console.error(`Error creating sector ${sectorName}:`, sectorError);
                        } else if (newSector) {
                            sectorIds.push(newSector.id);
                            sectorNameMap[sectorName] = newSector.id;
                        }
                    }
                }

                // Update company sectors
                if (sectorIds.length > 0) {
                    await supabase
                        .from('clientes')
                        .update({ setores: sectorIds })
                        .eq('id', companyId);
                }
                console.log(`[SAVE] Synced ${sectorIds.length} sectors for company.`);
            }

            // 3. Sync Roles
            const roleIds: number[] = [];
            const roleNameMap: Record<string, number> = {};

            // First, get currently linked roles to potentially merge or replace
            if (formData.cargos && formData.cargos.length > 0) {

                for (const role of formData.cargos) {
                    const sectorId = sectorNameMap[role.setor];
                    if (!sectorId) continue; // Skip if sector not resolved

                    // Try check if role exists in that sector
                    const { data: existingRole } = await supabase
                        .from('cargos')
                        .select('id')
                        .eq('nome', role.nome)
                        .eq('setor_id', sectorId)
                        .maybeSingle(); // Fix: Use maybeSingle

                    if (existingRole) {
                        roleIds.push(existingRole.id);
                        roleNameMap[`${role.setor}_${role.nome}`] = existingRole.id;
                    } else {
                        // Create
                        const { data: newRole, error: roleError } = await supabase
                            .from('cargos')
                            .insert({ nome: role.nome, setor_id: sectorId })
                            .select()
                            .single();

                        if (roleError) {
                            console.error('Error creating role:', roleError);
                        } else if (newRole) {
                            roleIds.push(newRole.id);
                            roleNameMap[`${role.setor}_${role.nome}`] = newRole.id;
                        }
                    }
                }
            }
            console.log(`[SAVE] Resolved/Synced ${roleIds.length} roles.`);

            // REMOVED: Updating clientes.cargos (User requested focus on Unidades table)
            // This was causing the 400 Bad Request if the column didn't exist or type mismatch on clientes
            /*
            if (roleIds.length > 0) {
                 await supabase
                    .from('clientes')
                    .update({ cargos: roleIds })
                    .eq('id', companyId);
            }
            */

            // 4. Update Units
            const currentUnits = formData.units || [];
            const unitIdMap: Record<string | number, string | number> = {};
            console.log(`[SAVE] Updating ${currentUnits.length} Units. Roles calculated: ${roleIds.length}`);

            for (const unit of currentUnits) {
                // Fix: Threshold was too high (2T). Date.now() is ~1.73T. Lowered to 1T.
                const isTempId = typeof unit.id === 'string' || unit.id > 1000000000000;
                const parentCompanyUuid = infoModalCompany?.cliente_uuid || formData.cliente_uuid;

                if (!parentCompanyUuid && isTempId) {
                    console.error('[ERROR] Missing Parent Company UUID for new unit:', unit.name);
                    alert(`Erro: Empresa mãe não identificada para unidade ${unit.name}`);
                    continue;
                }

                // CRITICAL FIX: Resolve IDs strictly for this unit's sectors and roles
                const unitSectorIds = (unit.sectors || [])
                    .map((s: string) => sectorNameMap[s])
                    .filter(Boolean);

                const unitRoleIds = (formData.cargos || [])
                    .filter((cargo: any) => unit.sectors.some((us: string) => normalizeText(us) === normalizeText(cargo.setor)))
                    .map((cargo: any) => roleNameMap[`${cargo.setor}_${cargo.nome}`])
                    .filter(Boolean);

                const unitPayload = {
                    nome: unit.name,
                    empresa_mae: parentCompanyUuid,
                    setores: unitSectorIds, // Array of sector IDs
                    cargos: unitRoleIds     // Array of role IDs
                };

                // Detailed log for unit persistence verification
                console.log(`[SAVE UNIT] Payload for "${unit.name}" (Temp? ${isTempId}):`, unitPayload);

                let dbUnitId = unit.id;

                if (isTempId) {
                    const { data: newUnit, error: insertError } = await supabase
                        .from('unidades')
                        .insert(unitPayload)
                        .select('id')
                        .single();

                    if (insertError) {
                        console.error(`[ERROR] Inserting unit ${unit.name}:`, insertError);
                        alert(`Erro ao criar unidade ${unit.name}: ${insertError.message}`);
                    } else if (newUnit) {
                        console.log(`[SUCCESS] Inserted unit: ${unit.name} with ID: ${newUnit.id}`);
                        dbUnitId = newUnit.id;
                    }
                } else {
                    const { error: updateError } = await supabase.from('unidades').update(unitPayload).eq('id', unit.id);
                    if (updateError) {
                        console.error(`[ERROR] Updating unit ${unit.name}:`, updateError);
                        alert(`Erro ao atualizar unidade ${unit.name}: ${updateError.message}`);
                    } else {
                        console.log(`[SUCCESS] Updated unit: ${unit.name}`);
                    }
                }

                // Keep track of mapping for collaborators if needed
                unitIdMap[unit.id] = dbUnitId;
            }
            console.log('[SAVE] Unit update sequence finished.');

            // 5. Sync Collaborators
            const collaborators = formData.colaboradores || [];
            console.log(`[SAVE] Syncing ${collaborators.length} collaborators...`);

            for (const colab of collaborators) {
                // Resolve IDs
                const mappedUnitId = unitIdMap[colab.unidade_id] || colab.unidade_id;
                const sectorId = sectorNameMap[colab.setor];
                const cargoId = roleNameMap[`${colab.setor}_${colab.nome_cargo || colab.cargo}`]; // Support both names

                const colabPayload = {
                    nome: colab.nome,
                    email: colab.email,
                    telefone: colab.telefone,
                    sexo: colab.sexo,
                    data_nascimento: colab.dataNascimento || null, // Ensure null if empty
                    unidade_id: mappedUnitId,
                    setor_id: sectorId,
                    cargo_id: cargoId,
                    cpf: colab.cpf || null,
                    data_desligamento: colab.dataDesligamento || null,
                    cod_categoria: 101,
                    texto_categoria: "Empregado - Geral, inclusive o empregado público da administração direta ou indireta contratado pela CLT"
                };

                // Remove undefined or problematic values to avoid DB issues
                Object.keys(colabPayload).forEach(key => {
                    const val = (colabPayload as any)[key];
                    if (val === undefined || (typeof val === 'string' && val.trim() === '' && key !== 'nome')) {
                        delete (colabPayload as any)[key];
                    }
                });

                // FIX: Enhanced Heuristic with Logging
                const strId = String(colab.id || '');
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strId);
                const isSmallInt = strId.match(/^\d+$/) && Number(strId) < 1000000000000;

                // It is a real ID if it's a UUID or a legacy small integer
                const isRealId = isUuid || isSmallInt;
                const isTempColab = !colab.id || !isRealId;

                console.log(`[SAVE] Checking Colab: "${colab.nome}" ID: "${colab.id}" -> isTemp? ${isTempColab} (UUID: ${isUuid}, SmallInt: ${isSmallInt})`);

                if (isTempColab) {
                    const { error: colabErr } = await supabase.from('colaboradores').insert(colabPayload);
                    if (colabErr) console.error(`[ERROR] Inserting collaborator ${colab.nome}:`, colabErr);
                } else {
                    const { error: colabErr } = await supabase.from('colaboradores').update(colabPayload).eq('id', colab.id);
                    if (colabErr) console.error(`[ERROR] Updating collaborator ${colab.nome}:`, colabErr);
                }
            }

            await fetchCompanies();
            setInfoModalCompany(null);
            alert('Dados atualizados com sucesso!');

        } catch (error) {
            console.error('Error updating company:', error);
            alert('Erro ao atualizar dados. Verifique o console.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Empresas Monitoradas</h2>
                    <p className="text-slate-500 mt-1">Gerencie formulários e levantamentos</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex-1 md:w-[480px] h-11">
                        <div className="relative flex-1 md:w-[480px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar empresa ou CNPJ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                        <div className="flex items-center gap-1">
                            <button className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-slate-50 rounded-lg transition-all" title="Filtros">
                                <Filter size={18} />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-[#35b6cf]' : 'text-slate-400 hover:text-[#35b6cf]'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-[#35b6cf]' : 'text-slate-400 hover:text-[#35b6cf]'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setInfoModalCompany({ isNew: true })}
                        className="flex items-center justify-center gap-2 px-6 bg-[#35b6cf] text-white rounded-xl font-bold hover:bg-[#2ca3bc] transition-all shadow-lg shadow-[#35b6cf]/20 shrink-0 md:w-48 h-11"
                    >
                        <Plus size={18} />
                        <span>Nova Empresa</span>
                    </button>

                    <button
                        onClick={() => {
                            setManagingCompany(null); // Global mode
                            setShowCollaboratorManager(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 bg-white text-[#35b6cf] border border-[#35b6cf] rounded-xl font-bold hover:bg-[#35b6cf]/5 transition-all shadow-sm shrink-0 md:w-48 h-11"
                    >
                        <Users size={18} />
                        <span>Novo Colaborador</span>
                    </button>
                </div>
            </div>

            {/* Grid vs List Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-64 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                                <div className="w-20 h-6 bg-slate-100 rounded-lg"></div>
                            </div>
                            <div className="w-3/4 h-6 bg-slate-100 rounded-lg mb-4"></div>
                            <div className="space-y-3 mt-8">
                                <div className="w-full h-4 bg-slate-100 rounded"></div>
                                <div className="w-2/3 h-4 bg-slate-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCompanies.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Building size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Nenhuma empresa encontrada</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Você ainda não possui empresas monitoradas ou a busca não retornou resultados.
                    </p>
                    <button
                        onClick={() => fetchCompanies()}
                        className="px-6 py-2.5 bg-[#35b6cf] text-white rounded-xl font-bold hover:bg-[#2ca3bc] transition-all shadow-lg shadow-[#35b6cf]/20"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            onClick={async () => {
                                const full = await fetchCompanyDetails(company);
                                onAnalyzeForm(full);
                            }}
                            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#35b6cf]/10 hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer relative"
                        >

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#35b6cf]/10 text-[#35b6cf] rounded-xl group-hover:bg-[#35b6cf] group-hover:text-white transition-colors duration-300 shadow-sm">
                                        <Building size={24} />
                                    </div>
                                    <div className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100 flex items-center gap-2">
                                        {loadingDetailsFor === company.id && <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
                                        {(company.total_units !== undefined ? company.total_units : company.units?.length || 0)} {(company.total_units !== undefined ? company.total_units : company.units?.length) === 1 ? 'Unidade' : 'Unidades'}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#35b6cf] transition-colors mb-2">
                                    {company.name}
                                </h3>

                                <div className="space-y-3 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <FileText size={16} className="text-slate-300" />
                                        <span>CNPJ: <span className="font-medium text-slate-700">{company.cnpj}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Users size={16} className="text-slate-300" />
                                        <span>Colaboradores: <span className="font-medium text-slate-700">{company.total_collaborators}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-x-1 mt-auto">
                                <button
                                    onClick={(e) => openInfoModal(e, company)}
                                    className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-lg transition-all"
                                    title="Estrutura da empresa"
                                >
                                    <Settings size={18} />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleGerarFormulario(company);
                                    }}
                                    className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-lg transition-all"
                                    title="Formulários"
                                >
                                    <FileText size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setManagingCompany(company);
                                        setShowCollaboratorManager(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-lg transition-all"
                                    title="Colaboradores"
                                >
                                    <Users size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unidades</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Colaboradores</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#35b6cf]/10 text-[#35b6cf] rounded-lg">
                                                    <Building size={16} />
                                                </div>
                                                <span className="font-bold text-slate-800 group-hover:text-[#35b6cf] transition-colors">{company.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                            {company.cnpj}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center">
                                            <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                                                {(company.total_units !== undefined ? company.total_units : company.units?.length || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600 font-medium">
                                            {company.total_collaborators}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleGerarFormulario(company)}
                                                    className="px-3 py-1.5 bg-[#35b6cf]/10 text-[#35b6cf] hover:bg-[#35b6cf] hover:text-white rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Gerar Formulário
                                                </button>

                                                <button
                                                    onClick={() => onEditForm(company)}
                                                    className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setManagingCompany(company);
                                                        setShowCollaboratorManager(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors"
                                                    title="Colaboradores"
                                                >
                                                    <Users size={16} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

         

            {/* Selection Modal Overlay */}
            {selectingFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Gerar Formulário</h2>
                                <p className="text-sm text-slate-500 mt-1">{selectingFor.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectingFor(null)}
                                className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#35b6cf]/10 flex items-center justify-center text-[#35b6cf]">
                                        <Building size={16} />
                                    </div>
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Escolha a Unidade e Setor</label>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2">
                                    {selectingFor.units.map((unit: any) => {
                                        const isExpanded = selectedUnit?.id === unit.id;
                                        return (
                                            <div key={unit.id} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#35b6cf] bg-[#35b6cf]/5 shadow-md' : 'border-slate-100 hover:border-[#35b6cf]/30'}`}>
                                                <button
                                                    onClick={() => setSelectedUnit(isExpanded ? null : unit)}
                                                    className="w-full flex items-center justify-between p-4 text-left group"
                                                >
                                                    <div>
                                                        <span className={`font-bold transition-colors ${isExpanded ? 'text-[#35b6cf]' : 'text-slate-700 group-hover:text-[#35b6cf]'}`}>
                                                            {unit.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                            <Users size={12} />
                                                            {unit.collaborators} colaboradores
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={18} className={`text-slate-300 transition-all duration-300 ${isExpanded ? 'rotate-90 text-[#35b6cf]' : 'group-hover:text-[#35b6cf]'}`} />
                                                </button>

                                                {/* Expanded Content (Sectors) */}
                                                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                    <div className="overflow-hidden">
                                                        <div className="p-3 pt-0 space-y-2 border-t border-[#35b6cf]/10 mx-3 mt-1 mb-3">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2 px-1 flex items-center gap-2">
                                                                <LayoutTemplate size={12} />
                                                                Selecione o Setor
                                                            </div>

                                                            {/* General Option */}
                                                            <button
                                                                onClick={() => handleFinishSelection(selectingFor, unit, 'Geral', null)}
                                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/60 hover:bg-white border border-transparent hover:border-[#35b6cf]/30 transition-all text-left group/sector"
                                                            >
                                                                <span className="text-sm font-medium text-slate-600 group-hover/sector:text-[#35b6cf]">Geral / Todos os setores</span>
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover/sector:bg-[#35b6cf] group-hover/sector:text-white transition-all">
                                                                    <ChevronRight size={14} />
                                                                </div>
                                                            </button>

                                                            {/* Actual Sectors */}
                                                            {unit.sectors.map((sector: any) => (
                                                                <button
                                                                    key={sector.id}
                                                                    onClick={() => handleFinishSelection(selectingFor, unit, sector.name, sector.id)}
                                                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/60 hover:bg-white border border-transparent hover:border-[#35b6cf]/30 transition-all text-left group/sector"
                                                                >
                                                                    <span className="text-sm font-bold text-slate-700 group-hover/sector:text-[#35b6cf]">{sector.name}</span>
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover/sector:bg-[#35b6cf] group-hover/sector:text-white transition-all">
                                                                        <ChevronRight size={14} />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INFO MODAL */}
            {/* EDITED MODAL REPLACEMENT */}
            <CompanyRegistrationModal
                isOpen={!!infoModalCompany}
                onClose={() => setInfoModalCompany(null)}
                onSave={handleUpdateCompany}
                initialData={infoModalCompany?.isNew ? null : infoModalCompany}
                isLoading={isLoading}
            />

            {/* FORM SUMMARY MODAL */}
            {summaryModalOpen && summaryData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className={`bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 flex transition-all duration-500 ease-in-out h-[40rem] ${expandedView !== 'none' ? 'w-[75rem] max-w-full' : 'w-full max-w-lg'}`}>

                        {/* LEFT PANEL - SUMMARY */}
                        <div className={`flex flex-col border-r border-slate-100 transition-all duration-500 ${expandedView !== 'none' ? 'w-[28rem] shrink-0' : 'w-full'}`}>
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={20} className="text-[#35b6cf]" />
                                    Resumo do Formulário
                                </h3>
                                <button onClick={() => setSummaryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6 space-y-6">
                                {/* Header Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-lg">
                                        {summaryData.company.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{summaryData.company.name}</h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <Building size={14} />
                                            <span>{summaryData.unit.name}</span>
                                            {summaryData.sector && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span>{summaryData.sector}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* KPIs - Clickable */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setExpandedView(prev => prev === 'collaborators' ? 'none' : 'collaborators')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${expandedView === 'collaborators' ? 'bg-[#35b6cf]/10 border-[#35b6cf] ring-2 ring-[#35b6cf]/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Colaboradores</div>
                                        <div className="flex items-center gap-2">
                                            <Users size={20} className="text-[#35b6cf]" />
                                            <span className="text-2xl font-bold text-slate-700">{selectedCollaborators.size}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                            {selectedCollaborators.size < summaryData.company.roles.length ? 'Ajustar seleção' : 'Ver lista'} <ChevronRight size={10} />
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setExpandedView(prev => prev === 'questions' ? 'none' : 'questions')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer ${expandedView === 'questions' ? 'bg-[#35b6cf]/10 border-[#35b6cf] ring-2 ring-[#35b6cf]/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Perguntas</div>
                                        <div className="flex items-center gap-2">
                                            <List size={20} className="text-[#35b6cf]" />
                                            <span className="text-2xl font-bold text-slate-700">{summaryData.kpiQuestions}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                            Ver perguntas <ChevronRight size={10} />
                                        </div>
                                    </div>
                                </div>

                                {/* Form Details */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título do Formulário</label>
                                            <button
                                                onClick={() => setIsEditingTitle(!isEditingTitle)}
                                                className="p-1 text-[#35b6cf] hover:bg-[#35b6cf]/10 rounded-md transition-colors"
                                                title={isEditingTitle ? "Salvar Título" : "Editar Título"}
                                            >
                                                {isEditingTitle ? <Check size={14} /> : <Edit size={14} />}
                                            </button>
                                        </div>
                                        {isEditingTitle ? (
                                            <input
                                                type="text"
                                                value={summaryData.formTitle}
                                                onChange={(e) => setSummaryData({ ...summaryData, formTitle: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-[#35b6cf] rounded-lg text-sm font-bold text-slate-800 outline-none shadow-sm shadow-[#35b6cf]/10"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') setIsEditingTitle(false);
                                                }}
                                            />
                                        ) : (
                                            <p className="font-bold text-slate-800 mt-1">{summaryData.formTitle}</p>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                                            <button
                                                onClick={() => setExpandedView(prev => prev === 'description' ? 'none' : 'description')}
                                                className="text-[10px] font-bold text-[#35b6cf] hover:underline flex items-center gap-0.5"
                                            >
                                                {expandedView === 'description' ? 'Ocultar' : 'Ver mais'} <ChevronRight size={10} className={expandedView === 'description' ? 'rotate-180' : ''} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                            {summaryData.formDesc}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 pt-6 pb-16 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
                                <button
                                    onClick={() => setSummaryModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmCreateForm}
                                    className="px-6 py-2.5 rounded-xl bg-[#35b6cf] text-white font-semibold hover:bg-[#2ca3bc] shadow-lg shadow-[#35b6cf]/20 transition-all text-sm flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Confirmar e Gerar
                                </button>
                            </div>
                        </div>

                        {/* RIGHT PANEL - EXPANDED CONTENT */}
                        <div className={`flex flex-col bg-slate-50/50 transition-all duration-500 overflow-hidden ${expandedView !== 'none' ? 'flex-1 opacity-100' : 'w-0 opacity-0'}`}>
                            {expandedView === 'collaborators' && (
                                <div className="h-full flex flex-col min-w-[30rem]">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Users size={18} className="text-[#35b6cf]" />
                                                Colaboradores Selecionados
                                            </h3>
                                            <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-500">
                                                {summaryData.company.units.flatMap((u: any) => u.collaborators).length || 0} Total
                                            </span>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar colaborador por nome, cargo ou setor..."
                                                    value={collaboratorSearch}
                                                    onChange={(e) => setCollaboratorSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => toggleAllCollaborators(true)}
                                                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                                >
                                                    Marcar Todos
                                                </button>
                                                <button
                                                    onClick={() => toggleAllCollaborators(false)}
                                                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                                >
                                                    Desmarcar Todos
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Colaboradores Selecionados: <span className="text-[#35b6cf]">{selectedCollaborators.size}</span> de {summaryData.company.roles.length}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-6 overflow-auto bg-slate-50/50 h-full">
                                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                                                    <tr>
                                                        <th className="px-4 py-3 w-10">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300 text-[#35b6cf] focus:ring-[#35b6cf]"
                                                                checked={selectedCollaborators.size === summaryData.company.roles.length}
                                                                onChange={() => toggleAllCollaborators()}
                                                            />
                                                        </th>
                                                        <th className="px-4 py-3">Nome</th>
                                                        <th className="px-4 py-3">Sexo</th>
                                                        <th className="px-4 py-3">Email</th>
                                                        <th className="px-4 py-3">Cargo</th>
                                                        <th className="px-4 py-3">Setor</th>
                                                        <th className="px-4 py-3">Admissão</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {summaryData.company.roles.map((role: string, idx: number) => {
                                                        const name = `Colaborador ${idx + 1}`;
                                                        const sector = summaryData.company.units[0]?.sectors[idx % summaryData.company.units[0]?.sectors.length]?.name || 'Geral';
                                                        const email = `colaborador${idx + 1}@${summaryData.company.name.toLowerCase().replace(/\s/g, '')}.com.br`;
                                                        const sexo = idx % 2 === 0 ? 'M' : 'F';

                                                        // Filter Logic
                                                        if (collaboratorSearch &&
                                                            !name.toLowerCase().includes(collaboratorSearch.toLowerCase()) &&
                                                            !role.toLowerCase().includes(collaboratorSearch.toLowerCase()) &&
                                                            !sector.toLowerCase().includes(collaboratorSearch.toLowerCase())
                                                        ) {
                                                            return null;
                                                        }

                                                        const isSelected = selectedCollaborators.has(idx);

                                                        return (
                                                            <tr key={idx} className={`hover:bg-slate-50 transition-colors ${!isSelected ? 'opacity-60 bg-slate-50/30' : ''}`}>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-slate-300 text-[#35b6cf] focus:ring-[#35b6cf]"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleCollaborator(idx)}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-800 font-medium">{name}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sexo === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                                        {sexo}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 text-xs">{email}</td>
                                                                <td className="px-4 py-3 text-slate-500">{role}</td>
                                                                <td className="px-4 py-3 text-slate-500">
                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                                                        {sector}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 text-xs">01/0{idx % 9 + 1}/2023</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            {/* Empty State for Search */}
                                            {summaryData.company.roles.filter((role: string, idx: number) => {
                                                const name = `Colaborador ${idx + 1}`;
                                                const sector = summaryData.company.units[0]?.sectors[idx % summaryData.company.units[0]?.sectors.length] || 'Geral';
                                                return !collaboratorSearch ||
                                                    name.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                                                    role.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                                                    sector.toLowerCase().includes(collaboratorSearch.toLowerCase());
                                            }).length === 0 && (
                                                    <div className="p-8 text-center text-slate-400 text-sm">
                                                        Nenhum colaborador encontrado.
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {expandedView === 'questions' && (
                                <div className="h-full flex flex-col min-w-[30rem]">
                                    <div className="px-6 py-4 border-b border-slate-100 bg-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <HelpCircle size={18} className="text-[#35b6cf]" />
                                                Perguntas do Formulário
                                            </h3>
                                            <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-500">
                                                {filteredQuestions.length}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar pergunta..."
                                                    value={questionSearch}
                                                    onChange={(e) => setQuestionSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                />
                                            </div>
                                            <select
                                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] text-slate-600"
                                                value={questionFilter}
                                                onChange={(e) => setQuestionFilter(e.target.value)}
                                            >
                                                <option value="">Todas Dimensões</option>
                                                {questionsDimensions.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="p-6 overflow-auto bg-slate-50/50 h-full">
                                        <div className="space-y-3">
                                            {filteredQuestions.map((q) => (
                                                <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:border-[#35b6cf]/50 transition-colors">
                                                    <div className="mt-1 w-6 h-6 rounded-full bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center text-xs font-bold shrink-0">
                                                        {q.id}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-800 font-medium text-sm">{q.text}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50 px-2 py-1 rounded">
                                                                {q.dimension}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredQuestions.length === 0 && (
                                                <p className="text-center text-slate-400 py-8 text-sm">Nenhuma pergunta encontrada.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {expandedView === 'description' && (
                                <div className="h-full flex flex-col min-w-[30rem]">
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-[#35b6cf]">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <FileText size={18} />
                                            Descrição Completa
                                        </h3>
                                        <button
                                            onClick={() => setExpandedView('none')}
                                            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="p-8 overflow-auto bg-white h-full">
                                        <div className="max-w-2xl mx-auto">
                                            <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="w-10 h-10 rounded-xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center">
                                                    <LayoutTemplate size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{summaryData.formTitle}</h4>
                                                    <p className="text-xs text-slate-400">Publicado em {new Date().toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            <div className="prose prose-slate max-w-none">
                                                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                                                    {summaryData.formDesc}
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModalOpen && summaryData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="relative p-12 text-center">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#35b6cf] to-indigo-500"></div>

                            {/* Icon Success */}
                            <div className="mb-8 relative inline-block">
                                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 animate-bounce group">
                                    <Check size={48} strokeWidth={3} />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#35b6cf] text-white flex items-center justify-center shadow-lg">
                                    <FilePlus size={16} />
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-slate-800 mb-2">Formulário Gerado!</h3>
                            <p className="text-slate-500 mb-10 px-4">
                                O levantamento para <span className="font-bold text-slate-700">{summaryData.unit.name}</span> foi criado com sucesso e já está pronto para receber respostas.
                            </p>

                            <div className="space-y-4">
                                <div className="p-1 px-1.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                    <div className="flex-1 min-w-0 px-3 overflow-hidden">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left mb-0.5 ml-1">Link de Acesso</p>
                                        <p className="text-sm font-mono text-slate-600 truncate text-left ml-1">
                                            {summaryData.publicLink}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(summaryData.publicLink);
                                            // Optional: add a temporary tooltip or change icon to Check
                                        }}
                                        className="p-4 bg-white border border-slate-200 text-slate-500 hover:text-[#35b6cf] hover:border-[#35b6cf] rounded-xl transition-all shadow-sm hover:shadow-md"
                                        title="Copiar Link"
                                    >
                                        <Copy size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        onClick={() => window.open(summaryData.publicLink, '_blank')}
                                        className="flex items-center justify-center gap-3 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-xl shadow-slate-200"
                                    >
                                        <ExternalLink size={18} />
                                        Abrir Link
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSuccessModalOpen(false);
                                            setSummaryData(null);
                                        }}
                                        className="py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Concluir
                                    </button>
                                </div>
                            </div>

                            <p className="mt-8 text-xs text-slate-400 font-medium italic">
                                Você pode acessar este link a qualquer momento na aba de Relatórios.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Collaborator Manager Modal */}
            <CollaboratorManagerModal
                isOpen={showCollaboratorManager}
                onClose={() => {
                    setShowCollaboratorManager(false);
                    setManagingCompany(null);
                    fetchCompanies(); // Refresh counts
                }}
                company={managingCompany}
                companies={companies} // Pass all companies for global selection
            />

            {/* Forms List Modal */}
            <FormsListModal
                isOpen={showFormsListModal}
                onClose={() => {
                    setShowFormsListModal(false);
                    setSelectedCompanyForForms(null);
                }}
                company={selectedCompanyForForms}
                onCreateNew={handleCreateNewForm}
            />
        </div>
    );
};
