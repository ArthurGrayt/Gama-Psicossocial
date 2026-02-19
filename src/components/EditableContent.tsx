
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

interface EditableContentProps {
    section: string;
    contentKey: string;
    defaultContent: string;
    type?: 'text' | 'image' | 'rich-text';
    className?: string; // Classes para o elemento final (h1, p, img)
    tagName?: keyof React.JSX.IntrinsicElements; // 'h1', 'p', 'span', 'div'
    isEditing: boolean;
    alt?: string; // Para imagens
    onSave?: (value: string) => void;
}

export const EditableContent: React.FC<EditableContentProps> = ({
    section,
    contentKey,
    defaultContent,
    type = 'text',
    className = '',
    tagName = 'div',
    isEditing,
    alt = '',
    onSave
}) => {
    const [content, setContent] = useState(defaultContent);
    const [tempValue, setTempValue] = useState(defaultContent); // Valor enquanto edita
    const [isInitialLoading, setIsInitialLoading] = useState(true); // Evita flicker do defaultContent
    const [isUploading, setIsUploading] = useState(false); // Status de upload de imagem
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Carregar conteúdo do Supabase ao montar
    useEffect(() => {
        fetchContent();
    }, [section, contentKey]);

    // Lógica de Salvamento Automático (Debounce)
    useEffect(() => {
        // Não salva durante o carregamento inicial ou se for imagem (imagem salva no upload)
        if (type === 'image' || tempValue === content) return;

        const timer = setTimeout(() => {
            handleSave();
        }, 1000); // Salva após 1 segundo de inatividade

        return () => clearTimeout(timer);
    }, [tempValue]);

    const fetchContent = async () => {
        try {
            const { data, error } = await supabase
                .from('site_content')
                .select('content')
                .eq('section', section)
                .eq('key', contentKey)
                .maybeSingle();

            if (data) {
                setContent(data.content);
                setTempValue(data.content);
            } else if (!error) {
                // Se não existir, usa o default
                setContent(defaultContent);
                setTempValue(defaultContent);
            }
        } catch (err) {
            console.error('Erro ao buscar conteúdo:', err);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const handleSave = async (newValue?: string) => {
        const valueToSave = newValue !== undefined ? newValue : tempValue;

        // Verifica se realmente mudou em relação ao que está no banco (contentState)
        if (valueToSave === content && newValue === undefined) return;

        try {
            const { error } = await supabase
                .from('site_content')
                .upsert({
                    section,
                    key: contentKey,
                    content: valueToSave,
                    type,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'section,key' });

            if (error) throw error;

            setContent(valueToSave);
            if (onSave) onSave(valueToSave);
            console.log(`[${section}:${contentKey}] Salvo instantaneamente!`);
        } catch (err) {
            console.error('Erro ao salvar conteúdo:', err);
        }
    };

    // Lógica de Upload de Imagem
    const handleImageClick = () => {
        if (isEditing && !isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Gerar nome único para o arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${section}_${contentKey}_${Date.now()}.${fileExt}`;
            const filePath = `landing-page/${fileName}`;

            // 2. Upload para o bucket "data"
            const { error: uploadError } = await supabase.storage
                .from('data')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('data')
                .getPublicUrl(filePath);

            // 4. Salvar a URL na tabela site_content
            await handleSave(publicUrl);

            alert('Imagem atualizada com sucesso!');
        } catch (err: any) {
            console.error('Erro no upload:', err);
            alert(`Erro ao enviar imagem: ${err.message || 'Verifique as permissões de Storage.'}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Renderização para IMAGEM
    if (type === 'image') {
        return (
            <div
                className={`relative group ${isEditing ? 'cursor-pointer hover:ring-4 ring-primary/50 rounded-lg' : ''}`}
                onClick={handleImageClick}
            >
                {/* Input de arquivo escondido */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                <img
                    src={content}
                    alt={alt}
                    className={`${className} ${isUploading ? 'opacity-50 grayscale' : ''}`}
                />

                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="material-symbols-outlined text-white text-3xl mb-2">
                            {isUploading ? 'sync' : 'upload'}
                        </span>
                        <span className="text-white font-bold bg-black/50 px-3 py-1 rounded text-sm">
                            {isUploading ? 'Enviando...' : 'Clique para substituir'}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    // Renderização para TEXTO / RICH-TEXT
    const Tag = tagName as any;

    if (isEditing) {
        return (
            <Tag className={className}>
                <textarea
                    className="w-full bg-yellow-50 border border-yellow-300 rounded p-1 text-inherit font-inherit focus:outline-none focus:ring-2 focus:ring-primary h-auto resize-none overflow-hidden"
                    value={tempValue}
                    onChange={(e) => {
                        setTempValue(e.target.value);
                        // Auto-resize do textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onBlur={() => handleSave()}
                    onClick={(e: any) => e.stopPropagation()} // Evita triggers indesejados
                    style={{ minHeight: '1.5em' }}
                />
            </Tag>
        );
    }

    // Exibir Skeleton UI durante o carregamento inicial
    if (isInitialLoading) {
        if (type === 'image') {
            return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} style={{ minHeight: '100px' }} />;
        }
        return <span className="animate-pulse bg-slate-100 rounded px-4 h-[1.2em] inline-block w-full opacity-50" />;
    }

    return (
        <Tag className={className}>
            {content}
        </Tag>
    );
};
