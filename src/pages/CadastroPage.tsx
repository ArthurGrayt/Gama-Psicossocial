import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FilePlus, FileSpreadsheet, ChevronRight, Upload, Download } from 'lucide-react';
import { CompanyRegistrationModal } from '../components/forms/CompanyRegistrationModal';
import { supabase } from '../services/supabase';

type ViewArgs = 'options' | 'import';

export const CadastroPage: React.FC = () => {
    const [view, setView] = useState<ViewArgs>('options');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // isLoading state is still declared but not used in the new handleRegisterCompany

    const handleBack = () => {
        setView('options');
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        // Optionally show success toast here
    };

    const handleRegisterCompany = async (data: any) => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Erro de autenticação. Tente fazer login novamente.');
                setIsLoading(false);
                return;
            }

            console.log('Iniciando cadastro da empresa:', data);

            // 0. Safety Check: Ensure User Exists in public.users to avoid FK violation
            const { data: existingPublicUser } = await supabase
                .from('users')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!existingPublicUser) {
                console.log('Usuario nao encontrado na tabela publica. Criando registro de recuperacao...');
                // Attempt to create the user in public table with REQUIRED fields (including img_url)
                const { error: createError } = await supabase
                    .from('users')
                    .insert({
                        user_id: user.id,
                        email: user.email,
                        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
                        created_at: new Date().toISOString(),
                        primeiro_acesso: false,
                        img_url: 'https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/sign/img_user/profile_pics/padrao.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82YzdhYzE0NS00N2RmLTQ3ZjItYWYyMi0xZDFkOTE0NTM3Y2EiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWdfdXNlci9wcm9maWxlX3BpY3MvcGFkcmFvLmpwZyIsImlhdCI6MTc1OTI0Mzk1MiwiZXhwIjo4ODE1OTE1NzU1Mn0.AWDYc1mewJEuVqVSeUlJJykNj801mzyMequTNPHqfL0'
                    });

                if (createError) {
                    console.error('Falha crítica: Não foi possível garantir o usuário público para vínculo.', createError);
                    alert('Erro interno: Não foi possível criar seu perfil de usuário. Tente novamente ou contate o suporte.');
                    setIsLoading(false);
                    return; // Critical stop
                }
            }

            // 1. Insert Company using the correct UUID (user.id)
            const { data: companyData, error: companyError } = await supabase
                .from('clientes')
                .insert({
                    razao_social: data.razaoSocial,
                    nome_fantasia: data.nomeFantasia,
                    cnpj: data.cnpj,
                    email: data.email,
                    telefone: data.telefone,
                    responsavel: data.responsavel,
                    endereco: JSON.stringify({
                        cep: data.cep,
                        rua: data.rua,
                        bairro: data.bairro,
                        cidade: data.cidade,
                        uf: data.uf
                    }),
                    status: 'active',
                    empresa_responsavel: user.id // Using the Auth UUID which matches public.users.user_id
                })
                .select()
                .single();

            if (companyError) throw companyError;
            if (!companyData) throw new Error('Erro ao criar empresa: Dados não retornados.');

            const companyId = companyData.id;
            const companyUuid = companyData.cliente_uuid;
            console.log('Empresa criada com ID:', companyId, 'UUID:', companyUuid);

            // 1.5. Insert Units (Always at least one)
            const unitsToInsert = (data.units && data.units.length > 0)
                ? data.units.map((u: any) => ({
                    nome: u.name,
                    empresa_mae: companyUuid
                }))
                : [{
                    nome: 'Matriz',
                    empresa_mae: companyUuid
                }];

            const { data: unitsRes, error: unitsError } = await supabase
                .from('unidades')
                .insert(unitsToInsert)
                .select();

            if (unitsError) {
                console.error('Erro ao criar unidades:', unitsError);
                throw unitsError;
            }
            console.log('Unidades criadas:', unitsRes);

            // 2. Insert Sectors and Link to Company
            const sectorIds: number[] = [];
            const roleIds: number[] = [];
            const sectorNameMap: Record<string, number> = {};
            const roleNameMap: Record<string, number> = {};

            if (data.setores && data.setores.length > 0) {
                for (const sectorName of data.setores) {
                    const { data: sectorRes, error: sectorError } = await supabase
                        .from('setor')
                        .insert({ nome: sectorName })
                        .select()
                        .single();

                    if (sectorError) {
                        console.error(`Erro ao criar setor ${sectorName}:`, sectorError);
                        continue;
                    }
                    if (sectorRes) {
                        sectorIds.push(sectorRes.id);
                        sectorNameMap[sectorName] = sectorRes.id;
                    }
                }

                if (sectorIds.length > 0) {
                    await supabase
                        .from('clientes')
                        .update({ setores: sectorIds })
                        .eq('id', companyId);
                }

                // 3. Insert Roles and Link to Company
                if (data.cargos && data.cargos.length > 0) {
                    for (const role of data.cargos) {
                        const sectorId = sectorNameMap[role.setor];
                        if (!sectorId) {
                            console.warn(`Setor ID não encontrado para o cargo ${role.nome}. Pulando.`);
                            continue;
                        }

                        const { data: roleRes, error: roleError } = await supabase
                            .from('cargos')
                            .insert({
                                nome: role.nome,
                                setor_id: sectorId
                            })
                            .select()
                            .single();

                        if (roleError) {
                            console.error(`Erro ao criar cargo ${role.nome}:`, roleError);
                            continue;
                        }
                        if (roleRes) {
                            roleIds.push(roleRes.id);
                            // Store mapping: sectorName + roleName
                            roleNameMap[`${role.setor}_${role.nome}`] = roleRes.id;
                        }
                    }

                    if (roleIds.length > 0) {
                        await supabase
                            .from('clientes')
                            .update({ cargos: roleIds })
                            .eq('id', companyId);
                    }
                }
            }

            // 4. Update Units with Sector and Role IDs
            if (unitsRes && unitsRes.length > 0 && (sectorIds.length > 0 || roleIds.length > 0)) {
                const unitUpdatePromises = unitsRes.map((unit: any) =>
                    supabase
                        .from('unidades')
                        .update({
                            setores: sectorIds,
                            cargos: roleIds
                        })
                        .eq('id', unit.id)
                );
                await Promise.all(unitUpdatePromises);
                console.log('Unidades atualizadas com setores e cargos.');
            }

            // 5. Insert Collaborators
            if (data.colaboradores && data.colaboradores.length > 0 && unitsRes && unitsRes.length > 0) {
                const mainUnitId = unitsRes[0].id; // Associate with 'Matriz' by default

                const collaboratorsToInsert = data.colaboradores.map((colab: any) => {
                    const rId = roleNameMap[`${colab.setor}_${colab.cargo}`];

                    return {
                        nome: colab.nome,
                        email: colab.email,
                        unidade_id: mainUnitId,
                        cargo_id: rId
                    };
                }).filter((c: any) => c.cargo_id);

                if (collaboratorsToInsert.length > 0) {
                    const { error: colabError } = await supabase
                        .from('colaboradores')
                        .insert(collaboratorsToInsert);

                    if (colabError) {
                        console.error('Erro ao inserir colaboradores:', colabError);
                    } else {
                        console.log(`${collaboratorsToInsert.length} colaboradores inseridos.`);
                    }
                }
            }

            alert('Empresa cadastrada com sucesso!');
            handleSaveSuccess();

        } catch (error: any) {
            console.error('Erro ao cadastrar empresa:', error);
            const msg = error?.message || 'Erro desconhecido ao cadastrar empresa.';
            alert(`Falha no cadastro: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                {view === 'options' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        {/* ... (header and button content same as before) ... */}
                        <header className="mb-10 text-center">
                            <h1 className="text-3xl font-bold text-slate-800 mb-3">Novo Cadastro</h1>
                            <p className="text-slate-500 text-lg">Escolha como você deseja iniciar o cadastro</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Manual Option - Opens Modal */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="group relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden flex flex-col h-64 justify-between"
                            >
                                {/* ... (button content) ... */}
                                <div className="absolute top-0 right-0 p-32 bg-[#35b6cf]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#35b6cf]/10 transition-colors" />

                                <div className="w-16 h-16 rounded-2xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FilePlus size={32} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#35b6cf] transition-colors">
                                        Cadastrar Manualmente
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Preencha o formulário passo a passo para cadastrar uma nova empresa e seus dados.
                                    </p>
                                </div>

                                <div className="absolute bottom-8 right-8 text-slate-300 group-hover:text-[#35b6cf] group-hover:translate-x-1 transition-all">
                                    <ChevronRight size={24} />
                                </div>
                            </button>

                            {/* Import Option (keep existing) */}
                            <button
                                onClick={() => setView('import')}
                                className="group relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#0f978e]/30 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden flex flex-col h-64 justify-between"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-[#0f978e]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#0f978e]/10 transition-colors" />

                                <div className="w-16 h-16 rounded-2xl bg-[#0f978e]/10 text-[#0f978e] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FileSpreadsheet size={32} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#0f978e] transition-colors">
                                        Importar Planilha
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Faça upload de uma planilha Excel para cadastrar múltiplos dados de uma só vez.
                                    </p>
                                </div>

                                <div className="absolute bottom-8 right-8 text-slate-300 group-hover:text-[#0f978e] group-hover:translate-x-1 transition-all">
                                    <ChevronRight size={24} />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                <CompanyRegistrationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleRegisterCompany}
                    isLoading={isLoading}
                />

                {view === 'import' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronRight className="rotate-180" size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Importar Planilha</h1>
                                <p className="text-slate-500">Carregue seus dados em massa</p>
                            </div>
                        </div>

                        {/* Import Area Placeholder */}
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Clique ou arraste sua planilha aqui</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                                Suportamos arquivos .xlsx e .csv. Certifique-se de que sua planilha siga o modelo padrão.
                            </p>
                            <button className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                Selecionar Arquivo
                            </button>
                        </div>

                        {/* Support / Template Info */}
                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Download size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Precisa do modelo padrão?</h4>
                                <p className="text-sm text-slate-500 mt-1 mb-3">
                                    Para que a importação funcione corretamente, é necessário seguir a estrutura de colunas do nosso modelo.
                                </p>
                                <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                                    Baixar planilha modelo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
