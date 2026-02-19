import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Esté componente define as ações individuais dentro do dropdown
interface DropdownAction {
    label: string; // Texto exibido para a ação
    onClick: () => void; // Função executada ao clicar
    icon?: LucideIcon; // Ícone opcional da biblioteca lucide-react
    variant?: 'default' | 'danger'; // Variante visual (padrão ou perigo/vermelho)
    show?: boolean; // Controle condicional para exibir ou não a ação
}

// Props para o componente principal de Dropdown
interface DropdownProps {
    actions: DropdownAction[]; // Lista de ações disponíveis
    trigger?: React.ReactNode; // Elemento customizado para acionar o menu
    triggerIcon?: LucideIcon; // Ícone para o botão padrão de acionamento
    align?: 'left' | 'right'; // Alinhamento do menu em relação ao botão
    className?: string; // Classes CSS adicionais
}

/**
 * Componente de Dropdown padronizado seguindo a identidade visual do app.
 * Utiliza createPortal para garantir que o menu flutue corretamente sobre outros elementos.
 */
export const Dropdown: React.FC<DropdownProps> = ({
    actions,
    trigger,
    triggerIcon: TriggerIcon = MoreHorizontal,
    align = 'right',
    className = ""
}) => {
    // Estado para controlar se o menu está aberto
    const [isOpen, setIsOpen] = useState(false);
    // Estado para armazenar a posição calculada do menu na tela
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Referências para o botão e para o menu (necessário para detecção de clique externo)
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Alterna o estado de abertura e calcula a posição do menu
    const toggle = (e: React.MouseEvent) => {
        // Previne a propagação para evitar eventos indesejados em elementos pai
        e.stopPropagation();

        if (isOpen) {
            setIsOpen(false);
        } else {
            // Obtém as coordenadas do botão acionador
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) {
                // Define a posição baseada no scroll atual da página
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: align === 'right'
                        ? rect.right + window.scrollX
                        : rect.left + window.scrollX
                });
                setIsOpen(true);
            }
        }
    };

    // Efeito para fechar o menu ao clicar fora dele ou redimensionar a janela
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Se o clique não foi no menu nem no botão, fecha o menu
            if (menuRef.current && !menuRef.current.contains(target) &&
                triggerRef.current && !triggerRef.current.contains(target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            // Adiciona ouvintes de eventos quando o menu está aberto
            document.addEventListener('mousedown', handleClickOutside);
            // Fecha ao rolar ou redimensionar para evitar desalinhamento do portal
            window.addEventListener('scroll', () => setIsOpen(false), true);
            window.addEventListener('resize', () => setIsOpen(false));
        }

        // Limpeza dos ouvintes ao fechar ou desmontar o componente
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', () => setIsOpen(false), true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    // Filtra as ações que devem ser exibidas
    const visibleActions = actions.filter(action => action.show !== false);

    // Se não houver ações para mostrar, não renderiza nada
    if (visibleActions.length === 0) return null;

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Botão de Acionamento (Trigger) */}
            <button
                ref={triggerRef}
                onClick={toggle}
                className={`flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm ${isOpen ? 'bg-slate-50 text-slate-600 border-slate-300' : ''}`}
            >
                {/* Renderiza o trigger customizado ou o ícone padrão */}
                {trigger || <TriggerIcon size={20} />}
            </button>

            {/* Menu Dropdown renderizado via Portal para ignorar contêineres com overflow:hidden */}
            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[10000] min-w-[200px] bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        top: `${position.top + 8}px`,
                        // Lógica de posicionamento baseada no alinhamento (left ou right)
                        left: align === 'right' ? 'auto' : `${position.left}px`,
                        right: align === 'right' ? `${window.innerWidth - position.left}px` : 'auto'
                    }}
                >
                    <div className="py-1.5">
                        {visibleActions.map((action, index) => (
                            <React.Fragment key={index}>
                                {/* Botão de cada item do menu */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-semibold flex items-center gap-3 transition-all
                                        ${action.variant === 'danger'
                                            ? 'text-rose-500 hover:bg-rose-50'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#35b6cf]'}`}
                                >
                                    {/* Ícone opcional da ação */}
                                    {action.icon && (
                                        <action.icon
                                            size={18}
                                            strokeWidth={2.2}
                                            className={action.variant === 'danger' ? 'text-rose-500' : 'text-slate-400 group-hover:text-[#35b6cf]'}
                                        />
                                    )}
                                    <span className="flex-1">{action.label}</span>
                                </button>
                                {/* Divisor horizontal entre grupos de ações (ex: entre padrão e exclusão) */}
                                {index < visibleActions.length - 1 && action.variant !== visibleActions[index + 1]?.variant && (
                                    <div className="border-t border-slate-50 my-1 mx-2" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
