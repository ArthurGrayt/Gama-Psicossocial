import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImportCollaboratorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (collaborators: any[]) => void;
}

export const ImportCollaboratorsModal: React.FC<ImportCollaboratorsModalProps> = ({ isOpen, onClose, onImport }) => {
    if (!isOpen) return null;

    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const parseDate = (dateStr: any): string => {
        if (!dateStr) return '';

        // If it's already a Date object
        if (dateStr instanceof Date) {
            return dateStr.toISOString().split('T')[0];
        }

        const str = String(dateStr).trim();
        if (!str) return '';

        // DD/MM/YYYY or DD-MM-YYYY
        const ddmmyyyyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (ddmmyyyyMatch) {
            const [, day, month, year] = ddmmyyyyMatch;
            // Pad with 0 if needed
            const d = day.padStart(2, '0');
            const m = month.padStart(2, '0');
            return `${year}-${m}-${d}`;
        }

        // YYYY-MM-DD
        const yyyymmddMatch = str.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
        if (yyyymmddMatch) {
            return str.replace(/\//g, '-');
        }

        // Excel serial number
        if (!isNaN(Number(str))) {
            const excelDate = new Date((Number(str) - 25569) * 86400 * 1000);
            return excelDate.toISOString().split('T')[0];
        }

        return '';
    };

    const processFile = async (file: File) => {
        setIsLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    throw new Error("A planilha está vazia ou não pôde ser lida.");
                }

                // Filtrar e Mapear dados
                // Mantendo a lógica de filtrar categoria 101 se necessário, 
                // mas como estamos num contexto mais geral, vamos importar tudo que tiver Nome e CPF/Cargo

                const processed = data
                    .filter(row => {
                        // Filtro opcional: Se houver coluna categoria, filtrar 101. 
                        // Se não houver coluna, assume que é para importar.
                        const cat = row['Código da Categoria'] || row['cod_categoria'];
                        if (cat && String(cat) !== '101') return false;
                        return true;
                    })
                    .map(row => {
                        return {
                            nome: String(row['Nome do Trabalhador'] || row['Nome'] || '').trim(),
                            cpf: String(row['CPF do Trabalhador'] || row['CPF'] || '').replace(/\D/g, ''),
                            dataNascimento: parseDate(row['Data de Nascimento']),
                            sexo: row['Sexo'] || '',
                            cargo: String(row['Cargo'] || row['Função'] || '').trim(),
                            setor: String(row['Setor'] || row['Departamento'] || 'Geral').trim(),
                            dataDesligamento: parseDate(row['Data de Desligamento']) || null,
                            email: '', // Planilha geralmente não tem email pessoal, ou tem? Se tiver, mapear.
                            telefone: ''
                        };
                    })
                    .filter(c => {
                        // 1. Validação básica: Nome e Cargo obrigatórios
                        if (!c.nome || !c.cargo) return false;

                        // 2. Filtro de Desligamento: Se tiver data de desligamento, ignorar
                        if (c.dataDesligamento) return false;

                        return true;
                    });

                if (processed.length === 0) {
                    throw new Error("Nenhum colaborador válido encontrado. Verifique as colunas 'Nome do Trabalhador' e 'Cargo'.");
                }

                onImport(processed);
                onClose();

            } catch (err: any) {
                console.error("Erro ao importar:", err);
                setError(err.message || "Erro ao processar o arquivo.");
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Erro ao ler o arquivo.");
            setIsLoading(false);
        };
        reader.readAsBinaryString(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    return (
        // Alterado: Z-index 9999, items-end para bottom sheet no mobile, p-0 no mobile
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">
            <div
                // Alterado: Backdrop mais escuro (60%) e blur-md
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />
            {/* Container do Modal - Strict Mobile Pattern */}
            <div
                className="relative bg-white rounded-t-[2rem] md:rounded-2xl w-full h-[94dvh] md:h-auto md:max-w-xl md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden isolation-isolate animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >

                {/* Header com padding generoso px-6 py-5 e bg-white */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileSpreadsheet size={20} className="text-emerald-500" />
                        Importar Colaboradores
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div
                        className={`
                            relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
                            ${dragActive
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            onChange={handleChange}
                            accept=".xlsx, .xls, .csv"
                            disabled={isLoading}
                        />

                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            {isLoading ? (
                                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Upload size={32} />
                            )}
                        </div>

                        <h4 className="text-lg font-bold text-slate-700 mb-2">
                            {isLoading ? 'Processando...' : 'Clique ou arraste sua planilha'}
                        </h4>
                        <p className="text-sm text-slate-500">
                            Suportamos arquivos .xlsx e .csv
                        </p>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-2 hover:underline">
                            <Download size={16} />
                            Baixar modelo padrão
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                </div>
            </div>
        </div>
    );
};
