import React, { useState, useEffect } from 'react';
import { Building, Search, Users, FileText, ChevronRight, X, LayoutGrid, List, LayoutTemplate, Settings, Check, Filter, Trash2, Plus, CalendarDays, ArrowUpDown, FilePlus, Copy, ExternalLink } from 'lucide-react';
import { CompanyRegistrationModal } from './CompanyRegistrationModal';
import { CollaboratorManagerModal } from './CollaboratorManagerModal';
import { FormsListModal } from '../modals/FormsListModal';
import gamaLogo from '../../assets/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { EditCollaboratorsModal } from '../modals/EditCollaboratorsModal';
import { EditFormsModal } from '../modals/EditFormsModal';

// --- Form Dashboard: Main component for managing forms and companies ---
import { useCompanies } from '../../hooks/useCompanies';

// --- Form Dashboard: Main component for managing forms and companies ---
interface FormDashboardProps {
    onCreateForm: (initialData?: any) => void;
    // We'll keep these for now but they might need renaming or logic change later
    onEditForm: (company: any) => void;
    onAnalyzeForm: (company: any) => void;
}

// --- SUB-COMPONENTS FOR MODAL REFRACTOR ---

// --- REFACTORED: CompanySummary and EmployeeManagement removed as they are replaced by CompanyRegistrationModal ---

export const FormDashboard: React.FC<FormDashboardProps> = ({ onCreateForm, onAnalyzeForm }) => {
    const { user } = useAuth();
    const { companies, loading: isLoading, refetch } = useCompanies(user);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    // const [companies, setCompanies] = useState<any[]>([]); // REPLACED BY HOOK
    // const [isLoading, setIsLoading] = useState(true); // REPLACED BY HOOK

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

    // Edit Collaborators Modal
    const [isEditColabsOpen, setIsEditColabsOpen] = useState(false);
    const [selectedFormForEditColabs, setSelectedFormForEditColabs] = useState<any>(null);

    // Summary Modal State
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successModalTokens, setSuccessModalTokens] = useState(0);
    const [selectedCollaborators, setSelectedCollaborators] = useState<Set<number>>(new Set());

    // Dynamic Title Tags State
    const [showCompanyTag, setShowCompanyTag] = useState(false);
    const [showUnitTag, setShowUnitTag] = useState(false);
    const [showSectorTag, setShowSectorTag] = useState(false);
    const [baseFormTitle, setBaseFormTitle] = useState('Pesquisa de Clima Organizacional 2024');

    const [loadingDetailsFor, setLoadingDetailsFor] = useState<string | number | null>(null);
    const [visibleCount, setVisibleCount] = useState(12); // Pagination limit

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingFormId, setEditingFormId] = useState<number | null>(null);
    const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter Dropdown State
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'collaborators' | 'units'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [minCollaborators, setMinCollaborators] = useState<string>('');
    const [maxCollaborators, setMaxCollaborators] = useState<string>('');
    const [minUnits, setMinUnits] = useState<string>('');
    const [maxUnits, setMaxUnits] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const { data, error } = await supabase
                .from('form_questions')
                .select(`
                    id,
                    label,
                    form_hse_dimensions (
                        name
                    )
                `)
                .order('question_order', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped = data.map(q => ({
                    id: q.id,
                    text: q.label || '',
                    dimension: (q as any).form_hse_dimensions?.name || 'Geral'
                }));
                setQuestions(mapped);
            }
        } catch (err) {
            console.error('Erro ao buscar perguntas:', err);
        }
    };

    const hasActiveFilters = minCollaborators || maxCollaborators || minUnits || maxUnits || dateFrom || dateTo || sortBy !== 'name';

    const clearAllFilters = () => {
        setSortBy('name');
        setSortOrder('asc');
        setMinCollaborators('');
        setMaxCollaborators('');
        setMinUnits('');
        setMaxUnits('');
        setDateFrom('');
        setDateTo('');
    };



    // useEffect(() => {
    //     if (user) {
    //         fetchCompanies();
    //     }
    // }, [user]);
    // REMOVED fetchCompanies

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
                    cargo_rel:cargos(id, nome),
                    setor_rel:setor(id, nome)
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
                // Prioridade para o nome vindo da relação, fallback para a coluna de texto bruta
                cargo: c.cargo_rel?.nome || c.cargo || '',
                setor: c.setor_rel?.nome || c.setor || '',
                cargo_id: c.cargo_rel?.id || c.cargo_id,
                setor_id: c.setor_rel?.id || c.setor_id
            }));

            // Process Roles & Sectors List
            const allCompanySectorNames = new Set<string>();
            mappedUnits.forEach(u => u.sectors.forEach((s: any) => {
                if (s.name) allCompanySectorNames.add(s.name);
            }));

            const allCompanyRolesReference = mappedUnits.flatMap(u => u.roles);
            // Deduplicate by ID to avoid visual duplicates in "Cargos" tab
            const uniqueRolesMap = new Map();
            allCompanyRolesReference.forEach(r => {
                const key = `${r.nome}-${r.setor_name}`;
                if (!uniqueRolesMap.has(key)) {
                    uniqueRolesMap.set(key, { nome: r.nome, setor: r.setor_name });
                }
            });
            const allCompanyRoles = Array.from(uniqueRolesMap.values());
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

            // PERF FIX: Do NOT update the global cache with this massive object.
            // It slows down the Dashboard filtering/rendering significantly.
            // We just return it for the local operation (Modal).

            // updateCompanyInCache(updatedCompany); // DISABLED

            return updatedCompany;

        } catch (err) {
            console.error("Error lazy loading details:", err);
            return company; // Return original if fail
        } finally {
            setLoadingDetailsFor(null);
        }
    };

    const filteredCompanies = React.useMemo(() => {
        let result = companies.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cnpj.includes(searchTerm)
        );

        // Filter by collaborator count
        if (minCollaborators) {
            result = result.filter(c => c.total_collaborators >= Number(minCollaborators));
        }
        if (maxCollaborators) {
            result = result.filter(c => c.total_collaborators <= Number(maxCollaborators));
        }

        // Filter by unit count
        if (minUnits) {
            result = result.filter(c => c.total_units >= Number(minUnits));
        }
        if (maxUnits) {
            result = result.filter(c => c.total_units <= Number(maxUnits));
        }

        // Filter by date range
        if (dateFrom) {
            result = result.filter(c => c.created_at && new Date(c.created_at) >= new Date(dateFrom));
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            result = result.filter(c => c.created_at && new Date(c.created_at) <= endDate);
        }

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    comparison = (new Date(a.created_at || 0).getTime()) - (new Date(b.created_at || 0).getTime());
                    break;
                case 'collaborators':
                    comparison = a.total_collaborators - b.total_collaborators;
                    break;
                case 'units':
                    comparison = a.total_units - b.total_units;
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [companies, searchTerm, minCollaborators, maxCollaborators, minUnits, maxUnits, dateFrom, dateTo, sortBy, sortOrder]);



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

    const handleEditFormFromList = async (form: any) => {
        setShowFormsListModal(false);
        setIsEditMode(true);
        setEditingFormId(form.id);

        // Find company from parent state or refetch if needed
        const companyId = selectedCompanyForForms?.id;
        if (!companyId) return;

        // LAZY LOAD company details
        const fullCompany = await fetchCompanyDetails(selectedCompanyForForms);

        // 1. Fetch form answers to identify respondents (for locking)
        const { data: answersData } = await supabase
            .from('form_answers')
            .select('respondedor')
            .eq('form_id', form.id);

        const respIds = new Set(answersData?.map(a => String(a.respondedor)) || []);
        setRespondedIds(respIds);

        // 2. Identify already included collaborators
        const includedIds = new Set<number>(form.colaboladores_inclusos || []);

        // 3. Setup summary data for Edit Mode
        setSummaryData({
            company: fullCompany,
            unit: { id: form.unidade_id, name: form.unidade_nome || 'Unidade' },
            sector: form.setor_nome || 'Geral',
            sectorId: form.setor_id || null,
            kpiCollaborators: includedIds.size,
            kpiQuestions: questions.length,
            formTitle: form.title,
            formDesc: form.description,
            publicLink: form.link,
            initialCollaboratorsCount: includedIds.size
        });

        setBaseFormTitle(form.title);
        setSelectedCollaborators(includedIds);
        setSummaryModalOpen(true);
    };

    const handleFinishSelection = (company: any, unit: any, sector: string, sectorId: number | null) => {
        // Filtrar colaboradores por unidade e setor (se setor for diferente de null/Geral)
        const filteredCollaborators = (company.collaborators || []).filter((c: any) => {
            const matchUnit = Number(c.unidade_id) === Number(unit.id);
            const matchSector = sectorId === null || Number(c.setor_id) === Number(sectorId);
            return matchUnit && matchSector;
        });

        // Instead of directly creating, show the summary modal
        setSummaryData({
            company: {
                ...company,
                collaborators: filteredCollaborators // Sobrescreve com a lista filtrada para o resumo
            },
            unit: unit,
            sector: sector,
            sectorId: sectorId,
            kpiCollaborators: filteredCollaborators.length,
            kpiQuestions: questions.length,
            formTitle: baseFormTitle,
            formDesc: 'Avaliação completa de engajamento e satisfação dos colaboradores.',
            publicLink: '' // Will be generated on confirm
        });
        setSelectingFor(null);
        setSummaryModalOpen(true);

        // Default all collaborators to selected (baseado na lista filtrada)
        const allIds = new Set<number>(filteredCollaborators.map((c: any) => c.id).filter(Boolean));
        setSelectedCollaborators(allIds);

        // Reset tags when starting a new selection
        setShowCompanyTag(false);
        setShowUnitTag(false);
        setShowSectorTag(false);
    };




    const openInfoModal = async (e: React.MouseEvent, company: any) => {
        e.stopPropagation(); // Prevent card navigation
        const fullCompany = await fetchCompanyDetails(company);
        setInfoModalCompany(fullCompany);
    };




    const handleUpdateCompany = async (formData: any) => {
        // setIsLoading(true); // Managed by hook
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
                        },
                        img_url: formData.img_url
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
                        },
                        img_url: formData.img_url
                    })
                    .eq('id', companyId);

                if (companyError) throw companyError;
            }

            // 2. Sync Sectors
            const sectorIds: number[] = [];
            const sectorNameMap: Record<string, number> = {};

            if (formData.setores && formData.setores.length > 0) {
                const uniqueSectors = Array.from(new Set(formData.setores as string[]));
                for (const sectorName of uniqueSectors) {
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
                    const uniqueSectorIds = Array.from(new Set(sectorIds));
                    await supabase
                        .from('clientes')
                        .update({ setores: uniqueSectorIds })
                        .eq('id', companyId);
                }
                console.log(`[SAVE] Synced ${sectorIds.length} sectors for company.`);
            }

            // 3. Sync Roles
            const roleIds: number[] = [];
            const roleNameMap: Record<string, number> = {};

            // First, get currently linked roles to potentially merge or replace
            if (formData.cargos && formData.cargos.length > 0) {
                const uniqueRoles = (formData.cargos as any[]).filter((role, index, self) =>
                    index === self.findIndex((r) => (
                        r.nome === role.nome && r.setor === role.setor
                    ))
                );

                for (const role of uniqueRoles) {
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

            // DELETE LOGIC: Remove units that are no longer in the list
            if (currentUnits.length > 0 && parentCompanyUuid) {
                const { data: existingUnits } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', parentCompanyUuid);

                if (existingUnits) {
                    const existingIds = existingUnits.map(u => u.id);
                    // FIX: Handle String/Number IDs correctly
                    // Convert everything to number for comparison if possible and reasonable size
                    const currentIds = currentUnits
                        .map((u: any) => {
                            const num = Number(u.id);
                            return !isNaN(num) && num < 1000000000000 ? num : null;
                        })
                        .filter((id: any) => id !== null);

                    const idsToDelete = existingIds.filter(id => !currentIds.includes(id));

                    if (idsToDelete.length > 0) {
                        console.log('[SAVE] Deleting removed units:', idsToDelete);
                        const { error: deleteError } = await supabase
                            .from('unidades')
                            .delete()
                            .in('id', idsToDelete);

                        if (deleteError) {
                            console.error('[ERROR] Deleting units (FK constraint?):', deleteError);
                            // If we can't delete, we should probably warn or try to decouple collaborators?
                            // For now, we continue, but these units will remain in DB.
                        }
                    }
                }
            }

            for (const unit of currentUnits) {
                // Fix: Correctly identify Temp IDs vs Real IDs (stringified numbers)
                const unitIdNum = Number(unit.id);
                // Real ID if it's a valid number AND small enough (not a timestamp)
                const isRealId = !isNaN(unitIdNum) && unitIdNum < 1000000000000;
                const isTempId = !isRealId;

                if (!parentCompanyUuid && isTempId) {
                    console.error('[ERROR] Missing Parent Company UUID for new unit:', unit.name);
                    alert(`Erro: Empresa mãe não identificada para unidade ${unit.name}`);
                    continue;
                }

                // CRITICAL FIX: Resolve IDs strictly for this unit's sectors and roles
                const unitSectorIds = Array.from(new Set(
                    (unit.sectors || [])
                        .map((s: string) => sectorNameMap[s])
                        .filter(Boolean)
                ));

                const unitRoleIds = Array.from(new Set(
                    (formData.cargos || [])
                        .filter((cargo: any) => unit.sectors.some((us: string) => us === cargo.setor))
                        .map((cargo: any) => roleNameMap[`${cargo.setor}_${cargo.nome}`])
                        .filter(Boolean)
                ));

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
                    const { error: updateError } = await supabase.from('unidades').update(unitPayload).eq('id', unitIdNum);
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

            // DELETE LOGIC FOR COLLABORATORS
            if (parentCompanyUuid) {
                // 1. Get all units for this company to find related collaborators
                const { data: companyUnits } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', parentCompanyUuid);

                if (companyUnits && companyUnits.length > 0) {
                    const companyUnitIds = companyUnits.map(u => u.id);

                    // 2. Get all existing collaborators in DB for these units
                    const { data: existingColabs } = await supabase
                        .from('colaboradores')
                        .select('id')
                        .in('unidade_id', companyUnitIds);

                    if (existingColabs) {
                        const existingColabIds = existingColabs.map(c => c.id);

                        // 3. Filter IDs currently in the form
                        // Handle potential string/number mismatches
                        const currentFormColabIds = collaborators
                            .map((c: any) => {
                                const num = Number(c.id);
                                // Valid ID if number and not temp timestamp (approx check)
                                return !isNaN(num) && num < 1000000000000 ? num : null;
                            })
                            .filter((id: any) => id !== null);

                        const colabsToDelete = existingColabIds.filter(id => !currentFormColabIds.includes(id));

                        if (colabsToDelete.length > 0) {
                            console.log('[SAVE] Deleting removed collaborators:', colabsToDelete);
                            const { error: delColabErr } = await supabase
                                .from('colaboradores')
                                .delete()
                                .in('id', colabsToDelete);

                            if (delColabErr) console.error('[ERROR] Deleting collaborators:', delColabErr);
                        }
                    }
                }
            }

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

            await refetch();
            setInfoModalCompany(null);
            alert('Dados atualizados com sucesso!');

        } catch (error) {
            console.error('Error updating company:', error);
            alert('Erro ao atualizar dados. Verifique o console.');
        } finally {
            // setIsLoading(false); // Managed by hook
        }
    };

    const handleDeleteCompany = (company: any) => {
        if (!company) return;
        setCompanyToDelete(company);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!companyToDelete) return;

        setIsDeleting(true);
        const company = companyToDelete;

        try {
            console.log('[DELETE] Initiating deletion for company:', { id: company.id, name: company.name });

            // 1. Get accurate data before deletion
            console.log('[DELETE] Step 1: Fetching company details for ID:', company.id);
            const { data: clientData, error: clientFetchError } = await supabase
                .from('clientes')
                .select('cliente_uuid')
                .eq('id', company.id)
                .single();

            if (clientFetchError) {
                console.error('[DELETE] Error fetching company data:', clientFetchError);
                throw new Error(`Empresa não encontrada: ${clientFetchError.message}`);
            }
            const parentUuid = clientData.cliente_uuid;
            console.log('[DELETE] Parent UUID:', parentUuid);

            // 2. Get associated Units
            console.log('[DELETE] Step 2: Fetching units...');
            const { data: units, error: unitsError } = await supabase
                .from('unidades')
                .select('id, setores, cargos')
                .eq('empresa_mae', parentUuid);

            if (unitsError) {
                console.error('[DELETE] Error fetching units:', unitsError);
                throw unitsError;
            }

            const unitIds = units?.map(u => u.id) || [];
            console.log('[DELETE] Found unitIds:', unitIds);

            if (unitIds.length > 0) {
                // 3. Delete Forms
                console.log('[DELETE] Step 3: Deleting associated forms...');
                const { error: formsError } = await supabase
                    .from('forms')
                    .delete()
                    .in('unidade_id', unitIds);

                if (formsError) {
                    console.error('[DELETE] Error deleting forms:', formsError);
                }

                // 4. Delete Collaborators
                console.log('[DELETE] Step 4: Deleting collaborators...');
                const { error: colabError } = await supabase
                    .from('colaboradores')
                    .delete()
                    .in('unidade_id', unitIds);

                if (colabError) {
                    console.error('[DELETE] Error deleting collaborators:', colabError);
                    throw colabError;
                }

                // 5. Delete Units
                console.log('[DELETE] Step 5: Deleting units...');
                const { error: unitDeleteError } = await supabase
                    .from('unidades')
                    .delete()
                    .in('id', unitIds);

                if (unitDeleteError) {
                    console.error('[DELETE] Error deleting units:', unitDeleteError);
                    throw unitDeleteError;
                }
            }

            // 6. Delete Company with Verification
            console.log('[DELETE] Step 6: Deleting final company row ID:', company.id);
            const { data: deletedResult, error: finalError } = await supabase
                .from('clientes')
                .delete()
                .eq('id', company.id)
                .select();

            if (finalError) {
                console.error('[DELETE] Final delete error:', finalError);
                throw finalError;
            }

            if (!deletedResult || deletedResult.length === 0) {
                console.warn('[DELETE] No rows were deleted from clientes table!');
                throw new Error("A empresa não foi excluída. Verifique se você tem permissão ou se ela já foi removida.");
            }

            console.log('[DELETE] Successfully deleted company:', deletedResult[0]);
            setShowDeleteConfirm(false);
            setCompanyToDelete(null);
            alert('Empresa e todos os dados associados foram excluídos com sucesso!');
            refetch();
        } catch (error: any) {
            console.error('[DELETE] Cascading delete failed:', error);
            alert(`Erro na exclusão: ${error.message || 'Erro inesperado'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions - Styled to match Grid Alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-2">
                <div className="flex items-center">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Empresas Monitoradas</h2>
                </div>

                <div className="sm:col-span-1 xl:col-span-2 flex flex-col md:flex-row items-center gap-3 w-full">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full h-11 flex-1">
                        <div className="relative flex-1">
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
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className={`p-2 rounded-lg transition-all relative ${showFilterDropdown || hasActiveFilters ? 'text-[#35b6cf] bg-[#35b6cf]/10' : 'text-slate-400 hover:text-[#35b6cf] hover:bg-slate-50'}`}
                                    title="Filtros"
                                >
                                    <Filter size={18} />
                                    {hasActiveFilters && (
                                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#35b6cf] rounded-full border-2 border-white" />
                                    )}
                                </button>

                                {/* Filter Dropdown */}
                                {showFilterDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40 bg-black/30 md:bg-transparent" onClick={() => setShowFilterDropdown(false)} />
                                        <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 w-full md:w-80 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-100 z-50 animate-in slide-in-from-bottom-4 md:fade-in md:zoom-in-95 duration-200 overflow-hidden max-h-[85vh] md:max-h-none">
                                            {/* Header */}
                                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtros</span>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={clearAllFilters}
                                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                                                    >
                                                        Limpar Tudo
                                                    </button>
                                                )}
                                            </div>

                                            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 7rem)' }}>
                                                {/* Sort */}
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                        <ArrowUpDown size={12} />
                                                        Ordenar por
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {[
                                                            { value: 'name', label: 'Nome' },
                                                            { value: 'date', label: 'Data' },
                                                            { value: 'collaborators', label: 'Colaboradores' },
                                                            { value: 'units', label: 'Unidades' },
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    if (sortBy === opt.value) {
                                                                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                                                    } else {
                                                                        setSortBy(opt.value as any);
                                                                        setSortOrder('asc');
                                                                    }
                                                                }}
                                                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${sortBy === opt.value
                                                                    ? 'bg-[#35b6cf]/10 text-[#35b6cf] border border-[#35b6cf]/20'
                                                                    : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                                                                    }`}
                                                            >
                                                                {opt.label}
                                                                {sortBy === opt.value && (
                                                                    <span className="text-[10px]">{sortOrder === 'asc' ? 'â†‘' : 'â†“'}</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <hr className="border-slate-100" />

                                                {/* Date Range */}
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                        <CalendarDays size={12} />
                                                        Data de Adição
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">De</label>
                                                            <input
                                                                type="date"
                                                                value={dateFrom}
                                                                onChange={(e) => setDateFrom(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Até</label>
                                                            <input
                                                                type="date"
                                                                value={dateTo}
                                                                onChange={(e) => setDateTo(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <hr className="border-slate-100" />

                                                {/* Collaborator Count Range */}
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                        <Users size={12} />
                                                        Qtd. de Colaboradores
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Mínimo</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={minCollaborators}
                                                                onChange={(e) => setMinCollaborators(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Máximo</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="âˆž"
                                                                value={maxCollaborators}
                                                                onChange={(e) => setMaxCollaborators(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <hr className="border-slate-100" />

                                                {/* Unit Count Range */}
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                                        <Building size={12} />
                                                        Qtd. de Unidades
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Mínimo</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0"
                                                                value={minUnits}
                                                                onChange={(e) => setMinUnits(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Máximo</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                placeholder="âˆž"
                                                                value={maxUnits}
                                                                onChange={(e) => setMaxUnits(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                                                <button
                                                    onClick={() => setShowFilterDropdown(false)}
                                                    className="px-4 py-2 bg-[#35b6cf] text-white rounded-lg text-xs font-bold hover:bg-[#2ca3bc] transition-all shadow-sm"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
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

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setInfoModalCompany({ isNew: true })}
                            className="flex items-center justify-center gap-2 px-4 md:px-6 bg-[#35b6cf] text-white rounded-xl font-bold hover:bg-[#2ca3bc] transition-all shadow-lg shadow-[#35b6cf]/20 shrink-0 flex-1 md:flex-none md:w-40 h-11 text-sm whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>Empresa</span>
                        </button>

                        <button
                            onClick={() => {
                                setManagingCompany(null); // Global mode
                                setShowCollaboratorManager(true);
                            }}
                            className="flex items-center justify-center gap-2 px-4 md:px-6 bg-white text-[#35b6cf] border border-[#35b6cf] rounded-xl font-bold hover:bg-[#35b6cf]/5 transition-all shadow-sm shrink-0 flex-1 md:flex-none md:w-40 h-11 text-sm whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>Colaborador</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid vs List Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
                        onClick={() => refetch()}
                        className="px-6 py-2.5 bg-[#35b6cf] text-white rounded-xl font-bold hover:bg-[#2ca3bc] transition-all shadow-lg shadow-[#35b6cf]/20"
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {filteredCompanies.slice(0, visibleCount).map((company) => (
                            <div
                                key={company.id}
                                onClick={() => {
                                    onAnalyzeForm(company);
                                }}
                                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#35b6cf]/10 hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer relative"
                            >

                                {/* Card Body */}
                                <div className="p-4 md:p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center overflow-hidden border border-[#35b6cf]/20 group-hover:bg-[#35b6cf] group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                                            {company.img_url ? (
                                                <img
                                                    src={company.img_url}
                                                    alt={company.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback icon if image fails to load
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLElement).parentElement?.classList.add('p-3');
                                                    }}
                                                />
                                            ) : (
                                                <Building size={24} />
                                            )}
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
                                <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between mt-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCompany(company);
                                        }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Excluir Empresa"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="flex items-center gap-x-1">
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
                            </div>
                        ))}
                    </div>

                    {filteredCompanies.length > visibleCount && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 12)}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Carregar Mais Empresas
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {filteredCompanies.map((company) => (
                            <div key={company.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 active:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center overflow-hidden shrink-0">
                                        {company.img_url ? (
                                            <img src={company.img_url} alt={company.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Building size={18} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{company.name}</h4>
                                        <p className="text-xs text-slate-400 font-medium">{company.cnpj}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <Building size={12} className="text-slate-300" />
                                        {(company.total_units !== undefined ? company.total_units : company.units?.length || 0)} Unid.
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={12} className="text-slate-300" />
                                        {company.total_collaborators} Colab.
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-1 border-t border-slate-50 pt-2">
                                    <button onClick={(e) => openInfoModal(e, company)} className="p-2 text-slate-400 hover:text-[#35b6cf] transition-colors" title="Estrutura">
                                        <Settings size={16} />
                                    </button>
                                    <button onClick={() => handleGerarFormulario(company)} className="p-2 text-slate-400 hover:text-[#35b6cf] transition-colors" title="Formulários">
                                        <FileText size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setManagingCompany(company); setShowCollaboratorManager(true); }} className="p-2 text-slate-400 hover:text-[#35b6cf] transition-colors" title="Colaboradores">
                                        <Users size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
                                                    <div className="w-8 h-8 rounded-lg bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center overflow-hidden shrink-0">
                                                        {company.img_url ? (
                                                            <img src={company.img_url} alt={company.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Building size={16} />
                                                        )}
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
                                                    <button onClick={(e) => openInfoModal(e, company)} className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors" title="Estrutura da empresa">
                                                        <Settings size={18} />
                                                    </button>
                                                    <button onClick={() => handleGerarFormulario(company)} className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors" title="Formulários">
                                                        <FileText size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); setManagingCompany(company); setShowCollaboratorManager(true); }} className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors" title="Colaboradores">
                                                        <Users size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" title="Excluir">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}



            {/* Selection Modal Overlay */}
            {
                selectingFor && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-h-[88dvh] md:max-h-none md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                            <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
                                <div className="min-w-0">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-800">Gerar Formulário</h2>
                                    <p className="text-sm text-slate-500 mt-1 truncate">{selectingFor.name}</p>
                                </div>
                                <button
                                    onClick={() => setSelectingFor(null)}
                                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 md:p-6">
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
                )
            }

            {/* INFO MODAL */}
            {/* EDITED MODAL REPLACEMENT */}
            <CompanyRegistrationModal
                isOpen={!!infoModalCompany}
                onClose={() => setInfoModalCompany(null)}
                onSave={handleUpdateCompany}
                initialData={infoModalCompany?.isNew ? null : infoModalCompany}
                isLoading={isLoading}
            />

            {/* Edit/Summary Modal */}
            <EditFormsModal
                isOpen={summaryModalOpen}
                onClose={() => setSummaryModalOpen(false)}
                summaryData={summaryData}
                setSummaryData={setSummaryData}
                isEditMode={isEditMode}
                editingFormId={editingFormId}
                respondedIds={respondedIds}
                selectedCollaborators={selectedCollaborators}
                setSelectedCollaborators={setSelectedCollaborators}
                onSaveSuccess={(tokensConsumed) => {
                    setSummaryModalOpen(false);
                    setSuccessModalTokens(tokensConsumed);
                    setSuccessModalOpen(true);
                    refetch();
                }}
                baseFormTitle={baseFormTitle}
                setBaseFormTitle={setBaseFormTitle}
                showCompanyTag={showCompanyTag}
                setShowCompanyTag={setShowCompanyTag}
                showUnitTag={showUnitTag}
                setShowUnitTag={setShowUnitTag}
                showSectorTag={showSectorTag}
                setShowSectorTag={setShowSectorTag}
                questions={questions}
                onCreateForm={onCreateForm as any}
            />

            {/* Success Modal */}
            {
                successModalOpen && summaryData && (
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
                                <p className="text-slate-500 mb-6 px-4">
                                    O levantamento para <span className="font-bold text-slate-700">{summaryData.unit.name}</span> foi criado com sucesso e já está pronto para receber respostas.
                                </p>

                                {successModalTokens > 0 && (
                                    <div className="flex justify-center mb-10">
                                        <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-50 border border-amber-200/60 text-amber-600 rounded-full shadow-sm text-sm font-bold">
                                            <img src={gamaLogo} alt="Token" className="w-5 h-5 object-contain" />
                                            <span>{successModalTokens} token{successModalTokens !== 1 ? 's' : ''} debitado{successModalTokens !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                )}

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
                )
            }

            {/* Collaborator Manager Modal */}
            <CollaboratorManagerModal
                isOpen={showCollaboratorManager}
                onClose={() => {
                    setShowCollaboratorManager(false);
                    setManagingCompany(null);
                    refetch(); // Refresh counts
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
                onCreateNew={() => {
                    setIsEditMode(false);
                    setEditingFormId(null);
                    setRespondedIds(new Set());
                    handleCreateNewForm();
                }}
                onEditForm={handleEditFormFromList}
            />

            {selectedFormForEditColabs && (
                <EditCollaboratorsModal
                    isOpen={isEditColabsOpen}
                    onClose={() => {
                        setIsEditColabsOpen(false);
                        setSelectedFormForEditColabs(null);
                    }}
                    form={selectedFormForEditColabs}
                    onSaveSuccess={() => {
                        // Opcional: Reabrir o FormsListModal se o usuário quiser continuar vendo a lista
                        // Mas o pedido original era para fechar o de trás. 
                        // Se quisermos reabrir, poderíamos colocar:
                        // handleGerarFormulario(selectedCompanyForForms);
                    }}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    if (!isDeleting) {
                        setShowDeleteConfirm(false);
                        setCompanyToDelete(null);
                    }
                }}
                onConfirm={confirmDelete}
                title="Excluir Empresa?"
                description={`Você tem certeza que deseja excluir a empresa "${companyToDelete?.name}"?\n\nEsta ação excluirá permanentemente todas as unidades, colaboradores e formulários associados. Esta operação não pode ser desfeita.`}
                confirmText={isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};
