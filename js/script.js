// =========================================================
// 0. FUNÇÃO GLOBAL PARA MODAL DE ALERTA
// =========================================================
function mostrarAlerta(mensagem, titulo = "Aviso") {
    return new Promise((resolve) => {
        const tpl = document.getElementById('tpl-modal-alerta');
        if (!tpl) {
            window.alert(mensagem);
            resolve();
            return;
        }

        // Fecha qualquer modal de correção/agendamento que esteja aberto por baixo
        const modalAnterior = document.querySelector('.modal-overlay');
        if (modalAnterior) modalAnterior.remove();

        const clone = tpl.content.cloneNode(true);
        document.body.appendChild(clone);
        
        const modal = document.querySelector('.modal-overlay');
        modal.querySelector('#modal-alerta-titulo').innerText = titulo;
        modal.querySelector('#modal-alerta-texto').innerText = mensagem;

        const btnOk = modal.querySelector('#btn-fechar-alerta');
        btnOk.onclick = () => {
            modal.remove();
            resolve();
        };
    });
}

// =========================================================
// 1. CONFIGURAÇÕES E ESTADO GLOBAL
// =========================================================
const principal = document.getElementById('conteudo-principal');
const btnHome = document.getElementById('btn-home');
const btnLoginMenu = document.getElementById('btn-login');

let usuarioLogado = JSON.parse(localStorage.getItem('usuarioSessao')) || null;
const getID = (obj) => obj ? obj.id : null;

const SERVICE_ID = "service_gvptgt4";
const TEMPLATE_ID = "template_ryqja5c";

function carregarTela(templateId) {
    const tpl = document.getElementById(templateId);
    if (!tpl) return console.error("Template não encontrado:", templateId);
    principal.innerHTML = "";
    principal.appendChild(tpl.content.cloneNode(true));
}

document.addEventListener('DOMContentLoaded', () => {
    if (usuarioLogado) renderizarDashboard();
    else renderizarHome();
});

// =========================================================
// 2. TELA HOME 
// =========================================================
async function renderizarHome() {
    carregarTela('tpl-home');

    const cardPreview = document.getElementById('home-card-dinamico');

    if (usuarioLogado) {
        const divBotoes = document.getElementById('bloco-botoes-home');
        if (divBotoes) divBotoes.style.display = 'none';

        let totalTurmas = 0;
        if (usuarioLogado.tipo === 'professor') {
            const { count } = await _supabase.from('turmas').select('*', { count: 'exact', head: true }).eq('professor_id', getID(usuarioLogado));
            totalTurmas = count || 0;
        } else {
            const { count } = await _supabase.from('turma_alunos').select('*', { count: 'exact', head: true }).eq('aluno_id', getID(usuarioLogado));
            totalTurmas = count || 0;
        }

        cardPreview.innerHTML = `
            <div class="home-card-inner fade-in">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <span style="font-size:0.8rem; color:#666;">Hoje</span>
                    <div style="width:35px; height:35px; background:var(--dark-green); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.85rem;">
                        ${usuarioLogado.nome.substring(0,2).toUpperCase()}
                    </div>
                </div>
                <h3 style="color:var(--dark-green); margin-bottom:15px;">Bom dia, ${usuarioLogado.nome.split(' ')[0]}.</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div style="background:#f9f9f9; padding:12px; border-radius:10px; border:1px solid #eee;">
                        <span style="font-size:1.2rem; font-weight:bold; color:var(--dark-green);">${totalTurmas}</span>
                        <p style="font-size:0.75rem; color:#666;">Turmas ativas</p>
                    </div>
                    <div style="background:#f9f9f9; padding:12px; border-radius:10px; border:1px solid #eee;">
                        <span style="font-size:1.2rem; font-weight:bold; color:var(--dark-green);">✔</span>
                        <p style="font-size:0.75rem; color:#666;">Portal Ativo</p>
                    </div>
                </div>
                <button onclick="renderizarDashboard()" class="btn-enviar" style="padding:10px; font-size:0.9rem;">Acessar meu painel</button>
            </div>
        `;
    } else {
        document.getElementById('btn-home-acessar').onclick = () => mostrarLogin();
        document.getElementById('btn-home-criar').onclick = () => mostrarCadastro();

        cardPreview.innerHTML = `
            <div class="home-card-inner fade-in">
                <span style="font-size:0.8rem; color:#666;">Portal Acadêmico</span>
                <h3 style="color:var(--dark-green); margin:10px 0;">Organize sua rotina</h3>
                <p style="font-size:0.85rem; color:#666; margin-bottom:20px;">Faça login para acompanhar suas turmas, cronogramas e notas em tempo real.</p>
                <button onclick="mostrarLogin()" class="btn-enviar" style="padding:10px; font-size:0.9rem;">Entrar no sistema</button>
            </div>
        `;
    }
}

// =========================================================
// 3. AUTENTICAÇÃO E LOGIN 
// =========================================================
function renderizarDashboard() {
    if (!usuarioLogado) { mostrarLogin(); return; }
    btnLoginMenu.textContent = "Meu painel";
    usuarioLogado.tipo === 'professor' ? renderizarProfessor() : renderizarAluno();
}

function mostrarLogin() {
    carregarTela('tpl-login');
    document.getElementById('link-cadastrar').onclick = (e) => { e.preventDefault(); mostrarCadastro(); };
    document.getElementById('link-recuperar').onclick = (e) => { e.preventDefault(); mostrarTelaRecuperar(); };

    document.getElementById('form-login').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('l-email').value.toLowerCase().trim();
        const senha = document.getElementById('l-senha').value;
        const { data } = await _supabase.from('usuarios').select('*').eq('email', email).eq('senha', senha).maybeSingle();
        if (data) {
            usuarioLogado = data;
            localStorage.setItem('usuarioSessao', JSON.stringify(data));
            renderizarDashboard();
        } else {
            await mostrarAlerta("Dados inválidos. Verifique seu e-mail e senha.", "Erro de Acesso");
        }
    };
}

function mostrarTelaRecuperar() {
    carregarTela('tpl-recuperar-senha');
    document.getElementById('link-v-login-rec').onclick = (e) => { e.preventDefault(); mostrarLogin(); };
    document.getElementById('form-recuperar-solicitar').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('r-email').value.toLowerCase().trim();
        const { data } = await _supabase.from('usuarios').select('nome, email').eq('email', email).maybeSingle();
        if (!data) {
            await mostrarAlerta("E-mail não cadastrado.", "Atenção");
            return;
        }
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, { nome: data.nome, pin, email_to: email });
            mostrarTelaDefinirNovaSenha(email, pin);
        } catch (err) { 
            await mostrarAlerta("Erro ao enviar e-mail.", "Erro"); 
        }
    };
}

function mostrarTelaDefinirNovaSenha(email, pinCorreto) {
    carregarTela('tpl-nova-senha');
    document.getElementById('form-atualizar-senha').onsubmit = async (e) => {
        e.preventDefault();
        if (document.getElementById('r-pin').value !== pinCorreto) {
            await mostrarAlerta("PIN incorreto.", "Erro");
            return;
        }
        await _supabase.from('usuarios').update({ senha: document.getElementById('r-nova-senha').value }).eq('email', email);
        await mostrarAlerta("Senha alterada com sucesso!", "Sucesso"); 
        mostrarLogin();
    };
}

function mostrarCadastro() {
    carregarTela('tpl-cadastro');
    document.getElementById('link-v-login').onclick = (e) => { e.preventDefault(); mostrarLogin(); };
    
    document.getElementById('form-cadastro').onsubmit = async (e) => {
        e.preventDefault();
        const nome = document.getElementById('c-nome').value;
        const email = document.getElementById('c-email').value.toLowerCase().trim();
        const tipo = document.getElementById('tipo-usuario').value;
        const senha = document.getElementById('c-senha').value;

        const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!regexSenha.test(senha)) {
            await mostrarAlerta("A senha deve conter no mínimo:\n- 8 caracteres\n- Uma letra maiúscula\n- Uma letra minúscula\n- Um número", "Requisito de Senha");
            return;
        }

        if (tipo === 'professor' && !email.includes('ifpr.edu.br')) {
            await mostrarAlerta("Docentes devem usar e-mail institucional (@ifpr.edu.br)", "Atenção");
            return;
        }

        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, { nome, pin, email_to: email });
            mostrarValidacaoPin(email, pin, nome, tipo, senha);
        } catch (err) { 
            await mostrarAlerta("Erro ao enviar e-mail de confirmação.", "Erro"); 
        }
    };
}

function mostrarValidacaoPin(email, pinCorreto, nome, tipo, senha) {
    carregarTela('tpl-pin');
    document.getElementById('btn-v-pin').onclick = async () => {
        if (document.getElementById('input-pin').value === pinCorreto) {
            await _supabase.from('usuarios').insert([{ nome, email, senha, tipo, email_validado: true, pin_validacao: true }]);
            await mostrarAlerta("Conta ativada com sucesso!", "Sucesso"); 
            mostrarLogin();
        } else {
            await mostrarAlerta("PIN incorreto.", "Erro");
        }
    };
}


// =========================================================
// 4. MÓDULO PROFESSOR 
// =========================================================
async function renderizarProfessor() {
    carregarTela('tpl-dash-professor');
    document.getElementById('txt-n-prof').innerText = `Olá, ${usuarioLogado.nome}`;
    document.getElementById('btn-logout').onclick = () => { localStorage.removeItem('usuarioSessao'); location.reload(); };
    document.getElementById('btn-n-turma').onclick = abrirModalCriarTurma;

    const container = document.getElementById('lista-turmas');
    const inputBusca = document.getElementById('busca-turma');
    const containerAlertasProf = document.getElementById('container-alertas-professor');

    const { data: turmas } = await _supabase.from('turmas').select('*').eq('professor_id', getID(usuarioLogado));

    if (!turmas || turmas.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#666;'>Nenhuma turma encontrada.</p>";
        return;
    }

    // --- VERIFICAÇÃO DE TRABALHOS ENTREGUES AGUARDANDO CORREÇÃO ---
    const turmaIds = turmas.map(t => t.id);
    let pendentesGerais = [];

    // Busca cronogramas de todas as turmas do professor
    const { data: cronogramas } = await _supabase
        .from('cronograma')
        .select('id, titulo, turma_id')
        .in('turma_id', turmaIds);

    if (cronogramas && cronogramas.length > 0) {
        const cronoIds = cronogramas.map(c => c.id);

        // Busca entregas que foram feitas (possuem resposta_url) mas ainda não têm nota
        const { data: entregas } = await _supabase
            .from('progresso_aluno')
            .select('id, cronograma_id, aluno_id, resposta_url, nota')
            .in('cronograma_id', cronoIds)
            .is('nota', null);

        const entregasSemNota = entregas?.filter(e => e.resposta_url && e.resposta_url.trim() !== "") || [];

        if (entregasSemNota.length > 0) {
            // Busca os nomes dos alunos que entregaram
            const alunoIds = [...new Set(entregasSemNota.map(e => e.aluno_id))];
            const { data: alunos } = await _supabase
                .from('usuarios')
                .select('id, nome')
                .in('id', alunoIds);

            pendentesGerais = entregasSemNota.map(ent => {
                const c = cronogramas.find(item => item.id === ent.cronograma_id);
                const t = turmas.find(item => item.id === c?.turma_id);
                const a = alunos?.find(item => item.id === ent.aluno_id);

                return {
                    ...ent,
                    tituloCrono: c?.titulo || 'Atividade',
                    turmaId: t?.id,
                    nomeTurma: t?.nome || 'Turma',
                    nomeAluno: a?.nome || 'Estudante'
                };
            });
        }
    }

    // Renderiza o card de aviso no topo se houver correções pendentes
    if (containerAlertasProf) {
        if (pendentesGerais.length > 0) {
            containerAlertasProf.innerHTML = `
                <div class="box-alerta-correcao fade-in">
                    <div class="alerta-correcao-header">
                        <span class="alerta-icone">📝</span>
                        <div>
                            <strong style="color: #92400e; font-size: 1rem;">Trabalhos entregues aguardando correção!</strong>
                            <p style="font-size: 0.85rem; color: #78350f; margin-top: 2px;">
                                Há ${pendentesGerais.length === 1 ? '1 trabalho entregue' : `${pendentesGerais.length} trabalhos entregues`} por alunos ainda não corrigidos:
                            </p>
                        </div>
                    </div>
                    <div class="alerta-correcao-lista">
                        ${pendentesGerais.map(item => `
                            <div class="alerta-correcao-item">
                                <div>
                                    <span class="alerta-tag-turma">📖 ${item.nomeTurma}</span>
                                    <strong style="color: #1f2937; font-size: 0.95rem; display: block; margin: 4px 0;">
                                        ${item.tituloCrono}
                                    </strong>
                                    <span style="font-size: 0.8rem; color: #555;">
                                        👤 Aluno: <b>${item.nomeAluno}</b>
                                    </span>
                                </div>
                                <button onclick="irParaCorrecaoDireta(${item.turmaId}, '${item.nomeTurma.replace(/'/g, "\\'")}', ${item.cronograma_id}, '${item.tituloCrono.replace(/'/g, "\\'")}')" class="btn-acao" style="background: #d97706; font-size: 0.8rem; padding: 8px 14px; white-space: nowrap;">
                                    Corrigir agora
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            containerAlertasProf.innerHTML = "";
        }
    }

    // Função interna para desenhar as turmas e adicionar o badge de pendências
    const desenharTurmas = (listaFiltrada) => {
        if (!listaFiltrada || listaFiltrada.length === 0) {
            container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#666;'>Nenhuma turma encontrada.</p>";
            return;
        }

        container.innerHTML = listaFiltrada.map(t => {
            const qtdPendentesTurma = pendentesGerais.filter(p => p.turmaId === t.id).length;
            const badgePendencia = qtdPendentesTurma > 0 
                ? `<span class="badge-pendente-prof">⚠️ ${qtdPendentesTurma} ${qtdPendentesTurma === 1 ? 'correção pendente' : 'correções pendentes'}</span>` 
                : '';

            return `
                <div class="card-item">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin-bottom: 3px;">${t.nome}</h3>
                            ${badgePendencia}
                        </div>
                        <div style="display:flex; gap: 5px;">
                            <button onclick="prepararEdicao(${t.id})" title="Editar" style="border:none; background:none; cursor:pointer; font-size: 1rem;">✏️</button>
                            <button onclick="excluirTurma(${t.id})" title="Excluir turma" style="border:none; background:none; cursor:pointer; font-size: 1rem;">🗑️</button>
                        </div>
                    </div>
                    <p style="font-size: 0.85rem; color: #2c3e50; font-weight: bold; margin-bottom: 5px;">
                        ${t.disciplina ? '📖 ' + t.disciplina : ''}
                    </p>
                    <span class="info-tag" style="font-size:0.8rem; color:#666;">Código: ${t.codigo_convite}</span>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
                        <button onclick="gerenciarTurma(${t.id}, '${t.nome}')" class="btn-enviar" style="padding: 10px; font-size: 0.9rem; background: var(--dark-green);">Corrigir cronogramas</button>
                        <button onclick="abrirModalAgendar(${t.id})" class="btn-cancelar" style="margin-top: 0; padding: 10px; font-size: 0.9rem; background: #e2ebd8; color: var(--dark-green); font-weight: bold;">Propor cronogramas</button>
                    </div>
                </div>`;
        }).join('');
    };

    desenharTurmas(turmas);

    inputBusca.oninput = () => {
        const termo = inputBusca.value.toLowerCase().trim();
        const filtradas = turmas.filter(t => t.nome.toLowerCase().includes(termo) || t.codigo_convite.toLowerCase().includes(termo));
        desenharTurmas(filtradas);
    };
}



// =========================================================
// FUNÇÕES DE SUPORTE PARA A TELA DO PROFESSOR
// =========================================================

// Função para abrir o modal estilizado
function abrirModalAcao(titulo, texto, tipo, onConfirm, valorAtual = "") {
    const clone = document.getElementById('tpl-modal-acao-turma').content.cloneNode(true);
    document.body.appendChild(clone);
    const modal = document.querySelector('.modal-overlay');
    
    modal.querySelector('#mod-acao-titulo').innerText = titulo;
    modal.querySelector('#mod-acao-texto').innerText = texto;
    
    const campo = modal.querySelector('#mod-acao-campo');
    const input = modal.querySelector('#input-novo-nome');
    
    if (tipo === 'editar') {
        campo.style.display = 'block';
        input.value = valorAtual;
    }

    modal.querySelector('#btn-confirmar-acao').onclick = async () => {
        const valor = input.value;
        await onConfirm(valor);
        modal.remove();
    };

    modal.querySelector('#btn-cancelar-acao').onclick = () => modal.remove();
}

// Chamada da Edição
function editarTurma(turmaId, dadosTurma) {
    const clone = document.getElementById('tpl-modal-acao-turma').content.cloneNode(true);
    document.body.appendChild(clone);
    const modal = document.querySelector('.modal-overlay');
    
    modal.querySelector('#mod-campos-edicao').style.display = 'block';
    // Preenche com os dados reais
    modal.querySelector('#edit-nome').value = dadosTurma.nome || "";
    modal.querySelector('#edit-disciplina').value = dadosTurma.disciplina || "";
    modal.querySelector('#edit-ano').value = dadosTurma.ano_letivo || "";
    modal.querySelector('#edit-detalhes').value = dadosTurma.detalhes || "";

    modal.querySelector('#btn-confirmar-acao').onclick = async () => {
        const novosDados = { 
            nome: modal.querySelector('#edit-nome').value,
            disciplina: modal.querySelector('#edit-disciplina').value,
            ano_letivo: modal.querySelector('#edit-ano').value,
            detalhes: modal.querySelector('#edit-detalhes').value
        };
        
        await _supabase.from('turmas').update(novosDados).eq('id', turmaId);
        modal.remove();
        renderizarProfessor(); // Recarrega a lista
    };
    
    modal.querySelector('#btn-cancelar-acao').onclick = () => modal.remove();
}

// Chamada da Exclusão
function excluirTurma(turmaId) {
    abrirModalAcao(
        "Excluir Turma", 
        "Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.", 
        "excluir", 
        async () => {
            await _supabase.from('turmas').delete().eq('id', turmaId);
            renderizarProfessor();
        }
    );
}


async function prepararEdicao(turmaId) {
    // Busca a turma diretamente no Supabase com base no ID
    const { data: turma, error } = await _supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaId)
        .maybeSingle();

    if (turma) {
        editarTurma(turmaId, turma);
    } else {
        alert("Erro ao buscar dados da turma.");
    }
}

// Função auxiliar para levar o professor diretamente à turma com o cronograma já selecionado
async function irParaCorrecaoDireta(turmaId, nomeTurma, cronogramaId, cronogramaTitulo) {
    await gerenciarTurma(turmaId, nomeTurma);
    setTimeout(() => {
        selecionarCronogramaParaCorrecao(cronogramaId, cronogramaTitulo, turmaId);
    }, 150);
}




// ----------------------------------------- 

function abrirModalCriarTurma() {
    document.body.appendChild(document.getElementById('tpl-modal-criar-turma').content.cloneNode(true));
    const modal = document.querySelector('.modal-overlay');
    document.getElementById('btn-cancelar-turma').onclick = () => modal.remove();
    document.getElementById('form-criar-turma').onsubmit = async (e) => {
        e.preventDefault();
        const p = { 
            nome: document.getElementById('turma-nome').value,
            disciplina: document.getElementById('turma-disciplina').value,
            ano_letivo: document.getElementById('turma-ano').value,
            detalhes: document.getElementById('turma-detalhes').value,
            codigo_convite: Math.random().toString(36).substring(7).toUpperCase(), 
            professor_id: getID(usuarioLogado) 
        };
        await _supabase.from('turmas').insert([p]);
        modal.remove(); renderizarProfessor();
    };
}

async function gerenciarTurma(turmaId, nomeTurma) {
    usuarioLogado.turma_atual_id = turmaId;
    carregarTela('tpl-gestao-turma');
    document.getElementById('txt-g-nome').innerText = nomeTurma;
    document.getElementById('btn-v-prof').onclick = renderizarProfessor;
    
    carregarCronogramasGestao(turmaId);
}

async function carregarCronogramasGestao(turmaId) {
    const { data: ag } = await _supabase.from('cronograma').select('*').eq('turma_id', turmaId).order('data', {ascending:true});
    const containerCronograma = document.getElementById('res-cronograma');
    
    if (containerCronograma) {
        if (!ag || ag.length === 0) {
            containerCronograma.innerHTML = "<p style='font-size:0.85rem; color:#666;'>Nenhum cronograma cadastrado.</p>";
            return;
        }

        containerCronograma.innerHTML = ag.map(a => `
            <div onclick="selecionarCronogramaParaCorrecao(${a.id}, '${a.titulo.replace(/'/g, "")}', ${turmaId})" class="item-cronograma card-crono-selecionavel" style="cursor:pointer; display:flex; flex-direction:column; align-items:flex-start; gap:5px; padding:12px; border-left: 6px solid var(--dark-green); margin-bottom:10px; background:#fff; border-radius:8px; transition:all 0.2s;">
                <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.7rem; font-weight:bold; color:white; background:var(--dark-green); padding:2px 8px; border-radius:10px;">Geral</span>
                    <div style="display:flex; gap:8px;" onclick="event.stopPropagation()">
                        <button onclick='editarAgendamento(${JSON.stringify(a)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                        <button onclick="excluirItem(${a.id}, 'cronograma', ${turmaId})" style="border:none; background:none; cursor:pointer;">🗑️</button>
                    </div>
                </div>
                <strong style="font-size:0.95rem; color:#222; margin-top:4px;">${a.titulo}</strong>
                <span style="font-size:0.75rem; color:#666;">📅 ${a.data || '---'} · ⏰ ${a.hora_inicio || '--:--'}</span>
            </div>`).join('');
    }
}

async function selecionarCronogramaParaCorrecao(cronogramaId, cronogramaTitulo, turmaId) {
    document.querySelectorAll('.card-crono-selecionavel').forEach(el => el.style.background = "#fff");
    event.currentTarget.style.background = "#f0f7f0";

    document.getElementById('titulo-coluna-alunos').innerText = `👥 Alunos (${cronogramaTitulo})`;

    const { data: alunos } = await _supabase.from('turma_alunos').select('aluno_id, usuarios(nome)').eq('turma_id', turmaId);
    const containerAlunos = document.getElementById('res-alunos');

    if (!alunos || alunos.length === 0) {
        containerAlunos.innerHTML = "<p style='font-size:0.85rem; color:#666;'>Nenhum aluno matriculado nesta turma.</p>";
        return;
    }

    const { data: entregas } = await _supabase.from('progresso_aluno').select('*').eq('cronograma_id', cronogramaId);

    containerAlunos.innerHTML = alunos.map(a => {
        const entregaAluno = entregas?.find(e => e.aluno_id === a.aluno_id);
        let statusBadge = `<span style="font-size:0.75rem; color:#888;">Pendente / Sem envio</span>`;
        
        if (entregaAluno) {
            if (entregaAluno.nota !== null && entregaAluno.nota !== undefined && entregaAluno.nota !== "") {
                statusBadge = `<span style="background:#27ae60; color:white; padding:2px 8px; border-radius:6px; font-size:0.75rem;">Nota: ${entregaAluno.nota}</span>`;
            } else if (entregaAluno.resposta_url) {
                statusBadge = `<span style="background:#2980b9; color:white; padding:2px 8px; border-radius:6px; font-size:0.75rem;">Enviado (Aguardando)</span>`;
            } else {
                statusBadge = `<span style="background:#f39c12; color:white; padding:2px 8px; border-radius:6px; font-size:0.75rem;">Em aberto</span>`;
            }
        }

        return `
            <div onclick="abrirModalCorrecaoAluno(${cronogramaId}, '${cronogramaTitulo}', ${a.aluno_id}, '${a.usuarios.nome}')" style="padding:12px; border-bottom:1px solid #eee; font-size:0.9rem; cursor:pointer; border-radius:6px; display:flex; justify-content:space-between; align-items:center; background:#fafcf8; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span>👤</span> <b>${a.usuarios.nome}</b>
                </div>
                <div>${statusBadge}</div>
            </div>`;
    }).join('');
}



async function abrirModalCorrecaoAluno(cronogramaId, cronogramaTitulo, alunoId, alunoNome) {
    // 1. Busca o progresso/entrega do aluno no banco de dados
    const { data: entrega } = await _supabase.from('progresso_aluno')
        .select('*')
        .eq('cronograma_id', cronogramaId)
        .eq('aluno_id', alunoId)
        .maybeSingle();

    const clone = document.getElementById('tpl-modal-corrigir-atividade').content.cloneNode(true);
    document.body.appendChild(clone);
    const modal = document.querySelector('.modal-overlay');

    modal.querySelector('#mod-corr-titulo').innerText = cronogramaTitulo;
    modal.querySelector('#mod-corr-aluno').innerText = `Estudante: ${alunoNome}`;
    
    const linkEl = modal.querySelector('#mod-corr-link');
    const inputNota = modal.querySelector('#mod-corr-nota');
    const inputFeedback = modal.querySelector('#mod-corr-feedback');
    const btnSalvar = modal.querySelector('#form-corrigir-modal button[type="submit"]');

    // VERIFICAÇÃO PRINCIPAL: O aluno enviou o trabalho?
    const alunoEntregou = entrega && entrega.resposta_url && entrega.resposta_url.trim() !== "";

    if (alunoEntregou) {
        // Se o aluno ENTREGOU: Mostra o link e libera os campos de nota/feedback
        linkEl.href = entrega.resposta_url;
        linkEl.style.display = "block";
        linkEl.innerText = "🔗 Abrir Link do Trabalho Enviado";
        
        inputNota.disabled = false;
        inputFeedback.disabled = false;
        btnSalvar.style.display = "block";
        btnSalvar.disabled = false;
        btnSalvar.style.background = "#27ae60";

        // Preenche com a nota/feedback anteriores se já existirem
        if (entrega.nota !== null && entrega.nota !== undefined) {
            inputNota.value = entrega.nota;
        }
        if (entrega.feedback) {
            inputFeedback.value = entrega.feedback;
        }
    } else {
        // Se o aluno NÃO ENTREGOU: Bloqueia o formulário e avisa o professor
        linkEl.href = "#";
        linkEl.innerText = "⚠️ O aluno ainda não realizou a entrega desta atividade.";
        linkEl.style.background = "#e74c3c"; // Vermelho de alerta
        linkEl.style.pointerEvents = "none";

        inputNota.disabled = true;
        inputNota.placeholder = "Indisponível (Sem entrega)";
        inputFeedback.disabled = true;
        inputFeedback.placeholder = "O professor só pode corrigir após o envio do aluno.";
        
        // Esconde ou desativa o botão de salvar
        btnSalvar.style.display = "none"; 
    }

    // 2. Ação ao submeter (só permitida se houver entrega)
    modal.querySelector('#form-corrigir-modal').onsubmit = async (e) => {
        e.preventDefault();
        
        if (!alunoEntregou) {
            await mostrarAlerta("Não é possível corrigir uma atividade que o aluno ainda não entregou.", "Atenção");
            return;
        }

        let notaStr = inputNota.value;
        if (notaStr === "" || notaStr === null) {
            await mostrarAlerta("Por favor, informe uma nota.", "Atenção");
            return;
        }
        let nota = parseFloat(notaStr.replace(',', '.'));
        const feedback = inputFeedback.value;

        const { error } = await _supabase.from('progresso_aluno').update({ 
            nota: nota, 
            feedback: feedback 
        }).eq('id', entrega.id);

        if (error) {
            await mostrarAlerta("Erro ao atualizar correção: " + error.message, "Erro");
            return;
        }

        await mostrarAlerta("✅ Correção salva com sucesso!", "Sucesso");
        modal.remove();
        
        if (typeof selecionarCronogramaParaCorrecao === 'function' && usuarioLogado.turma_atual_id) {
            selecionarCronogramaParaCorrecao(cronogramaId, cronogramaTitulo, usuarioLogado.turma_atual_id);
        }
    };

    modal.querySelector('#btn-fechar-mod-corr').onclick = () => modal.remove();
}

async function carregarDadosGestao(turmaId, alunoSelecionadoId = null) {
    const { data: al } = await _supabase.from('turma_alunos').select('aluno_id, usuarios(nome)').eq('turma_id', turmaId);
    const containerAlunos = document.getElementById('res-alunos');
    
    if (containerAlunos) {
        if (!al || al.length === 0) {
            containerAlunos.innerHTML = "<p style='font-size:0.85rem; color:#666;'>Nenhum aluno na turma.</p>";
        } else {
            containerAlunos.innerHTML = al.map(a => `
                <div onclick="carregarDadosGestao(${turmaId}, ${a.aluno_id})" style="padding:10px; border-bottom:1px solid #eee; font-size:0.9rem; cursor:pointer; background:${alunoSelecionadoId === a.aluno_id ? '#e2ebd8' : 'transparent'}; border-radius:6px; display:flex; align-items:center; gap:8px;">
                    <span>👤</span> <b>${a.usuarios.nome}</b>
                </div>`).join('');
        }
    }

    const { data: ag } = await _supabase.from('cronograma').select('*').eq('turma_id', turmaId).order('data', {ascending:true});
    const containerCronograma = document.getElementById('res-cronograma');
    
    if (containerCronograma) {
        containerCronograma.innerHTML = ag?.map(a => `
            <div class="item-cronograma" style="display:flex; flex-direction:column; align-items:flex-start; gap:5px; padding:12px; border-left: 6px solid var(--dark-green); margin-bottom:10px; background:#fff; border-radius:8px;">
                <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.7rem; font-weight:bold; color:white; background:var(--dark-green); padding:2px 8px; border-radius:10px;">${a.aluno_id ? 'Individual' : 'Geral'}</span>
                    <div style="display:flex; gap:8px;">
                        <button onclick='editarAgendamento(${JSON.stringify(a)})' style="border:none; background:none; cursor:pointer;">✏️</button>
                        <button onclick="excluirItem(${a.id}, 'cronograma', ${turmaId})" style="border:none; background:none; cursor:pointer;">🗑️</button>
                    </div>
                </div>
                <strong style="font-size:0.95rem; color:#222; margin-top:4px;">${a.titulo}</strong>
                <span style="font-size:0.75rem; color:#666;">📅 ${a.data || '---'} · ⏰ ${a.hora_inicio || '--:--'}</span>
            </div>`).join('') || "<p style='font-size:0.85rem; color:#666;'>Nenhum agendamento.</p>";
    }

    const containerEntregas = document.getElementById('res-entregas-aluno');
    const tituloSecaoAluno = document.getElementById('titulo-secao-aluno');

    if (alunoSelecionadoId && containerEntregas) {
        const alunoObj = al.find(x => x.aluno_id === alunoSelecionadoId);
        tituloSecaoAluno.innerText = `📝 Avaliações: ${alunoObj?.usuarios.nome.split(' ')[0]}`;

        const { data: entregasAluno } = await _supabase.from('progresso_aluno')
            .select(`id, resposta_url, nota, feedback, cronograma(id, titulo, turma_id)`)
            .eq('aluno_id', alunoSelecionadoId);

        if (!entregasAluno || entregasAluno.length === 0) {
            containerEntregas.innerHTML = "<p style='font-size:0.85rem; color:#666; text-align:center;'>Este aluno ainda não realizou nenhuma entrega.</p>";
            return;
        }

        containerEntregas.innerHTML = entregasAluno.map(e => `
            <div class="card-item" style="border-top-color: ${e.nota !== null ? '#27ae60' : '#f39c12'}; font-size: 0.85rem; padding: 15px;">
                <p>📌 Atividade: <b>${e.cronograma?.titulo}</b></p>
                <a href="${e.resposta_url}" target="_blank" style="display:block; margin:6px 0; color:#2980b9; font-weight:bold;">🔗 Ver trabalho enviado</a>
                
                <div style="background: #f9f9f9; padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-top:10px;">
                    <div class="form-group"><label style="font-size:0.75rem;">Nota (0-10):</label><input type="number" id="n-${e.id}" value="${e.nota !== null ? e.nota : ''}" style="width:100%; padding:6px;"></div>
                    <div class="form-group"><label style="font-size:0.75rem;">Feedback:</label><textarea id="f-${e.id}" style="width:100%; font-size:0.8rem; height:50px;">${e.feedback || ''}</textarea></div>
                    <button onclick="salvarCorrecao(${e.id}, ${turmaId}, ${alunoSelecionadoId})" class="btn-enviar" style="padding:8px; font-size:0.85rem; background:#27ae60;">Salvar alterações</button>
                </div>
            </div>`).join('');
    }
}

async function salvarCorrecao(progressoId, turmaId, alunoId) {
    let nota = document.getElementById(`n-${progressoId}`).value;
    const feedback = document.getElementById(`f-${progressoId}`).value;
    if(!nota) {
        await mostrarAlerta("Insira uma nota!", "Atenção");
        return;
    }
    nota = nota.replace(',', '.');

    const { error } = await _supabase.from('progresso_aluno').update({ nota, feedback }).eq('id', progressoId);
    if (error) {
        await mostrarAlerta("Erro: " + error.message, "Erro");
    } else {
        await mostrarAlerta("✅ Nota salva com sucesso!", "Sucesso");
        carregarDadosGestao(turmaId, alunoId); 
    }
}

async function abrirModalAgendar(turmaId, item = null) {
    const clone = document.getElementById('tpl-modal-agendar').content.cloneNode(true);
    const grpAluno = clone.querySelector('#ag-sel-aluno')?.closest('.form-group');
    if (grpAluno) grpAluno.style.display = 'none';

    document.body.appendChild(clone);
    const modal = document.querySelector('.modal-overlay');
    
    if (item) {
        document.getElementById('ag-t').value = item.titulo || "";
        document.getElementById('ag-d-ini').value = item.data || "";
        document.getElementById('ag-d-fim').value = item.data_fim || "";
        document.getElementById('ag-h1').value = item.hora_inicio || "";
        document.getElementById('ag-h2').value = item.hora_fim || "";
        document.getElementById('ag-conteudo').value = item.conteudo_estudo || "";
        document.getElementById('ag-link').value = item.link_material || "";
        document.getElementById('ag-ativ-desc').value = item.atividades_descricao || "";
    }

    document.getElementById('form-ag').onsubmit = async (e) => {
        e.preventDefault();
        const payload = { 
            turma_id: turmaId, 
            titulo: document.getElementById('ag-t').value, 
            data: document.getElementById('ag-d-ini').value, 
            data_fim: document.getElementById('ag-d-fim').value, 
            hora_inicio: document.getElementById('ag-h1').value, 
            hora_fim: document.getElementById('ag-h2').value, 
            aluno_id: null, 
            conteudo_estudo: document.getElementById('ag-conteudo').value, 
            link_material: document.getElementById('ag-link').value, 
            atividades_descricao: document.getElementById('ag-ativ-desc').value 
        };

        if (item) await _supabase.from('cronograma').update(payload).eq('id', item.id);
        else await _supabase.from('cronograma').insert([payload]);
        
        modal.remove(); 
        carregarCronogramasGestao(turmaId);
    };
    document.getElementById('btn-f-agenda').onclick = () => modal.remove();
}

function editarAgendamento(item) { abrirModalAgendar(item.turma_id, item); }


// =========================================================
// 5. MÓDULO ALUNO 
// =========================================================
async function renderizarAluno() {
    carregarTela('tpl-dash-aluno');
    document.getElementById('txt-n-aluno').innerText = `Olá, ${usuarioLogado.nome}`;
    document.getElementById('btn-l-aluno').onclick = () => { localStorage.removeItem('usuarioSessao'); location.reload(); };
    document.getElementById('btn-e-turma').onclick = abrirModalEntrarTurma;

    const { data: v } = await _supabase
        .from('turma_alunos')
        .select('id, turma_id, turmas(nome, disciplina, usuarios(nome))')
        .eq('aluno_id', getID(usuarioLogado));
    
    const containerTurmasAluno = document.getElementById('lista-turmas-aluno');
    const containerAlertas = document.getElementById('container-alertas-aluno');
    
    if (!v || v.length === 0) {
        containerTurmasAluno.innerHTML = "<p style='grid-column:1/-1; color:#666;'>Você ainda não está matriculado em nenhuma turma.</p>";
        return;
    }

    // --- VERIFICAÇÃO DE PRAZOS (1 DIA ANTES DE EXPIRAR) ---
    const turmaIds = v.map(item => item.turma_id);
    
    // Busca todas as atividades das turmas do aluno
    const { data: todasAtividades } = await _supabase
        .from('cronograma')
        .select('*')
        .in('turma_id', turmaIds)
        .or(`aluno_id.is.null,aluno_id.eq.${getID(usuarioLogado)}`);

    // Busca as entregas já feitas pelo aluno
    const { data: entregasFeitas } = await _supabase
        .from('progresso_aluno')
        .select('cronograma_id, resposta_url')
        .eq('aluno_id', getID(usuarioLogado));

    const atividadesUrgentes = [];

    if (todasAtividades) {
        todasAtividades.forEach(ativ => {
            // Verifica se o aluno já enviou
            const entrega = entregasFeitas?.find(e => e.cronograma_id === ativ.id);
            const jaEntregou = entrega && entrega.resposta_url && entrega.resposta_url.trim() !== "";

            // Só gera alerta se o aluno AINDA NÃO entregou
            if (!jaEntregou) {
                const prazo = verificarPrazoProximo(ativ.data_fim || ativ.data, ativ.hora_fim);
                if (prazo && prazo.urgente) {
                    const turmaInfo = v.find(t => t.turma_id === ativ.turma_id);
                    atividadesUrgentes.push({
                        ...ativ,
                        nomeTurma: turmaInfo?.turmas?.nome || 'Turma',
                        nomeProf: turmaInfo?.turmas?.usuarios?.nome || '',
                        prazo
                    });
                }
            }
        });
    }

    // Exibe o painel de alerta se houver atividade vencendo nas próximas 24h
    if (containerAlertas) {
        if (atividadesUrgentes.length > 0) {
            containerAlertas.innerHTML = `
                <div class="box-alerta-prazo fade-in">
                    <div class="alerta-prazo-header">
                        <span class="alerta-icone">⚠️</span>
                        <div>
                            <strong style="color: #991b1b; font-size: 1rem;">Atenção: Atividade expirando em breve!</strong>
                            <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 2px;">
                                Você possui ${atividadesUrgentes.length === 1 ? '1 atividade com entrega nas próximas 24 horas' : `${atividadesUrgentes.length} atividades que vencem em menos de 24 horas`}:
                            </p>
                        </div>
                    </div>
                    <div class="alerta-prazo-lista">
                        ${atividadesUrgentes.map(at => `
                            <div class="alerta-prazo-item">
                                <div>
                                    <span class="alerta-tag-turma">📖 ${at.nomeTurma}</span>
                                    <strong style="color: #1f2937; font-size: 0.95rem; display: block; margin: 4px 0;">${at.titulo}</strong>
                                    <span style="font-size: 0.8rem; color: #dc2626; font-weight: 600;">
                                        ⏳ Encerra em cerca de ${at.prazo.horasRestantes}h (${at.prazo.dataLimiteFormatada})
                                    </span>
                                </div>
                                <button onclick="verMateriaisAluno(${at.turma_id}, '${at.nomeTurma}', '${at.nomeProf}')" class="btn-acao" style="background: #dc2626; font-size: 0.8rem; padding: 8px 14px; white-space: nowrap;">
                                    Abrir atividade
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            containerAlertas.innerHTML = "";
        }
    }

    // Renderiza os cards das turmas normalmente
    containerTurmasAluno.innerHTML = v.map(x => `
        <div class="card-item card-turma-aluno" style="border-top-color:#2980b9; position: relative;">
            <button onclick="sairDaTurma(${x.id}, '${x.turmas.nome}')" class="btn-sair-turma" title="Sair da turma">
                🚪 Sair da turma
            </button>
            <h3 style="margin-bottom: 5px; padding-right: 70px;">${x.turmas.nome}</h3>
            <p style="font-size: 0.85rem; color: var(--dark-green); font-weight: bold; margin-bottom: 8px;">
                ${x.turmas.disciplina ? '📖 ' + x.turmas.disciplina : 'Disciplina não definida'}
            </p>
            <span class="info-tag" style="margin-bottom: 15px; display:block; font-size: 0.8rem; color: #666;">
                Prof. ${x.turmas.usuarios?.nome || 'Docente'}
            </span>
            <button onclick="verMateriaisAluno(${x.turma_id}, '${x.turmas.nome}', '${x.turmas.usuarios?.nome || ''}')" class="btn-enviar" style="background:#2980b9; padding:10px; font-size:0.9rem; width:100%;">Acessar turma</button>
        </div>`).join('');
}

// Nova função para processar a saída do aluno da turma
async function sairDaTurma(relacaoId, nomeTurma) {
    const confirmou = await mostrarAlerta(
        `Tem certeza de que deseja sair da turma "${nomeTurma}"? Você perderá o acesso aos materiais e notas até entrar novamente com o código.`, 
        "Sair da Turma"
    );

    // Como o nosso modal de alerta retorna uma Promise simples sem booleano de confirmação nativo, 
    // vamos usar o confirm padrão do navegador para garantir a segurança da exclusão:
    if (window.confirm(`Deseja realmente sair da turma "${nomeTurma}"?`)) {
        const { error } = await _supabase.from('turma_alunos').delete().eq('id', relacaoId);
        
        if (error) {
            await mostrarAlerta("Erro ao sair da turma: " + error.message, "Erro");
        } else {
            await mostrarAlerta("Você saiu da turma com sucesso.", "Sucesso");
            renderizarAluno();
        }
    }
}

function abrirModalEntrarTurma() {
    const clone = document.getElementById('tpl-modal-entrar-turma').content.cloneNode(true);
    document.body.appendChild(clone);
    const modal = document.querySelector('.modal-overlay');

    document.getElementById('btn-cancelar-entrar-turma').onclick = () => modal.remove();

    document.getElementById('form-entrar-turma').onsubmit = async (e) => {
        e.preventDefault();
        const cod = document.getElementById('input-codigo-convite').value.toUpperCase().trim();
        
        if (!cod) {
            await mostrarAlerta("Digite um código válido.", "Atenção");
            return;
        }

        const { data: turma, error } = await _supabase.from('turmas').select('id').eq('codigo_convite', cod).maybeSingle();

        if (error || !turma) {
            await mostrarAlerta("Turma não encontrada. Verifique o código digitado.", "Erro");
            return;
        }

        const { data: jaMatriculado } = await _supabase.from('turma_alunos')
            .select('id')
            .eq('turma_id', turma.id)
            .eq('aluno_id', getID(usuarioLogado))
            .maybeSingle();

        if (jaMatriculado) {
            await mostrarAlerta("Você já está matriculado nesta turma!", "Aviso");
            modal.remove();
            return;
        }

        const { error: errMatricula } = await _supabase.from('turma_alunos').insert([{ 
            turma_id: turma.id, 
            aluno_id: getID(usuarioLogado) 
        }]);

        if (errMatricula) {
            await mostrarAlerta("Erro ao entrar na turma: " + errMatricula.message, "Erro");
        } else {
            await mostrarAlerta("✅ Matrícula realizada com sucesso!", "Sucesso");
            modal.remove();
            renderizarAluno();
        }
    };
}

async function verMateriaisAluno(id, nomeTurma, nomeProf) {
    carregarTela('tpl-materiais-aluno');
    document.getElementById('txt-m-nome').innerText = nomeTurma;
    document.getElementById('txt-m-prof').innerText = `Prof. ${nomeProf}`;
    document.getElementById('btn-v-est').onclick = renderizarAluno;
    
const carregarCronogramaAluno = async (filtro = 'todos') => {
        // Busca as atividades da turma (gerais ou direcionadas para este aluno)
        const { data: ag } = await _supabase
            .from('cronograma')
            .select('*')
            .eq('turma_id', id)
            .or(`aluno_id.is.null,aluno_id.eq.${getID(usuarioLogado)}`)
            .order('data', { ascending: true });

        // Busca o histórico de entregas do aluno
        const { data: progresso } = await _supabase
            .from('progresso_aluno')
            .select('*')
            .eq('aluno_id', getID(usuarioLogado));

        const containerCronograma = document.getElementById('l-ag-prof');
        
        let listaFiltrada = ag || [];

        // Filtro por status
        if (filtro === 'pendente') {
            listaFiltrada = ag.filter(a => {
                const p = progresso?.find(x => x.cronograma_id === a.id);
                return !p || !p.resposta_url || p.resposta_url.trim() === "";
            });
        } else if (filtro === 'concluido') {
            listaFiltrada = ag.filter(a => {
                const p = progresso?.find(x => x.cronograma_id === a.id);
                return p && p.resposta_url && p.resposta_url.trim() !== "";
            });
        }

        // Renderiza a lista de atividades com badge de nota e aviso de prazo
        containerCronograma.innerHTML = listaFiltrada.map(a => {
            const p = progresso?.find(x => x.cronograma_id === a.id);
            let badgeNota = `<span style="background:#eee; color:#666; padding:3px 8px; border-radius:6px; font-size:0.75rem;">Pendente</span>`;
            
            if (p && p.nota !== null && p.nota !== undefined) {
                badgeNota = `<span style="background:#27ae60; color:white; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">Nota: ${p.nota}</span>`;
            } else if (p && p.resposta_url && p.resposta_url.trim() !== "") {
                badgeNota = `<span style="background:#f39c12; color:white; padding:3px 8px; border-radius:6px; font-size:0.75rem;">Aguardando correção</span>`;
            }

            // Tag se estiver a 1 dia de expirar e ainda pendente
            const prazo = verificarPrazoProximo(a.data_fim || a.data, a.hora_fim);
            const naoEntregou = !p || !p.resposta_url || p.resposta_url.trim() === "";
            let tagUrgente = "";
            if (naoEntregou && prazo && prazo.urgente) {
                tagUrgente = `<span class="badge-prazo-urgente">⚠️ Vence em ${prazo.horasRestantes}h!</span>`;
            }

            return `
                <div class="item-cronograma" style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:white; border-radius:10px; border:1px solid #eee;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:0.75rem; color:#666; font-weight:bold; text-transform:uppercase;">Entrega · ${a.data_fim || a.data || 'Sem data'}</span>
                            ${tagUrgente}
                        </div>
                        <strong style="font-size:1rem; color:#222; margin-top:2px; display:block;">${a.titulo}</strong>
                        <p style="font-size:0.8rem; color:#666; margin-top:2px;">Atividade avaliada e disponível para consulta.</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        ${badgeNota}
                        <button id="btn-det-${a.id}" class="btn-enviar" style="padding:6px 14px; font-size:0.8rem; background:var(--dark-green); width:auto;">Ver detalhes</button>
                    </div>
                </div>`;
        }).join('') || "<p style='text-align:center; color:#666; padding:20px;'>Nenhuma atividade encontrada.</p>";

        // Adiciona os eventos de clique no botão 'Ver detalhes' de cada atividade
        listaFiltrada.forEach(a => {
            const btn = document.getElementById(`btn-det-${a.id}`);
            if (btn) {
                btn.onclick = () => abrirDetalhesAluno(a, () => carregarCronogramaAluno(document.getElementById('filtro-status-aluno').value));
            }
        });
    };

    document.getElementById('filtro-status-aluno').onchange = (e) => carregarCronogramaAluno(e.target.value);
    carregarCronogramaAluno('todos');
}

async function abrirDetalhesAluno(item, callbackAtualizar) {
    const clone = document.getElementById('tpl-modal-detalhes-agendamento').content.cloneNode(true);
    document.body.appendChild(clone);
    const modal = document.querySelector('.modal-overlay');
    
    modal.querySelector('#det-titulo').innerText = item.titulo;
    modal.querySelector('#det-data').innerText = `📅 Prazo: ${item.data || '---'} até ${item.data_fim || item.data || '---'} | ⏰ ${item.hora_inicio || '--:--'} às ${item.hora_fim || '--:--'}`;
    modal.querySelector('#det-conteudo').innerText = item.conteudo_estudo || "Nenhum conteúdo descrito.";
    modal.querySelector('#det-atividades').innerText = item.atividades_descricao || "Nenhuma instrução específica.";

    if (item.link_material) { 
        modal.querySelector('#area-link').style.display = "block"; 
        modal.querySelector('#det-link').href = item.link_material; 
    }

    const secaoEntrega = modal.querySelector('#secao-entrega');
    
    // Busca a entrega do aluno para este cronograma específico
    const { data: entrega } = await _supabase.from('progresso_aluno')
        .select('*')
        .eq('aluno_id', getID(usuarioLogado))
        .eq('cronograma_id', item.id)
        .maybeSingle();

    // Verifica se o aluno realmente enviou um link válido (evita registros fantasmas)
    const jaEnviouDeVerdade = entrega && entrega.resposta_url && entrega.resposta_url.trim() !== "";

    // VERIFICAÇÃO DE PRAZO (DATA DE ENCERRAMENTO)
    let prazoExpirado = false;
    if (item.data_fim) {
        const horaFim = item.hora_fim ? item.hora_fim : "23:59:59";
        const dataLimiteStr = `${item.data_fim}T${horaFim}`;
        const dataLimite = new Date(dataLimiteStr);
        const agora = new Date();

        if (agora > dataLimite) {
            prazoExpirado = true;
        }
    }

    if (jaEnviouDeVerdade) {
        // Se já enviou, mostra o status da entrega e a nota (se houver)
        secaoEntrega.innerHTML = `
            <div style="background: #fafffa; padding: 15px; border-radius: 10px; border: 1px solid #27ae60;">
                <p style="color: #27ae60; font-weight: bold; margin-bottom:5px;">✓ Atividade Entregue</p>
                <a href="${entrega.resposta_url}" target="_blank" style="font-size: 0.85rem; color: #2980b9; display:block; margin-bottom:10px;">🔗 Ver arquivo enviado</a>
                ${entrega.nota !== null && entrega.nota !== undefined ? `
                    <p style="font-size: 1.1rem; color: #27ae60; font-weight:bold;">Nota: ${entrega.nota}</p>
                    <p style="font-style: italic; font-size: 0.85rem; color: #555; margin-top:5px;">Feedback: "${entrega.feedback || 'Sem comentários'}"</p>
                ` : `<p style="font-size: 0.85rem; color: #f39c12; font-weight:bold;">Aguardando correção do professor...</p>`}
            </div>
        `;
    } else if (prazoExpirado) {
        // Se NÃO enviou e o PRAZO EXPIROU: Bloqueia o envio
        secaoEntrega.innerHTML = `
            <div style="background: #fdf3f2; padding: 15px; border-radius: 10px; border: 1px solid #e74c3c; text-align: center;">
                <p style="color: #c0392b; font-weight: bold; margin-bottom: 5px;">⏳ Prazo Encerrado</p>
                <p style="font-size: 0.85rem; color: #555;">A data limite para a entrega desta atividade expirou. Não é mais possível enviar trabalhos.</p>
            </div>
        `;
    } else {
        // Se NÃO enviou e o prazo ainda está válido: Libera a caixa de envio limpa
        secaoEntrega.innerHTML = `
            <h4 style="color: #27ae60; margin-bottom: 8px; font-size: 0.95rem;">📤 Enviar Trabalho</h4>
            <input type="url" id="link-estudante" placeholder="https://link-do-seu-trabalho.com" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 10px; font-size:0.9rem;">
            <button type="button" id="btn-enviar-estudo" class="btn-enviar" style="background: #27ae60;">Confirmar Entrega</button>
        `;

        modal.querySelector('#btn-enviar-estudo').onclick = async () => {
            // Checagem de segurança extra no momento do clique
            if (item.data_fim) {
                const horaFim = item.hora_fim ? item.hora_fim : "23:59:59";
                if (new Date() > new Date(`${item.data_fim}T${horaFim}`)) {
                    await mostrarAlerta("O prazo de entrega desta atividade já expirou!", "Atenção");
                    modal.remove();
                    if(callbackAtualizar) callbackAtualizar();
                    return;
                }
            }

            const url = modal.querySelector('#link-estudante').value;
            if(!url || url.trim() === "") {
                await mostrarAlerta("Insira o link do seu trabalho!", "Atenção");
                return;
            }
            
            let error;
            if (entrega && entrega.id) {
                const res = await _supabase.from('progresso_aluno').update({ 
                    resposta_url: url, 
                    concluido: true, 
                    data_conclusao: new Date().toISOString() 
                }).eq('id', entrega.id);
                error = res.error;
            } else {
                const res = await _supabase.from('progresso_aluno').insert([{ 
                    aluno_id: getID(usuarioLogado), 
                    cronograma_id: item.id, 
                    resposta_url: url, 
                    concluido: true, 
                    data_conclusao: new Date().toISOString() 
                }]);
                error = res.error;
            }
            
            if(error) {
                await mostrarAlerta("Erro ao enviar: " + error.message, "Erro");
            } else { 
                await mostrarAlerta("Entrega realizada com sucesso!", "Sucesso"); 
                modal.remove(); 
                if(callbackAtualizar) callbackAtualizar();
            }
        };
    }
    
    modal.querySelector('#btn-fechar-detalhes').onclick = () => modal.remove();
}
// =========================================================
// 6. FUNÇÕES AUXILIARES
// =========================================================
async function excluirItem(id, tabela, turmaId) {
    if(confirm("Deseja excluir este item do cronograma?")) {
        await _supabase.from(tabela).delete().eq('id', id);
        carregarDadosGestao(turmaId);
    }
}


function verificarPrazoProximo(dataFimStr, horaFimStr) {
    if (!dataFimStr) return null;
    const hora = horaFimStr ? (horaFimStr.length === 5 ? `${horaFimStr}:00` : horaFimStr) : '23:59:59';
    const dataLimite = new Date(`${dataFimStr}T${hora}`);
    const agora = new Date();

    const diffMs = dataLimite.getTime() - agora.getTime();
    const umDiaMs = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

    // Já expirou
    if (diffMs <= 0) return { expirado: true, urgente: false };

    // Vence em até 24 horas (1 dia antes)
    if (diffMs <= umDiaMs) {
        const horasRestantes = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
        return {
            expirado: false,
            urgente: true,
            horasRestantes,
            dataLimiteFormatada: `${dataLimite.toLocaleDateString('pt-BR')} às ${dataLimite.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        };
    }

    return { expirado: false, urgente: false };
}


// =========================================================
// 7. SISTEMA DE PALETA DE CORES FIXAS
// =========================================================

const paletasDeCores = {
    padrao: {
        dark: '#0d2e1a',
        logo: '#215e38',
        sidebar: '#e6ede0',
        bg: '#f9fbf6'
    },
    rosa: {
        dark: '#97002d',
        logo: '#c92f6f',
        sidebar: '#ffc3d0',
        bg: '#fadde7'
    },
    vermelho: {
        dark: '#8d0f0f',
        logo: '#aa4040',
        sidebar: '#ffb8b8',
        bg: '#ffdfdf'
    },
    roxo: {
        dark: '#600677',
        logo: '#7e22ce',
        sidebar: '#d4beeb',
        bg: '#f2e5ff'
    },
    laranja: {
        dark: '#c75528',
        logo: '#f05800',
        sidebar: '#ffedd5',
        bg: '#fff7ed'
    },
    azul: {
        dark: '#0a2d53',
        logo: '#1d4ed8',
        sidebar: '#e0f2fe',
        bg: '#f0f9ff'
    },
    amarelo: {
        dark: '#b37a00',
        logo: '#ca8a04',
        sidebar: '#fef9c3',
        bg: '#fefce8'
    },
    cinza: {
        dark: '#2d3035',
        logo: '#707b8a',
        sidebar: '#989899',
        bg: '#dadada'
    },
    preto: {
        dark: '#000000',
        logo: '#27272a',
        sidebar: '#999999',
        bg: '#f4f4f5'
    },
    marrom: {
        dark: '#451a03',
        logo: '#78350f',
        sidebar: '#f5ebe0',
        bg: '#fdfbf7'
    },
    bege: {
        dark: '#7a513d',
        logo: '#c49a80',
        sidebar: '#d4a57f',
        bg: '#ffe2cf'
    },
    bordo: {
        dark: '#38040e',
        logo: '#861d1d',
        sidebar: '#9e4a4a',
        bg: '#f3bebe'
    }
};

function aplicarTemaFixo(nomeTema, salvar = false) {
    const paleta = paletasDeCores[nomeTema] || paletasDeCores.padrao;
    const root = document.documentElement;

    root.style.setProperty('--dark-green', paleta.dark);
    root.style.setProperty('--logo-green', paleta.logo);
    root.style.setProperty('--sidebar-green', paleta.sidebar);
    root.style.setProperty('--main-bg', paleta.bg);

    if (salvar) {
        localStorage.setItem('agendaEduTemaFixo', nomeTema);
    }
}

// Inicialização: Se o usuário já escolheu antes, aplica. Senão, mantém o verde padrão original.
document.addEventListener('DOMContentLoaded', () => {
    const temaSalvo = localStorage.getItem('agendaEduTemaFixo');
    if (temaSalvo) {
        aplicarTemaFixo(temaSalvo, false);
    }

    // Evento de clique nos botões da paleta fixa
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-cor-tema')) {
            const tema = e.target.getAttribute('data-tema');
            aplicarTemaFixo(tema, true);
        }
    });
});

// Função para abrir o modal de escolha de temas
function abrirModalTemas() {
    const tpl = document.getElementById('tpl-modal-tema');
    if (!tpl) return;
    
    document.body.appendChild(tpl.content.cloneNode(true));
    const modal = document.querySelector('.modal-overlay:has(#btn-fechar-modal-tema)');
    
    // Fechar pelo botão 'Fechar'
    modal.querySelector('#btn-fechar-modal-tema').onclick = () => modal.remove();

    // Fechar clicando fora do card
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    // Ação ao selecionar uma das cores
    modal.querySelectorAll('.btn-cor-tema-modal').forEach(btn => {
        btn.onclick = () => {
            const tema = btn.getAttribute('data-tema');
            aplicarTemaFixo(tema, true);
            modal.remove(); // Fecha o modal após selecionar
        };
    });
}

// Ouvinte para abrir o modal quando clicar no botão colorido
document.addEventListener('click', (e) => {
    if (e.target && e.target.closest('#btn-abrir-modal-tema')) {
        e.preventDefault();
        abrirModalTemas();
    }
});


btnHome.onclick = () => { renderizarHome(); if (usuarioLogado) btnLoginMenu.textContent = "Meu painel"; };
btnLoginMenu.onclick = renderizarDashboard;