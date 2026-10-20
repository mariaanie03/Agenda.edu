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
// =========================================================
// 4. MÓDULO PROFESSOR (ATUALIZADO)
// =========================================================
async function renderizarProfessor() {
    carregarTela('tpl-dash-professor');
    document.getElementById('txt-n-prof').innerText = `Olá, ${usuarioLogado.nome}`;
    document.getElementById('btn-logout').onclick = () => { localStorage.removeItem('usuarioSessao'); location.reload(); };
    document.getElementById('btn-n-turma').onclick = abrirModalCriarTurma;

    const container = document.getElementById('lista-turmas');
    const inputBusca = document.getElementById('busca-turma');

    const { data: turmas } = await _supabase.from('turmas').select('*').eq('professor_id', getID(usuarioLogado));

    const desenharTurmas = (listaFiltrada) => {
        if (!listaFiltrada || listaFiltrada.length === 0) {
            container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#666;'>Nenhuma turma encontrada.</p>";
            return;
        }
        container.innerHTML = listaFiltrada.map(t => `
            <div class="card-item">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <h3 style="margin-bottom: 5px;">${t.nome}</h3>
                    <div style="display:flex; gap: 5px;">
                        <button onclick="prepararEdicao(${t.id})" title="Editar" "style="border:none; background:none; cursor:pointer; font-size: 1rem;">✏️</button>
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
            </div>`).join('');
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
        let statusBadge = `<span style="font-size:0.75rem; color:#888;">Não enviado</span>`;
        
        if (entregaAluno) {
            if (entregaAluno.nota !== null) {
                statusBadge = `<span style="background:#27ae60; color:white; padding:2px 8px; border-radius:6px; font-size:0.75rem;">Nota: ${entregaAluno.nota}</span>`;
            } else {
                statusBadge = `<span style="background:#f39c12; color:white; padding:2px 8px; border-radius:6px; font-size:0.75rem;">Aguardando correção</span>`;
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
    if (entrega && entrega.resposta_url) {
        linkEl.href = entrega.resposta_url;
        linkEl.style.display = "block";
    } else {
        linkEl.href = "#";
        linkEl.innerText = "O aluno ainda não enviou o link do trabalho.";
        linkEl.style.background = "#95a5a6";
        linkEl.style.pointerEvents = "none";
    }

    if (entrega) {
        if (entrega.nota !== null) modal.querySelector('#mod-corr-nota').value = entrega.nota;
        if (entrega.feedback) modal.querySelector('#mod-corr-feedback').value = entrega.feedback;
    }

    modal.querySelector('#form-corrigir-modal').onsubmit = async (e) => {
        e.preventDefault();
        let nota = modal.querySelector('#mod-corr-nota').value.replace(',', '.');
        const feedback = modal.querySelector('#mod-corr-feedback').value;

        if (entrega) {
            await _supabase.from('progresso_aluno').update({ nota, feedback }).eq('id', entrega.id);
        } else {
            await _supabase.from('progresso_aluno').insert([{
                cronograma_id: cronogramaId,
                aluno_id: alunoId,
                nota,
                feedback,
                concluido: true
            }]);
        }

        await mostrarAlerta("✅ Correção salva com sucesso!", "Sucesso");
        modal.remove();
        selecionarCronogramaParaCorrecao(cronogramaId, cronogramaTitulo, usuarioLogado.turma_atual_id);
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
// 5. MÓDULO ALUNO (ATUALIZADO)
// =========================================================
async function renderizarAluno() {
    carregarTela('tpl-dash-aluno');
    document.getElementById('txt-n-aluno').innerText = `Olá, ${usuarioLogado.nome}`;
    document.getElementById('btn-l-aluno').onclick = () => { localStorage.removeItem('usuarioSessao'); location.reload(); };
    document.getElementById('btn-e-turma').onclick = abrirModalEntrarTurma;

    // Buscando as turmas e incluindo a coluna 'disciplina' no select
    const { data: v } = await _supabase
        .from('turma_alunos')
        .select('turma_id, turmas(nome, disciplina, usuarios(nome))')
        .eq('aluno_id', getID(usuarioLogado));
    
    const containerTurmasAluno = document.getElementById('lista-turmas-aluno');
    
    if (!v || v.length === 0) {
        containerTurmasAluno.innerHTML = "<p style='grid-column:1/-1; color:#666;'>Você ainda não está matriculado em nenhuma turma.</p>";
    } else {
        containerTurmasAluno.innerHTML = v.map(x => `
            <div class="card-item" style="border-top-color:#2980b9;">
                <h3 style="margin-bottom: 5px;">${x.turmas.nome}</h3>
                
                <!-- Exibição da Disciplina -->
                <p style="font-size: 0.85rem; color: var(--dark-green); font-weight: bold; margin-bottom: 8px;">
                    ${x.turmas.disciplina ? '📖 ' + x.turmas.disciplina : 'Disciplina não definida'}
                </p>
                
                <span class="info-tag" style="margin-bottom: 15px; display:block; font-size: 0.8rem; color: #666;">
                    Prof. ${x.turmas.usuarios?.nome || 'Docente'}
                </span>
                
                <button onclick="verMateriaisAluno(${x.turma_id}, '${x.turmas.nome}', '${x.turmas.usuarios?.nome || ''}')" class="btn-enviar" style="background:#2980b9; padding:10px; font-size:0.9rem; width:100%;">Acessar turma</button>
            </div>`).join('');
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
        const { data: ag } = await _supabase.from('cronograma').select('*').eq('turma_id', id).or(`aluno_id.is.null,aluno_id.eq.${getID(usuarioLogado)}`).order('data', {ascending: true});
        const { data: progresso } = await _supabase.from('progresso_aluno').select('*').eq('aluno_id', getID(usuarioLogado));

        const containerCronograma = document.getElementById('l-ag-prof');
        
        let listaFiltrada = ag || [];
        if (filtro === 'pendente') {
            listaFiltrada = ag.filter(a => !progresso?.some(p => p.cronograma_id === a.id && p.nota !== null));
        } else if (filtro === 'concluido') {
            listaFiltrada = ag.filter(a => progresso?.some(p => p.cronograma_id === a.id && p.nota !== null));
        }

        containerCronograma.innerHTML = listaFiltrada.map(a => {
            const p = progresso?.find(x => x.cronograma_id === a.id);
            let badgeNota = `<span style="background:#eee; color:#666; padding:3px 8px; border-radius:6px; font-size:0.75rem;">Pendente</span>`;
            if (p && p.nota !== null) {
                badgeNota = `<span style="background:#27ae60; color:white; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">Nota: ${p.nota}</span>`;
            } else if (p && p.concluido) {
                badgeNota = `<span style="background:#f39c12; color:white; padding:3px 8px; border-radius:6px; font-size:0.75rem;">Aguardando correção</span>`;
            }

            return `
                <div class="item-cronograma" style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:white; border-radius:10px; border:1px solid #eee;">
                    <div>
                        <span style="font-size:0.75rem; color:#666; font-weight:bold; text-transform:uppercase;">Entrega · ${a.data || 'Sem data'}</span><br>
                        <strong style="font-size:1rem; color:#222;">${a.titulo}</strong>
                        <p style="font-size:0.8rem; color:#666; margin-top:2px;">Atividade avaliada e disponível para consulta.</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        ${badgeNota}
                        <button id="btn-det-${a.id}" class="btn-enviar" style="padding:6px 14px; font-size:0.8rem; background:var(--dark-green); width:auto;">Ver detalhes</button>
                    </div>
                </div>`;
        }).join('') || "<p style='text-align:center; color:#666; padding:20px;'>Nenhuma atividade encontrada.</p>";

        listaFiltrada.forEach(a => {
            const btn = document.getElementById(`btn-det-${a.id}`);
            if (btn) btn.onclick = () => abrirDetalhesAluno(a, () => carregarCronogramaAluno(document.getElementById('filtro-status-aluno').value));
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
    modal.querySelector('#det-data').innerText = `📅 Dia: ${item.data || '---'} | ⏰ ${item.hora_inicio || '--:--'} às ${item.hora_fim || '--:--'}`;
    modal.querySelector('#det-conteudo').innerText = item.conteudo_estudo || "Nenhum conteúdo descrito.";
    modal.querySelector('#det-atividades').innerText = item.atividades_descricao || "Nenhuma instrução específica.";

    if (item.link_material) { 
        modal.querySelector('#area-link').style.display = "block"; 
        modal.querySelector('#det-link').href = item.link_material; 
    }

    const secaoEntrega = modal.querySelector('#secao-entrega');
    const { data: entrega } = await _supabase.from('progresso_aluno').select('*').eq('aluno_id', getID(usuarioLogado)).eq('cronograma_id', item.id).maybeSingle();

    if (entrega) {
        secaoEntrega.innerHTML = `
            <div style="background: #fafffa; padding: 15px; border-radius: 10px; border: 1px solid #27ae60;">
                <p style="color: #27ae60; font-weight: bold; margin-bottom:5px;">✓ Atividade Entregue</p>
                <a href="${entrega.resposta_url}" target="_blank" style="font-size: 0.85rem; color: #2980b9; display:block; margin-bottom:10px;">🔗 Ver arquivo enviado</a>
                ${entrega.nota !== null ? `
                    <p style="font-size: 1.1rem; color: #27ae60; font-weight:bold;">Nota: ${entrega.nota}</p>
                    <p style="font-style: italic; font-size: 0.85rem; color: #555; margin-top:5px;">Feedback: "${entrega.feedback || 'Sem comentários'}"</p>
                ` : `<p style="font-size: 0.85rem; color: #f39c12; font-weight:bold;">Aguardando correção do professor...</p>`}
            </div>
        `;
    } else {
        modal.querySelector('#btn-enviar-estudo').onclick = async () => {
            const url = modal.querySelector('#link-estudante').value;
            if(!url) {
                await mostrarAlerta("Insira o link do seu trabalho!", "Atenção");
                return;
            }
            
            const { error } = await _supabase.from('progresso_aluno').upsert([{ 
                aluno_id: getID(usuarioLogado), 
                cronograma_id: item.id, 
                resposta_url: url, 
                concluido: true, 
                data_conclusao: new Date().toISOString() 
            }], { onConflict: 'aluno_id, cronograma_id' });
            
            if(error) {
                await mostrarAlerta("Erro: " + error.message, "Erro");
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




btnHome.onclick = () => { renderizarHome(); if (usuarioLogado) btnLoginMenu.textContent = "Meu painel"; };
btnLoginMenu.onclick = renderizarDashboard;