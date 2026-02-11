import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FilePlus, ChevronRight } from 'lucide-react';
import { CompanyRegistrationModal } from '../components/forms/CompanyRegistrationModal';
import { supabase } from '../services/supabase';

export const CadastroPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

            // Helper to generate normalized keys for mapping
            const generateKey = (s: string, c: string) => `${s?.trim().toLowerCase()}_${c?.trim().toLowerCase()}`;

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
                        // Store mapping: normalized(sectorName) -> sectorRes.id
                        // Note: We use the raw name for lookup in role creation logic below, 
                        // but actually data.cargos uses the exact strings from data.setores if consistency is maintained.
                        // To be safe, we map normalized version too.
                        sectorNameMap[sectorName.trim().toLowerCase()] = sectorRes.id;
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
                        const sKey = role.setor.trim().toLowerCase();
                        const sectorId = sectorNameMap[sKey];

                        if (!sectorId) {
                            console.warn(`Setor ID não encontrado para o cargo ${role.nome} (Setor: ${role.setor}). Pulando.`);
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
                            // Store mapping: normalized(sector)_normalized(role)
                            roleNameMap[generateKey(role.setor, role.nome)] = roleRes.id;
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
                // Determine unit for each collaborator (if specified in import) or default to Matriz
                const mainUnitId = unitsRes[0].id; // Associate with 'Matriz' by default

                const collaboratorsToInsert = data.colaboradores.map((colab: any) => {
                    const rId = roleNameMap[generateKey(colab.setor, colab.cargo)];

                    // Try to find the correct unit ID if specified
                    let targetUnitId = mainUnitId;
                    if (colab.unidade_id) {
                        // Find the unit ID from the created units list that matches the temporary ID or Name?
                        // The import process assigns the temporary ID from the units state.
                        // But here we have real DB IDs.
                        // We need a mapping from temp unit ID (from form state) to real DB ID.
                        // However, the simplistic approach uses the first unit. 
                        // To support multi-unit import correctly, we'd need to Map data.units (temp IDs) to unitsRes (real IDs).
                        // For now, let's stick to the existing logic which defaults to mainUnitId (first one).
                        // Or try to match by name if possible.
                        const matchedUnit = unitsRes.find((u: any) =>
                            data.units.find((du: any) => String(du.id) === String(colab.unidade_id))?.name === u.nome
                        );
                        if (matchedUnit) targetUnitId = matchedUnit.id;
                    }

                    return {
                        nome: colab.nome,
                        email: colab.email,
                        unidade_id: targetUnitId,
                        cargo_id: rId,
                        cpf: colab.cpf,
                        data_nascimento: colab.dataNascimento,
                        sexo: colab.sexo,
                        data_desligamento: colab.dataDesligamento
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
            setIsModalOpen(false);

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
                <div className="animate-in fade-in zoom-in-95 duration-500">
                    <header className="mb-10 text-center">
                        <h1 className="text-3xl font-bold text-slate-800 mb-3">Novo Cadastro</h1>
                        <p className="text-slate-500 text-lg">Centralize a gestão de empresas e colaboradores</p>
                    </header>

                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden flex flex-col h-64 w-full max-w-md justify-between"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-[#35b6cf]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#35b6cf]/10 transition-colors" />

                            <div className="w-16 h-16 rounded-2xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <FilePlus size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#35b6cf] transition-colors">
                                    Cadastrar Nova Empresa
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Adicione uma nova empresa, configure suas unidades, setores e importe colaboradores.
                                </p>
                            </div>

                            <div className="absolute bottom-8 right-8 text-slate-300 group-hover:text-[#35b6cf] group-hover:translate-x-1 transition-all">
                                <ChevronRight size={24} />
                            </div>
                        </button>
                    </div>
                </div>

                <CompanyRegistrationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleRegisterCompany}
                    isLoading={isLoading}
                />
            </div>
        </DashboardLayout>
    );
};

