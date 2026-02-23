// Importações necessárias do React e ícones do Lucide
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X,          // Ícone de fechar
    Search,     // Ícone de busca
    ChevronDown,// Ícone de seta do dropdown
    ChevronUp,  // Ícone de seta para cima
    Upload,     // Ícone de upload de imagem
    BookOpen,   // Ícone do manual
    LogIn,      // Ícone de login
    Building2,  // Ícone de empresa
    Users,      // Ícone de colaboradores
    ClipboardList, // Ícone de formulários
    BarChart3,  // Ícone de relatórios
    CalendarDays, // Ícone de agenda
    UserCog,    // Ícone de perfil
    Coins,      // Ícone de tokens
    ChevronRight, // Ícone de seta direita
} from 'lucide-react';

// ─────────────────────────────────────────────
// TIPOS E INTERFACES
// ─────────────────────────────────────────────

// Propriedades aceitas pelo componente HelpPanel
interface HelpPanelProps {
    isOpen: boolean;       // Controla se o painel está visível
    onClose: () => void;   // Callback chamado ao fechar o painel
}

// Estrutura de uma dúvida comum
interface FAQ {
    question: string; // Texto da pergunta
    answer: string;   // Texto da resposta
}

// Estrutura de um campo de imagem dentro do tutorial
interface ImageField {
    id: string;    // Identificador único do campo
    label: string; // Legenda descritiva da imagem
}

// Estrutura de uma seção do tutorial
interface TutorialSection {
    id: string;          // Identificador único (usado para âncora de scroll)
    title: string;       // Título da seção
    icon: React.ReactNode; // Ícone ilustrativo da seção
    content: string[];   // Array de parágrafos do conteúdo
    images: ImageField[]; // Campos de upload de imagem dessa seção
    subsections?: {       // Subseções opcionais
        title: string;
        content: string[];
        images?: ImageField[];
    }[];
}

// ─────────────────────────────────────────────
// DADOS: DÚVIDAS FREQUENTES
// ─────────────────────────────────────────────

// Lista estática de perguntas e respostas frequentes
const FAQ_LIST: FAQ[] = [
    {
        question: 'Como adicionar uma nova empresa?',
        answer:
            'Acesse a aba "Empresas" no menu lateral, clique no botão "+ Nova Empresa" no canto superior direito e preencha o formulário com o nome, CNPJ, endereço e logo da empresa. Após preencher todos os campos obrigatórios, clique em "Salvar".',
    },
    {
        question: 'Como convidar um colaborador para responder um formulário?',
        answer:
            'Dentro da empresa desejada, acesse a aba "Colaboradores". Clique em "+ Adicionar Colaborador", preencha os dados (nome, CPF, e-mail, setor, cargo, unidade) e salve. O colaborador receberá um link para acessar o formulário.',
    },
    {
        question: 'Como visualizar os resultados de um formulário?',
        answer:
            'Na aba "Formulários", clique no card do formulário desejado. Uma janela de detalhes será exibida com gráficos, métricas de participação e resumo por dimensão HSE. Você também pode gerar um relatório em PDF.',
    },
    {
        question: 'O que são tokens e como são usados?',
        answer:
            'Tokens são a moeda interna do sistema. Cada formulário enviado consome uma quantidade de tokens. Você pode verificar seu saldo na Carteira do Dashboard. Entre em contato com o suporte para adquirir mais tokens.',
    },
    {
        question: 'Como alterar minha foto de perfil?',
        answer:
            'Clique no seu avatar no canto inferior da sidebar para acessar a página de Perfil. Em seguida, clique na câmera sobre a foto atual, selecione uma imagem do seu computador e aguarde o envio automático.',
    },
    {
        question: 'Posso exportar relatórios em PDF?',
        answer:
            'Sim! Dentro dos detalhes de qualquer formulário respondido, há o botão "Gerar Relatório PDF". Ele cria um relatório HSE completo com gráficos, ranking e análise por dimensão, pronto para compartilhamento.',
    },
    {
        question: 'Como funciona a Agenda?',
        answer:
            'A Agenda exibe todos os exames periódicos e compromissos dos colaboradores. Os eventos são agendados a partir dos dados de admissão e tipo de exame. Você pode visualizar por dia, semana ou mês usando os controles no topo.',
    },
    {
        question: 'Como editar as perguntas de um formulário?',
        answer:
            'Acesse "Formulários", clique nos três pontos do formulário desejado e selecione "Editar Formulário". Você pode reordenar as perguntas, alterar textos e salvar as mudanças.',
    },
];

// ─────────────────────────────────────────────
// DADOS: SEÇÕES DO TUTORIAL
// ─────────────────────────────────────────────

// Conteúdo completo de cada seção do manual
const TUTORIAL_SECTIONS: TutorialSection[] = [
    // ── 1. Primeiros Passos ──────────────────
    {
        id: 'primeiros-passos',
        title: '1. Primeiros Passos e Login',
        icon: <LogIn size={18} />,
        content: [
            'Bem-vindo ao Gama Psicossocial! Este manual irá guiá-lo por todas as funcionalidades do sistema, desde o primeiro acesso até a geração de relatórios avançados.',
            'Para acessar o sistema, abra o navegador e acesse a URL fornecida pela equipe de implantação. Você encontrará a tela de login com campos para e-mail e senha.',
            'Caso seja seu primeiro acesso, utilize o e-mail e a senha temporária enviados para você. Após o login, o sistema solicitará que você altere sua senha e complete seu perfil.',
            'Se esquecer sua senha, clique em "Esqueci minha senha" na tela de login. Um e-mail com instruções será enviado para o endereço cadastrado. Verifique a caixa de spam caso não receba o e-mail em alguns minutos.',
        ],
        images: [
            { id: 'img-login-01', label: 'Tela de login do sistema' },
            { id: 'img-login-02', label: 'Formulário de redefinição de senha' },
            { id: 'img-login-03', label: 'Tela de boas-vindas no primeiro acesso' },
        ],
        subsections: [
            {
                title: 'Navegando pelo Dashboard',
                content: [
                    'Após o login, você é direcionado ao Dashboard — a tela principal do sistema. Aqui você encontra uma visão geral com indicadores-chave (KPIs) como: número de empresas cadastradas, colaboradores ativos, formulários enviados e saldo de tokens disponíveis.',
                    'A sidebar à esquerda apresenta os menus principais: Dashboard, Empresas e Configurações. O avatar no canto inferior esquerdo leva à página de perfil do usuário. Clique em qualquer item do menu para navegar entre as seções.',
                    'No topo da página de cada seção, há um título descritivo e botões de ação contextual (como "+ Nova Empresa" ou "Exportar"). Familiarize-se com esses elementos para acelerar sua produtividade.',
                ],
                images: [{ id: 'img-dashboard-01', label: 'Visão geral do Dashboard com KPIs' }],
            },
        ],
    },

    // ── 2. Empresas ──────────────────────────
    {
        id: 'empresas',
        title: '2. Gerenciando Empresas',
        icon: <Building2 size={18} />,
        content: [
            'A seção "Empresas" é o coração do sistema. Aqui você cadastra e gerencia todas as organizações cliente. Cada empresa é um contêiner que agrupa colaboradores, formulários e resultados de forma isolada.',
            'Para acessar, clique em "Empresas" na sidebar. Você verá cards para cada empresa cadastrada, com logo, nome, quantidade de colaboradores e número de formulários enviados.',
        ],
        images: [
            { id: 'img-emp-01', label: 'Página de listagem de Empresas' },
        ],
        subsections: [
            {
                title: 'Cadastrando uma Nova Empresa',
                content: [
                    'Clique no botão "+ Nova Empresa" no canto superior direito. Um modal (janela) abrirá com os campos de cadastro:',
                    '• Nome da Empresa (obrigatório)',
                    '• CNPJ (obrigatório)',
                    '• Segmento/Setor de atuação',
                    '• Endereço completo',
                    '• Logo da empresa (clique no campo de imagem para fazer upload)',
                    'Após preencher todos os campos, clique em "Salvar". A empresa aparecerá na listagem. Caso o logo não carregue corretamente, verifique se a imagem está no formato JPG, PNG ou GIF e com tamanho máximo de 2MB.',
                ],
                images: [
                    { id: 'img-emp-02', label: 'Modal de cadastro de nova empresa' },
                    { id: 'img-emp-03', label: 'Upload do logo da empresa' },
                ],
            },
            {
                title: 'Editando e Excluindo Empresas',
                content: [
                    'Para editar uma empresa, clique nos três pontos (⋮) no canto do card e selecione "Editar". O mesmo modal de cadastro abrirá com os dados preenedos para edição.',
                    'Para excluir, clique nos três pontos e selecione "Excluir". Atenção: a exclusão remove permanentemente a empresa e todos os dados vinculados a ela. Confirme apenas se tiver certeza.',
                ],
                images: [{ id: 'img-emp-04', label: 'Menu de opções do card de empresa' }],
            },
            {
                title: 'Filtrando e Ordenando Empresas',
                content: [
                    'Use o dropdown de filtros no topo da listagem para ordenar as empresas por: data de cadastro (mais recentes/antigas), número de colaboradores ou número de formulários enviados. Isso facilita a localização de empresas em listas extensas.',
                ],
                images: [],
            },
        ],
    },

    // ── 3. Colaboradores ─────────────────────
    {
        id: 'colaboradores',
        title: '3. Cadastro de Colaboradores',
        icon: <Users size={18} />,
        content: [
            'Colaboradores são os funcionários das empresas que irão responder aos formulários de avaliação psicossocial. Cada colaborador está vinculado a uma empresa, setor, unidade e cargo específicos.',
            'Para acessar os colaboradores de uma empresa, vá em "Empresas", clique no card da empresa desejada e acesse a aba "Colaboradores".',
        ],
        images: [
            { id: 'img-col-01', label: 'Aba de Colaboradores dentro de uma empresa' },
        ],
        subsections: [
            {
                title: 'Adicionando um Colaborador',
                content: [
                    'Clique em "+ Adicionar Colaborador". Preencha os campos do formulário:',
                    '• Nome completo (obrigatório)',
                    '• CPF (obrigatório)',
                    '• E-mail (usado para envio de links do formulário)',
                    '• Setor (selecione da lista cadastrada)',
                    '• Cargo (selecione da lista cascata)',
                    '• Unidade (filial/unidade da empresa)',
                    '• Data de admissão',
                    '• Tipo de exame periódico',
                    'Após salvar, o colaborador estará disponível para ser incluído em campanhas de formulários.',
                ],
                images: [
                    { id: 'img-col-02', label: 'Modal de adicionar colaborador' },
                    { id: 'img-col-03', label: 'Campos de setor, cargo e unidade' },
                ],
            },
            {
                title: 'Gerenciando a Lista de Colaboradores',
                content: [
                    'A tabela de colaboradores exibe: nome, CPF, cargo, setor, unidade e status de participação nos formulários mais recentes.',
                    'Você pode editar os dados de qualquer colaborador clicando no ícone de lápis ao lado do nome. Para remover, use o ícone de lixeira. Ao remover, o histórico de respostas do colaborador é mantido por questões de auditoria.',
                    'Use a barra de pesquisa acima da tabela para localizar um colaborador específico pelo nome ou CPF.',
                ],
                images: [{ id: 'img-col-04', label: 'Tabela de colaboradores com busca ativa' }],
            },
        ],
    },

    // ── 4. Formulários HSE ───────────────────
    {
        id: 'formularios',
        title: '4. Formulários e Pesquisas HSE',
        icon: <ClipboardList size={18} />,
        content: [
            'Os Formulários de Avaliação Psicossocial (baseados no modelo HSE — Health and Safety Executive) são o principal instrumento de coleta de dados do sistema. Eles avaliam seis dimensões de bem-estar no trabalho: Demandas, Controle, Suporte, Relacionamentos, Função e Mudança.',
            'Para visualizar os formulários de uma empresa, navegue até o card da empresa e acesse a aba "Formulários".',
        ],
        images: [
            { id: 'img-form-01', label: 'Aba de Formulários da empresa' },
        ],
        subsections: [
            {
                title: 'Enviando uma Nova Pesquisa',
                content: [
                    'Clique em "+ Nova Pesquisa". Selecione quais colaboradores irão participar (você pode selecionar todos ou apenas um grupo específico por setor/unidade). Defina um título para a campanha e a data limite de resposta.',
                    'Após confirmar, o sistema gerará links únicos para cada colaborador e consumirá os tokens correspondentes ao número de participantes selecionados.',
                    'Cada formulário enviado consome 1 token por colaborador. Verifique seu saldo de tokens no Dashboard antes de iniciar grandes campanhas.',
                ],
                images: [
                    { id: 'img-form-02', label: 'Modal de configuração da nova pesquisa' },
                    { id: 'img-form-03', label: 'Seleção de colaboradores participantes' },
                ],
            },
            {
                title: 'Editando um Formulário',
                content: [
                    'Para editar as perguntas de um formulário existente, clique nos três pontos do card e selecione "Editar Formulário". Você pode:',
                    '• Alterar o texto das perguntas',
                    '• Reordenar as questões arrastando e soltando',
                    '• Ativar ou desativar perguntas específicas',
                    '• Associar cada pergunta a uma dimensão HSE',
                    'As edições são salvas automaticamente conforme você modifica os campos.',
                ],
                images: [{ id: 'img-form-04', label: 'Tela de edição do formulário' }],
            },
            {
                title: 'Monitorando a Participação',
                content: [
                    'Clique em qualquer card de formulário já enviado para abrir o modal de detalhes. Você verá:',
                    '• Total de convidados vs. respondentes',
                    '• Percentual de participação (taxa de resposta)',
                    '• Lista de colaboradores que ainda não responderam',
                    '• Data do último acesso ao formulário',
                    'Use essas informações para fazer um follow-up com colaboradores que ainda não responderam, aumentando a taxa de participação.',
                ],
                images: [
                    { id: 'img-form-05', label: 'Modal de detalhes de participação' },
                    { id: 'img-form-06', label: 'Indicadores de participação por colaborador' },
                ],
            },
            {
                title: 'Formulário Público (Link para Colaborador)',
                content: [
                    'Cada colaborador recebe um link único para responder o formulário. Ao abrir o link, o colaborador verá uma tela simplificada com as perguntas organizadas por seção.',
                    'O colaborador responde em uma escala de 1 a 5 para cada afirmação. As respostas são salvas automaticamente a cada avanço de página, evitando perda de dados.',
                    'Após enviar, o colaborador recebe uma mensagem de confirmação. As respostas ficam disponíveis imediatamente para análise no painel administrativo.',
                ],
                images: [{ id: 'img-form-07', label: 'Formulário público visto pelo colaborador' }],
            },
        ],
    },

    // ── 5. Relatórios ────────────────────────
    {
        id: 'relatorios',
        title: '5. Análise de Resultados e Relatórios',
        icon: <BarChart3 size={18} />,
        content: [
            'Após a coleta de respostas, o sistema oferece análises visuais e relatórios detalhados para apoiar a tomada de decisão e as intervenções de saúde ocupacional.',
            'Os resultados são apresentados em forma de gráficos de radar, barras e tabelas de ranking, permitindo uma visão comparativa entre dimensões, setores e colaboradores.',
        ],
        images: [
            { id: 'img-rel-01', label: 'Painel de resultados do formulário' },
        ],
        subsections: [
            {
                title: 'Interpretando o Gráfico de Radar HSE',
                content: [
                    'O gráfico de radar exibe os resultados médios para cada uma das seis dimensões HSE. Quanto mais próximo do centro estiver um ponto, maior é o risco psicossocial naquela dimensão.',
                    '• Demandas: volume e complexidade do trabalho',
                    '• Controle: autonomia e participação nas decisões',
                    '• Suporte: apoio de gestores e colegas',
                    '• Relacionamentos: qualidade das relações interpessoais',
                    '• Função: clareza do papel e responsabilidades',
                    '• Mudança: gestão e comunicação de mudanças organizacionais',
                    'Dimensões com pontuação baixa (abaixo de 3,0) indicam áreas prioritárias de intervenção.',
                ],
                images: [{ id: 'img-rel-02', label: 'Gráfico de radar com as seis dimensões HSE' }],
            },
            {
                title: 'Ranking de Performance',
                content: [
                    'O ranking exibe os colaboradores ordenados pela média geral de bem-estar. Isso auxilia no planejamento de ações individualizadas de suporte.',
                    'Colaboradores no quartil inferior (pontuação mais baixa) podem ser indicados para acompanhamento psicológico ou revisão de carga de trabalho.',
                ],
                images: [{ id: 'img-rel-03', label: 'Tabela de ranking de colaboradores' }],
            },
            {
                title: 'Gerando o Relatório PDF',
                content: [
                    'Nos detalhes de um formulário respondido, clique no botão "Gerar Relatório HSE PDF". O sistema irá compilar:',
                    '• Identificação da empresa e período da pesquisa',
                    '• Resultados por dimensão com gráfico de radar',
                    '• Ranking geral dos colaboradores',
                    '• Análise textual automática por dimensão',
                    '• Recomendações de intervenção baseadas nos resultados',
                    'O PDF é gerado e baixado automaticamente. Ele pode ser compartilhado com a equipe de RH ou gestores.',
                ],
                images: [{ id: 'img-rel-04', label: 'Botão de geração do relatório PDF' }],
            },
        ],
    },

    // ── 6. Agenda ────────────────────────────
    {
        id: 'agenda',
        title: '6. Agenda de Exames',
        icon: <CalendarDays size={18} />,
        content: [
            'A Agenda centraliza todos os exames periódicos e ocupacionais dos colaboradores de todas as empresas cadastradas. Ela é alimentada automaticamente com base nas datas de admissão e nos tipos de exame associados a cada colaborador.',
            'Para acessar, clique em "Agenda" no menu lateral (caso disponível) ou através do Dashboard.',
        ],
        images: [
            { id: 'img-agenda-01', label: 'Visualização mensal da Agenda' },
        ],
        subsections: [
            {
                title: 'Navegando pelos Eventos',
                content: [
                    'A agenda possui três modos de visualização: Mês, Semana e Dia. Use os botões no topo para alternar entre as views.',
                    'Clique em qualquer evento para ver os detalhes: nome do colaborador, empresa, tipo de exame e data de vencimento.',
                    'Eventos em vermelho indicam exames vencidos ou prestes a vencer nos próximos 30 dias. Eventos em verde estão em dia.',
                ],
                images: [
                    { id: 'img-agenda-02', label: 'Detalhes de um evento na agenda' },
                    { id: 'img-agenda-03', label: 'Legenda de cores dos eventos' },
                ],
            },
            {
                title: 'Configurando Tipos de Exame',
                content: [
                    'Os tipos de exame e suas periodicidades são configurados em "Configurações > Tipos de Exame". Lá você pode definir o intervalo em meses para cada tipo (ex: Admissional, Periódico Anual, Demissional, etc.).',
                    'Ao cadastrar um colaborador, você seleciona o tipo de exame aplicável, e a agenda calcula automaticamente a próxima data com base na admissão.',
                ],
                images: [{ id: 'img-agenda-04', label: 'Tela de configuração de tipos de exame' }],
            },
        ],
    },

    // ── 7. Perfil ────────────────────────────
    {
        id: 'perfil',
        title: '7. Configurações de Perfil',
        icon: <UserCog size={18} />,
        content: [
            'Na página de Perfil, você pode personalizar suas informações de usuário, alterar a senha e configurar preferências do sistema.',
            'Para acessar, clique no seu avatar ou nome no canto inferior da sidebar esquerda, ou navegue para "/profile".',
        ],
        images: [
            { id: 'img-perfil-01', label: 'Página de configurações do perfil' },
        ],
        subsections: [
            {
                title: 'Alterando Foto de Perfil',
                content: [
                    'Na página de perfil, clique no ícone de câmera sobre a foto atual (ou sobre o avatar padrão). Uma janela de seleção de arquivo abrirá.',
                    'Selecione uma imagem JPG ou PNG com no mínimo 200x200 pixels. A foto será carregada e salva automaticamente após a seleção.',
                    'A nova foto aparecerá na sidebar e no topo de todas as páginas do sistema.',
                ],
                images: [{ id: 'img-perfil-02', label: 'Campo de upload da foto de perfil' }],
            },
            {
                title: 'Alterando Senha',
                content: [
                    'Na seção "Segurança" da página de perfil, clique em "Alterar Senha". Você deverá informar sua senha atual (para segurança) e então a nova senha duas vezes para confirmação.',
                    'Use senhas com ao menos 8 caracteres, misturando letras maiúsculas, minúsculas, números e símbolos para garantir mais segurança.',
                ],
                images: [],
            },
            {
                title: 'Informações do Plano',
                content: [
                    'Na seção "Meu Plano", você visualiza o plano contratado (Mensal, Semestral ou Anual), a data de vencimento e o limite de tokens incluídos.',
                    'Para fazer upgrade ou renovar, entre em contato com o suporte comercial da Gama.',
                ],
                images: [{ id: 'img-perfil-03', label: 'Seção de informações do plano contratado' }],
            },
        ],
    },

    // ── 8. Tokens ────────────────────────────
    {
        id: 'tokens',
        title: '8. Tokens e Planos de Uso',
        icon: <Coins size={18} />,
        content: [
            'O sistema Gama Psicossocial opera com um modelo de tokens — cada envio de formulário para um colaborador consome um token. Isso garante um controle preciso sobre o uso do sistema.',
            'Seu saldo atual de tokens é exibido no card "Minha Carteira" no Dashboard principal.',
        ],
        images: [
            { id: 'img-token-01', label: 'Card de Minha Carteira no Dashboard' },
        ],
        subsections: [
            {
                title: 'Como os Tokens são Consumidos',
                content: [
                    'Cada formulário enviado para 1 colaborador = 1 token consumido.',
                    'Exemplo: Se você enviar uma pesquisa para 50 colaboradores de uma empresa, serão consumidos 50 tokens.',
                    'O consumo é registrado no momento do envio. Se um colaborador não responder, o token já foi consumido — não há reembolso automático.',
                    'O histórico de consumo pode ser acessado em "Configurações > Histórico de Tokens" (se disponível no seu plano).',
                ],
                images: [],
            },
            {
                title: 'Planos Disponíveis',
                content: [
                    'Existem três planos disponíveis no Gama Psicossocial:',
                    '• Plano Mensal: renovação a cada 30 dias',
                    '• Plano Semestral: 6 meses com desconto (R$5 recorrente)',
                    '• Plano Anual: maior economia com pagamento anual',
                    'Cada plano inclui uma quantidade base de tokens. Tokens extras podem ser adquiridos pontualmente com o suporte comercial.',
                    'Os tokens não utilizados NÃO acumulam entre períodos de renovação, exceto no plano anual. Verifique o regulamento do plano no seu contrato.',
                ],
                images: [{ id: 'img-token-02', label: 'Tabela comparativa dos planos disponíveis' }],
            },
            {
                title: 'Adquirindo Mais Tokens',
                content: [
                    'Se seu saldo estiver baixo, entre em contato com o suporte Gama pelo e-mail ou WhatsApp disponibilizados na página de perfil.',
                    'Tokens adicionais são adicionados manualmente pela equipe após a confirmação do pagamento.',
                ],
                images: [],
            },
        ],
    },
];

// ─────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────

// Componente para renderizar campos de upload de imagem dentro das seções
const ImageUploadField: React.FC<{ field: ImageField }> = ({ field }) => {
    // Estado para armazenar a URL da imagem após o upload
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Referência ao input de arquivo oculto
    const inputRef = useRef<HTMLInputElement>(null);

    // Função chamada quando o usuário seleciona um arquivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; // Pega o primeiro arquivo selecionado
        if (!file) return;                 // Sai caso nenhum arquivo seja selecionado

        // Cria uma URL temporária para preview da imagem selecionada
        const url = URL.createObjectURL(file);
        setPreviewUrl(url); // Atualiza o estado com a URL do preview
    };

    return (
        // Container do campo de upload com fundo cinza tracejado
        <div
            className="mt-3 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-[#0f978e]/50 transition-colors group"
            onClick={() => inputRef.current?.click()} // Clique no container aciona o input oculto
        >
            {/* Input de arquivo oculto */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"          // Aceita apenas imagens
                className="hidden"        // Oculto visualmente
                onChange={handleFileChange}
            />

            {previewUrl ? (
                // Se já há uma imagem, exibe o preview
                <div className="relative">
                    <img
                        src={previewUrl}
                        alt={field.label}
                        className="w-full h-48 object-cover"
                    />
                    {/* Overlay de edição ao hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
                        <Upload size={16} />
                        Trocar imagem
                    </div>
                </div>
            ) : (
                // Se não há imagem, exibe o placeholder de upload
                <div className="h-36 flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:text-[#0f978e] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-[#0f978e]/10 flex items-center justify-center transition-colors">
                        <Upload size={18} />
                    </div>
                    <div className="text-center">
                        {/* Legenda do campo de imagem */}
                        <p className="text-xs font-semibold">{field.label}</p>
                        <p className="text-[10px] mt-0.5 text-slate-300">Clique para fazer upload</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL: HelpPanel
// ─────────────────────────────────────────────

export const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
    // Estado da query de pesquisa digitada pelo usuário
    const [searchQuery, setSearchQuery] = useState('');

    // Controla quais perguntas do FAQ estão abertas (por índice)
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    // Controla se o dropdown de FAQs está aberto ou fechado
    const [isFaqOpen, setIsFaqOpen] = useState(false);

    // Índice da seção atualmente visível (para destacar no índice)
    const [activeSection, setActiveSection] = useState<string>('primeiros-passos');

    // Referência ao container de conteúdo para scroll
    const contentRef = useRef<HTMLDivElement>(null);

    // Fecha o painel ao pressionar ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose(); // Detecta tecla ESC e chama onClose
        };
        document.addEventListener('keydown', handler); // Registra o listener
        return () => document.removeEventListener('keydown', handler); // Limpa ao desmontar
    }, [onClose]);

    // Filtra as seções do tutorial com base na pesquisa do usuário
    const filteredSections = searchQuery.trim()
        ? TUTORIAL_SECTIONS.filter((section) => {
            // Verifica se o título, conteúdo principal ou subseções contêm o termo buscado
            const q = searchQuery.toLowerCase();
            const inTitle = section.title.toLowerCase().includes(q);
            const inContent = section.content.some((p) => p.toLowerCase().includes(q));
            const inSubsections = section.subsections?.some(
                (sub) =>
                    sub.title.toLowerCase().includes(q) ||
                    sub.content.some((p) => p.toLowerCase().includes(q))
            );
            return inTitle || inContent || inSubsections;
        })
        : TUTORIAL_SECTIONS; // Sem pesquisa, exibe todas as seções

    // Rola suavemente até uma seção ao clicar no índice
    const scrollToSection = useCallback((sectionId: string) => {
        const el = document.getElementById(`section-${sectionId}`); // Busca o elemento pelo ID
        if (el && contentRef.current) {
            // Calcula o offset relativo ao container de scroll
            const containerTop = contentRef.current.getBoundingClientRect().top;
            const elementTop = el.getBoundingClientRect().top;
            const offset = elementTop - containerTop;
            contentRef.current.scrollBy({ top: offset - 16, behavior: 'smooth' }); // Scroll suave
        }
        setActiveSection(sectionId); // Marca a seção como ativa no índice
    }, []);

    return (
        <>
            {/* ── Overlay escuro atrás do painel ── */}
            <div
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose} // Fecha ao clicar fora do painel
            />

            {/* ── Painel lateral direito ── */}
            <div
                className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full' // Desliza para dentro/fora da tela
                    }`}
                style={{ width: 'clamp(360px, 60vw, 100vw)' }} // 60% da largura da tela, mínimo 360px
            >
                {/* ── Cabeçalho do painel ── */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#0f978e]/5 to-white">
                    <div className="flex items-center gap-3">
                        {/* Ícone do manual */}
                        <div className="w-9 h-9 rounded-xl bg-[#0f978e] flex items-center justify-center shadow-md shadow-[#0f978e]/20">
                            <BookOpen size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Manual de Ajuda</h2>
                            <p className="text-[11px] text-slate-400">Guia completo do sistema Gama Psicossocial</p>
                        </div>
                    </div>
                    {/* Botão de fechar */}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Barra de Pesquisa — ocupa toda a largura do painel ── */}
                <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 bg-white">
                    <div className="relative">
                        {/* Ícone de busca dentro do input */}
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Pesquisar no manual..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} // Atualiza a query em tempo real
                            className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f978e]/30 focus:border-[#0f978e] focus:bg-white transition-all placeholder:text-slate-400"
                        />
                        {/* Botão de limpar pesquisa */}
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                    {/* Feedback de resultados da pesquisa */}
                    {searchQuery && (
                        <p className="text-[11px] text-slate-400 mt-1.5 pl-1">
                            {filteredSections.length === 0
                                ? 'Nenhum resultado encontrado.'
                                : `${filteredSections.length} seção(ões) encontrada(s).`}
                        </p>
                    )}
                </div>

                {/* ── Corpo: Sidebar Esquerda (Índice + FAQ) + Conteúdo ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ══════════════════════════════════════
                        COLUNA ESQUERDA: Índice de Navegação + FAQ
                    ══════════════════════════════════════ */}
                    <div className="hidden sm:flex flex-col w-60 flex-shrink-0 bg-slate-50 border-r border-slate-100 overflow-y-auto">

                        {/* ── Seção: Índice de navegação ── */}
                        <div className="flex-1 py-4 px-3">
                            {/* Label do índice */}
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2 mb-2">
                                Índice
                            </p>

                            {/* Botões de navegação, um por seção do tutorial */}
                            <div className="flex flex-col gap-0.5">
                                {TUTORIAL_SECTIONS.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)} // Rola até a seção ao clicar
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-[12px] font-medium transition-all ${activeSection === section.id
                                                ? 'bg-[#0f978e] text-white shadow-sm' // Ativo: fundo verde
                                                : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm' // Inativo: cinza
                                            }`}
                                    >
                                        {/* Ícone da seção */}
                                        <span className={`flex-shrink-0 ${activeSection === section.id ? 'text-white' : 'text-slate-400'}`}>
                                            {section.icon}
                                        </span>
                                        {/* Título sem o número do prefixo */}
                                        <span className="leading-tight">{section.title.replace(/^\d+\.\s/, '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Seção: Dúvidas Comuns (integrada na sidebar, abaixo do índice) ── */}
                        <div className="flex-shrink-0 border-t border-slate-200">
                            {/* Cabeçalho colapsável das dúvidas comuns */}
                            <button
                                onClick={() => setIsFaqOpen((v) => !v)} // Alterna abrir/fechar
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {/* Ícone de balão de chat */}
                                    <span className="text-[#0f978e] text-sm">💬</span>
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        Dúvidas Comuns
                                    </span>
                                    {/* Badge com o total de FAQs */}
                                    <span className="px-1.5 py-0.5 rounded-full bg-[#0f978e]/10 text-[9px] font-bold text-[#0f978e]">
                                        {FAQ_LIST.length}
                                    </span>
                                </div>
                                {/* Ícone de seta que rotaciona */}
                                <span className="text-slate-400">
                                    {isFaqOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </span>
                            </button>

                            {/* Lista de perguntas e respostas — colapsável */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isFaqOpen ? 'max-h-[400px]' : 'max-h-0'
                                    }`}
                            >
                                <div className="overflow-y-auto max-h-[400px] bg-white">
                                    {FAQ_LIST.map((faq, index) => (
                                        // Item individual do FAQ
                                        <div key={index} className="border-t border-slate-100 first:border-t-0">
                                            {/* Botão de toggle da pergunta */}
                                            <button
                                                onClick={() =>
                                                    setOpenFaqIndex(openFaqIndex === index ? null : index) // Toggle individual
                                                }
                                                className="w-full flex items-start justify-between gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                            >
                                                <span className="text-[11px] font-medium text-slate-700 leading-tight">
                                                    {faq.question}
                                                </span>
                                                {/* Ícone de seta da pergunta */}
                                                <span className="flex-shrink-0 mt-0.5">
                                                    {openFaqIndex === index ? (
                                                        <ChevronUp size={12} className="text-[#0f978e]" />
                                                    ) : (
                                                        <ChevronRight size={12} className="text-slate-400" />
                                                    )}
                                                </span>
                                            </button>

                                            {/* Resposta expansível */}
                                            <div
                                                className={`overflow-hidden transition-all duration-200 ${openFaqIndex === index ? 'max-h-64' : 'max-h-0'
                                                    }`}
                                            >
                                                <p className="px-4 pb-3 text-[11px] text-slate-500 leading-relaxed border-l-2 border-[#0f978e]/30 ml-4 mr-2">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════
                        COLUNA DIREITA: Conteúdo do Tutorial
                    ══════════════════════════════════════ */}
                    <div
                        ref={contentRef}
                        className="flex-1 overflow-y-auto px-7 py-5"
                    >
                        {/* Estado vazio: nenhum resultado na pesquisa */}
                        {filteredSections.length === 0 && searchQuery && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Search size={32} className="mb-3 opacity-30" />
                                <p className="text-sm font-medium">Nenhum resultado para "{searchQuery}"</p>
                                <p className="text-xs mt-1">Tente um termo diferente</p>
                            </div>
                        )}

                        {/* Renderiza cada seção filtrada do tutorial */}
                        {filteredSections.map((section) => (
                            <div
                                key={section.id}
                                id={`section-${section.id}`} // Âncora para scroll pelo índice
                                className="mb-10 scroll-mt-4"
                            >
                                {/* Cabeçalho da seção com ícone e título */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-[#0f978e]/10 flex items-center justify-center text-[#0f978e] flex-shrink-0">
                                        {section.icon}
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">{section.title}</h3>
                                </div>

                                {/* Parágrafos do conteúdo principal */}
                                <div className="space-y-2.5">
                                    {section.content.map((paragraph, pIdx) => (
                                        <p key={pIdx} className="text-[13px] text-slate-600 leading-relaxed">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                {/* Campos de upload de imagem da seção principal */}
                                {section.images.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 mt-4">
                                        {section.images.map((img) => (
                                            <ImageUploadField key={img.id} field={img} />
                                        ))}
                                    </div>
                                )}

                                {/* Subseções vinculadas à seção atual */}
                                {section.subsections?.map((sub, subIdx) => (
                                    <div key={subIdx} className="mt-6 pl-4 border-l-2 border-slate-100">
                                        {/* Título da subseção */}
                                        <h4 className="text-sm font-bold text-slate-800 mb-2.5">{sub.title}</h4>

                                        {/* Parágrafos da subseção */}
                                        <div className="space-y-2">
                                            {sub.content.map((paragraph, pIdx) => (
                                                <p key={pIdx} className="text-[13px] text-slate-600 leading-relaxed">
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>

                                        {/* Campos de upload de imagem da subseção */}
                                        {sub.images && sub.images.length > 0 && (
                                            <div className="grid grid-cols-1 gap-3 mt-3">
                                                {sub.images.map((img) => (
                                                    <ImageUploadField key={img.id} field={img} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Linha divisória entre seções */}
                                <div className="mt-8 border-t border-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
