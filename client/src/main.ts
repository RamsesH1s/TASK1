import { gerarPdfRelatorio } from './pdf';
import type { MsgType, OcorrenciaMVI, SecaoKey } from './type';
import { municipiosPiaui, municipiosRegiaoMetropolitanaLower } from './data/municipios';

const $ = <T extends Element>(sel: string, root: Document | Element = document) => root.querySelector<T>(sel)!;
const $$ = (sel: string, root: Document | Element = document) => Array.from(root.querySelectorAll(sel));

/* ---------------- Toast ---------------- */
function toast(msg: string, tipo: MsgType = 'info'){
  const el = $('#toast') as HTMLDivElement;
  el.className = 'toast'; // reset
  el.textContent = msg;
  el.classList.add('show', tipo === 'sucesso' ? 'success' : tipo === 'erro' ? 'error' : 'info');
  setTimeout(()=>{ el.classList.remove('show') }, 2500);
}

/* ---------------- Helpers ---------------- */
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const formatDate = (d: string) => d ? d.split('-').reverse().join('/') : '';

/* ---------------- Estado MVI ---------------- */
let dadosMVI: OcorrenciaMVI[] = [];

/* ---------------- Inicialização ---------------- */
function initDefaults(){
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2,'0');
  const dd = String(hoje.getDate()).padStart(2,'0');
  const iso = `${yyyy}-${mm}-${dd}`;
  ($('#dataRelatorio') as HTMLInputElement).value = iso;

  const num = `REL-${yyyy}${mm}${dd}-${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`;
  ($('#numeroRelatorio') as HTMLInputElement).value = num;

  const d7 = new Date(hoje); d7.setDate(hoje.getDate() - 7);
  ($('#dataInicial') as HTMLInputElement).value = d7.toISOString().slice(0,10);
  ($('#dataFinal') as HTMLInputElement).value = iso;

  renderResumoMVI();
}

/* ---------------- Toggle seções (sim/não) ---------------- */
function toggleSection(target: SecaoKey, show: boolean){
  const box = $(`#campos-${target}`) as HTMLDivElement;
  const msg = $(`#msg-${target}`) as HTMLParagraphElement;
  box.hidden = !show;
  msg.style.display = show ? 'none' : 'block';

  // limpar quando desliga
  if (!show){
    const container = $(`#ocorrencias-${target}`) as HTMLDivElement;
    container.innerHTML = '';

    if (target === 'mvi'){
      dadosMVI = [];
      renderResumoMVI();
    }
  }
}

/* ---------------- Criação de blocos de ocorrência ---------------- */
function mkMunicipioOptions(){
  return municipiosPiaui.map(m => `<option value="${m}">${m}</option>`).join('');
}

function mkPessoaBlock(clsPrefix: 'vitima'|'autor', isMVI: boolean){
  const common = (name: string, type = 'text') => `<label>${name.toUpperCase()}:</label><input type="${type}" class="${clsPrefix}-${name.toLowerCase()}" />`;

  return /* html */`
    <div class="grupo-${clsPrefix}">
      ${common('nome')}
      ${common('cpf')}
      <label>DATA DE NASCIMENTO:</label><input type="date" class="${clsPrefix}-nascimento" />
      ${common('filiacao')}
      ${common('orcrim')}
      <label>REGISTROS CRIMINAIS:</label><textarea class="${clsPrefix}-registros"></textarea>

      <div class="campo-imagem">
        <label>IMAGEM:</label>
        <input type="file" class="upload-imagem" accept="image/*" />
        <img class="preview-imagem" />
        <button type="button" class="btn-remove-img">Remover imagem</button>
      </div>

      <div class="divider"></div>
      <div style="display:flex; justify-content:flex-end;">
        <button type="button" class="btn btn-danger-outline" data-remover="${clsPrefix}">Remover ${clsPrefix === 'vitima' ? 'Vítima' : 'Autor'}</button>
      </div>
    </div>
  `;
}

function mkLocalBlock(prefix = ''){
  const pref = (c:string) => prefix ? `${prefix}-${c}` : c;
  return /* html */`
    <div class="local-ocorrencia">
      <h4>Local da Ocorrência</h4>
      <div class="grid-localizacao">
        <div>
          <label>MUNICÍPIO:</label>
          <select class="${pref('municipio')}">
            <option value="">Selecione o município</option>
            ${mkMunicipioOptions()}
          </select>
        </div>
        <div>
          <label>BAIRRO:</label>
          <input type="text" class="${pref('bairro')}" />
        </div>
        <div class="full">
          <label>LOGRADOURO:</label>
          <input type="text" class="${pref('logradouro')}" />
        </div>
        <div>
          <label>NÚMERO:</label>
          <input type="text" class="${pref('numero')}" />
        </div>
        <div>
          <label>COMPLEMENTO:</label>
          <input type="text" class="${pref('complemento')}" />
        </div>
        <div class="full">
          <label>PONTO DE REFERÊNCIA:</label>
          <input type="text" class="${pref('referencia')}" />
        </div>
      </div>
    </div>
  `;
}

function mkOcorrenciaBlock(tipo: SecaoKey): string{
  const idxContainer = $(`#ocorrencias-${tipo}`) as HTMLDivElement;
  const numero = idxContainer.children.length + 1;

  const cabecalho = /* html */`
    <span class="numero-ocorrencia">${numero}</span>
    <button type="button" class="btn-remove-oc" data-remover="ocorrencia">×</button>
  `;

  // Bancária tem um campo adicional "tipo de ocorrência"
  const extraBancaria = (tipo === 'instituicoes-bancarias')
    ? /* html */`
      <label>TIPO DE OCORRÊNCIA:</label>
      <input type="text" class="tipo-bancaria" value="${
        (($('#tipo-ocorrencia-bancaria') as HTMLSelectElement).value || '').toUpperCase() || ''
      }" />
      <label>NOME DA INSTITUIÇÃO:</label><input type="text" class="nome-instituicao" />
      <label>ENDEREÇO:</label><input type="text" class="endereco-instituicao" />
    ` : '';

  // MVI precisa de classes específicas para tracking
  const isMVI = (tipo === 'mvi');
  const prefix = isMVI ? 'mvi' : '';

  const bloco = /* html */`
    <div class="grupo-ocorrencia" data-tipo="${tipo}">
      ${cabecalho}
      ${mkLocalBlock(prefix || undefined)}
      <label>PROTOCOLO:</label><input type="text" class="${isMVI ? 'protocolo-mvi' : 'protocolo'}" />
      <label>TIPIFICAÇÃO PENAL:</label><textarea class="${isMVI ? 'tipificacao-mvi' : 'tipificacao'}"></textarea>
      ${extraBancaria}

      <div class="quadro-qualificacao">
        <h4>VÍTIMA(S)</h4>
        <div class="vitimas-container">
          ${mkPessoaBlock('vitima', isMVI)}
        </div>
        <button type="button" class="btn btn-secondary" data-add-vitima>Incluir Vítima</button>
      </div>

      <div class="quadro-qualificacao">
        <h4>AUTOR(ES)</h4>
        <div class="autores-container">
          ${mkPessoaBlock('autor', isMVI)}
        </div>
        <button type="button" class="btn btn-secondary" data-add-autor>Incluir Autor</button>
      </div>

      <label>DESCRIÇÃO:</label><textarea class="${isMVI ? 'descricao-mvi' : 'descricao'}"></textarea>
    </div>
  `;
  return bloco;
}

/* ---------------- Atualização Resumo MVI ---------------- */
function renderResumoMVI(){
  const tbody = $('#tabela-resumo-mvi') as HTMLTableSectionElement;
  tbody.innerHTML = '';

  const capitalArr: Record<string, string[]> = {};
  const interiorArr: Record<string, string[]> = {};

  dadosMVI.forEach(oc => {
    const mun = (oc.endereco.municipio || '').trim();
    if (!mun) return;

    const keyLower = mun.toLowerCase();
    const bucket = municipiosRegiaoMetropolitanaLower.has(keyLower) ? capitalArr : interiorArr;
    const nomesVitimas = (oc.vitimas || []).map(v => v.nome).filter(Boolean);
    if (!bucket[mun]) bucket[mun] = [];
    bucket[mun].push(...(nomesVitimas.length ? nomesVitimas : ['***']));
  });

  const buildGroup = (title: string, group: Record<string, string[]>) => {
    const entries = Object.entries(group);
    if (entries.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td rowspan="1">${title}</td>
        <td rowspan="1" class="qtd-cell">0</td>
        <td colspan="2" class="municipio-cell">***</td>
        <td class="nome-cell">***</td>
      `;
      tbody.appendChild(tr);
      return 0;
    }

    const qtdOcorr = Object.values(group).length;
    entries.forEach(( [mun, vitimas], i ) => {
      const tr = document.createElement('tr');
      tr.innerHTML = (i === 0)
        ? `
          <td rowspan="${entries.length}">${title}</td>
          <td rowspan="${entries.length}" class="qtd-cell">${qtdOcorr}</td>
          <td colspan="2" class="municipio-cell">${mun}</td>
          <td class="nome-cell">${vitimas.join('<br>')}</td>
        `
        : `
          <td colspan="2" class="municipio-cell">${mun}</td>
          <td class="nome-cell">${vitimas.join('<br>')}</td>
        `;
      tbody.appendChild(tr);
    });
    return qtdOcorr;
  };

  const qtdCap = buildGroup('CAPITAL/REGIÃO METROPOLITANA', capitalArr);
  const qtdInt = buildGroup('INTERIOR', interiorArr);

  const trTotal = document.createElement('tr');
  trTotal.className = 'total-row';
  trTotal.innerHTML = `
    <td><strong>TOTAL</strong></td>
    <td class="qtd-cell">${qtdCap + qtdInt}</td>
    <td colspan="3">MVI</td>
  `;
  tbody.appendChild(trTotal);
}

/* ---------------- Event Handlers ---------------- */
function onToggleChange(e: Event){
  const target = e.target as HTMLInputElement;
  if (target.type !== 'radio') return;
  const wrapper = (target.closest('.toggle-row') as HTMLElement);
  if (!wrapper) return;
  const sec = wrapper.dataset.target as SecaoKey;
  if (!sec) return;

  toggleSection(sec, target.value === 'sim');

  if (sec === 'mvi' && target.value === 'sim'){
    dadosMVI = [];
    renderResumoMVI();
  }
}

function onAddOcorrencia(e: Event){
  const btn = (e.target as HTMLElement).closest('[data-add]') as HTMLButtonElement | null;
  if (!btn) return;
  const tipo = btn.dataset.add as SecaoKey;
  const container = $(`#ocorrencias-${tipo}`) as HTMLDivElement;

  // Para a seção bancária, só cria após selecionar o tipo
  if (tipo === 'instituicoes-bancarias'){
    const sel = $('#tipo-ocorrencia-bancaria') as HTMLSelectElement;
    if (!sel.value){
      toast('Selecione o tipo de ocorrência bancária', 'info'); return;
    }
  }

  container.insertAdjacentHTML('beforeend', mkOcorrenciaBlock(tipo));

  // Se for MVI, adiciona item vazio no estado
  if (tipo === 'mvi'){
    dadosMVI.push({
      id: uuid(),
      protocolo: '',
      tipificacao: '',
      descricao: '',
      endereco: { municipio:'', bairro:'', logradouro:'', numero:'', complemento:'', referencia:'' },
      vitimas: [{ nome: '' }],
      autores: [{ nome: '' }]
    });
    renderResumoMVI();
  }
}

function onRemoveClick(e: Event){
  const btnOc = (e.target as HTMLElement).closest('[data-remover="ocorrencia"]') as HTMLButtonElement | null;
  const btnVit = (e.target as HTMLElement).closest('[data-remover="vitima"]') as HTMLButtonElement | null;
  const btnAut = (e.target as HTMLElement).closest('[data-remover="autor"]') as HTMLButtonElement | null;

  if (btnOc){
    const oc = btnOc.closest('.grupo-ocorrencia') as HTMLDivElement;
    const tipo = oc.dataset.tipo as SecaoKey;
    const container = oc.parentElement!;
    const index = Array.from(container.children).indexOf(oc);

    if (tipo === 'mvi' && index > -1){
      dadosMVI.splice(index, 1);
      renderResumoMVI();
    }
    oc.remove();

    // renumerar
    Array.from(container.children).forEach((el, i) => {
      const badge = (el as HTMLElement).querySelector('.numero-ocorrencia')!;
      badge.textContent = String(i + 1);
    });
    return;
  }

  if (btnVit){
    const group = btnVit.closest('.grupo-vitima') as HTMLDivElement;
    const oc = group.closest('.grupo-ocorrencia')!;
    const tipo = oc.getAttribute('data-tipo');
    group.remove();
    if (tipo === 'mvi') syncMVIFromDOM(oc);
    return;
  }

  if (btnAut){
    const group = btnAut.closest('.grupo-autor') as HTMLDivElement;
    const oc = group.closest('.grupo-ocorrencia')!;
    const tipo = oc.getAttribute('data-tipo');
    group.remove();
    if (tipo === 'mvi') syncMVIFromDOM(oc);
    return;
  }
}

function onAddPessoa(e: Event){
  const btnVit = (e.target as HTMLElement).closest('[data-add-vitima]') as HTMLButtonElement | null;
  const btnAut = (e.target as HTMLElement).closest('[data-add-autor]') as HTMLButtonElement | null;
  if (!btnVit && !btnAut) return;

  const oc = (btnVit || btnAut)!.closest('.grupo-ocorrencia') as HTMLDivElement;
  const isMVI = oc.dataset.tipo === 'mvi';

  if (btnVit){
    const wrap = oc.querySelector('.vitimas-container') as HTMLDivElement;
    wrap.insertAdjacentHTML('beforeend', mkPessoaBlock('vitima', isMVI));
    if (isMVI) syncMVIFromDOM(oc);
  }else if (btnAut){
    const wrap = oc.querySelector('.autores-container') as HTMLDivElement;
    wrap.insertAdjacentHTML('beforeend', mkPessoaBlock('autor', isMVI));
    if (isMVI) syncMVIFromDOM(oc);
  }
}

function onImagemUpload(e: Event){
  const input = e.target as HTMLInputElement;
  if (!input || input.type !== 'file' || !input.classList.contains('upload-imagem')) return;
  const file = input.files?.[0];
  const preview = input.parentElement!.querySelector('.preview-imagem') as HTMLImageElement;
  const btnRemove = input.parentElement!.querySelector('.btn-remove-img') as HTMLButtonElement;

  if (!file){ preview.style.display='none'; btnRemove.style.display='none'; preview.src=''; return; }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result as string;
    preview.style.display = 'block';
    btnRemove.style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function onRemoveImagem(e: Event){
  const btn = (e.target as HTMLElement).closest('.btn-remove-img') as HTMLButtonElement | null;
  if (!btn) return;
  const wrap = btn.parentElement!;
  const input = wrap.querySelector('.upload-imagem') as HTMLInputElement;
  const preview = wrap.querySelector('.preview-imagem') as HTMLImageElement;
  input.value = '';
  preview.src = '';
  preview.style.display = 'none';
  btn.style.display = 'none';
}

function syncMVIFromDOM(ocNode: Element){
  // Determina índice da ocorrência MVI no container
  const container = ocNode.parentElement!;
  const index = Array.from(container.children).indexOf(ocNode as Element);
  if (index < 0 || !dadosMVI[index]) return;

  const oc = dadosMVI[index];

  const sel = (cls: string) => ocNode.querySelector(`.${cls}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

  oc.endereco.municipio = (sel('mvi-municipio') as HTMLSelectElement)?.value || '';
  oc.endereco.bairro = sel('mvi-bairro')?.value || '';
  oc.endereco.logradouro = sel('mvi-logradouro')?.value || '';
  oc.endereco.numero = sel('mvi-numero')?.value || '';
  oc.endereco.complemento = sel('mvi-complemento')?.value || '';
  oc.endereco.referencia = sel('mvi-referencia')?.value || '';

  oc.protocolo = sel('protocolo-mvi')?.value || '';
  oc.tipificacao = (sel('tipificacao-mvi') as HTMLTextAreaElement)?.value || '';
  oc.descricao = (sel('descricao-mvi') as HTMLTextAreaElement)?.value || '';

  const vitNodes = $$('.grupo-vitima', ocNode);
  oc.vitimas = vitNodes.map(vn => {
    const nome = (vn.querySelector('.vitima-nome') as HTMLInputElement)?.value || '';
    const cpf = (vn.querySelector('.vitima-cpf') as HTMLInputElement)?.value || '';
    const nascimento = (vn.querySelector('.vitima-nascimento') as HTMLInputElement)?.value || '';
    const filiacao = (vn.querySelector('.vitima-filiacao') as HTMLInputElement)?.value || '';
    const orcrim = (vn.querySelector('.vitima-orcrim') as HTMLInputElement)?.value || '';
    const registros = (vn.querySelector('.vitima-registros') as HTMLTextAreaElement)?.value || '';
    return { nome, cpf, nascimento, filiacao, orcrim, registros };
  });

  const autNodes = $$('.grupo-autor', ocNode);
  oc.autores = autNodes.map(an => {
    const nome = (an.querySelector('.autor-nome') as HTMLInputElement)?.value || '';
    const cpf = (an.querySelector('.autor-cpf') as HTMLInputElement)?.value || '';
    const nascimento = (an.querySelector('.autor-nascimento') as HTMLInputElement)?.value || '';
    const filiacao = (an.querySelector('.autor-filiacao') as HTMLInputElement)?.value || '';
    const orcrim = (an.querySelector('.autor-orcrim') as HTMLInputElement)?.value || '';
    const registros = (an.querySelector('.autor-registros') as HTMLTextAreaElement)?.value || '';
    return { nome, cpf, nascimento, filiacao, orcrim, registros };
  });

  renderResumoMVI();
}

function onInputChange(e: Event){
  const input = e.target as HTMLElement;
  if (!input) return;

  // Se ocorrer em um bloco MVI, sincroniza
  const oc = input.closest('.grupo-ocorrencia') as HTMLDivElement | null;
  if (oc && oc.dataset.tipo === 'mvi'){
    syncMVIFromDOM(oc);
  }
}

/* ---------------- Ações principais ---------------- */
function pesquisarRelatorio(){
  const termo = ($('#campoPesquisa') as HTMLInputElement).value.trim();
  if (!termo){ toast('Digite um ID ou número de relatório para pesquisar', 'info'); return; }

  toast('Pesquisando relatório...', 'info');

  setTimeout(() => {
    if (termo.toLowerCase() === '123'){
      ($('#dataRelatorio') as HTMLInputElement).value = '2023-10-15';
      ($('#numeroRelatorio') as HTMLInputElement).value = 'REL-2023-123';
      ($('#idAnalista') as HTMLInputElement).value = 'ANL-456';

      // liga todas as seções
      (document.querySelector('input[name="lesao_aps"][value="sim"]') as HTMLInputElement).checked = true;
      (document.querySelector('input[name="lesao_terceiros"][value="sim"]') as HTMLInputElement).checked = true;
      (document.querySelector('input[name="mvi"][value="sim"]') as HTMLInputElement).checked = true;
      (document.querySelector('input[name="instituicoes_bancarias"][value="sim"]') as HTMLInputElement).checked = true;
      (document.querySelector('input[name="outras_ocorrencias"][value="sim"]') as HTMLInputElement).checked = true;

      toggleSection('lesao-aps', true);
      toggleSection('lesao-terceiros', true);
      toggleSection('mvi', true);
      toggleSection('instituicoes-bancarias', true);
      toggleSection('outras-ocorrencias', true);

      toast('Relatório encontrado e carregado com sucesso!', 'sucesso');
    }else{
      toast('Nenhum relatório encontrado com esse ID/número', 'erro');
    }
  }, 800);
}

function enviarRelatorio(){
  const dataRelatorio = ($('#dataRelatorio') as HTMLInputElement).value;
  const numeroRelatorio = ($('#numeroRelatorio') as HTMLInputElement).value;
  const idAnalista = ($('#idAnalista') as HTMLInputElement).value;

  if (!dataRelatorio || !numeroRelatorio || !idAnalista){
    toast('Preencha data, número e ID do analista', 'erro'); return;
  }

  const payload = {
    data: dataRelatorio,
    numero: numeroRelatorio,
    analista: idAnalista,
    lesaoAps: (document.querySelector('input[name="lesao_aps"]:checked') as HTMLInputElement)?.value || 'nao',
    lesaoTerceiros: (document.querySelector('input[name="lesao_terceiros"]:checked') as HTMLInputElement)?.value || 'nao',
    mvi: (document.querySelector('input[name="mvi"]:checked') as HTMLInputElement)?.value || 'nao',
    instBanc: (document.querySelector('input[name="instituicoes_bancarias"]:checked') as HTMLInputElement)?.value || 'nao',
    outras: (document.querySelector('input[name="outras_ocorrencias"]:checked') as HTMLInputElement)?.value || 'nao',
    dadosMVI
  };

  console.debug('Enviando...', payload);
  toast('Enviando relatório...', 'info');
  setTimeout(()=>{
    toast(`Relatório enviado com sucesso! ID: DB-${Math.floor(Math.random()*1000)}`, 'sucesso');
  }, 1000);
}

function limparFormulario(){
  if (!confirm('Tem certeza que deseja limpar todos os dados do formulário?')) return;

  ($('#dataRelatorio') as HTMLInputElement).value = '';
  ($('#numeroRelatorio') as HTMLInputElement).value = '';
  ($('#idAnalista') as HTMLInputElement).value = '';
  ($('#campoPesquisa') as HTMLInputElement).value = '';
  ($('#dataInicial') as HTMLInputElement).value = '';
  ($('#dataFinal') as HTMLInputElement).value = '';

  $$('input[type="radio"][value="nao"], input[type="radio"][value="não"]').forEach(r => (r as HTMLInputElement).checked = true);

  ['lesao-aps','lesao-terceiros','mvi','instituicoes-bancarias','outras-ocorrencias'].forEach(sec => {
    toggleSection(sec as SecaoKey, false);
  });

  dadosMVI = [];
  renderResumoMVI();

  ($('#demonstrativo-periodo') as HTMLDivElement).textContent = 'Selecione um período para visualizar os dados';

  toast('Formulário limpo com sucesso!', 'sucesso');
}

function carregarPeriodo(){
  const ini = ($('#dataInicial') as HTMLInputElement).value;
  const fim = ($('#dataFinal') as HTMLInputElement).value;

  if (!ini || !fim){ toast('Selecione ambas as datas (inicial e final)', 'info'); return; }
  if (new Date(ini) > new Date(fim)){ toast('A data inicial não pode ser maior que a final', 'erro'); return; }

  toast(`Carregando dados de ${formatDate(ini)} a ${formatDate(fim)}...`, 'info');

  setTimeout(()=>{
    // Simulação
    const dados = {
      dataInicial: ini, dataFinal: fim,
      capital: 3, interior: 2, total: 5,
      municipiosCapital: ['Teresina','José de Freitas'],
      nomesCapital: [
        ['João Silva','Maria Santos'],
        ['Pedro Oliveira']
      ],
      municipiosInterior: ['Picos','Piripiri'],
      nomesInterior: [
        ['Carlos Souza'],
        ['Ana Lima']
      ]
    };

    const cont = $('#demonstrativo-periodo') as HTMLDivElement;
    cont.innerHTML = `
      <h4>Período: ${formatDate(dados.dataInicial)} a ${formatDate(dados.dataFinal)}</h4>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr class="header-row"><th colspan="5">MORTE VIOLENTA INTENCIONAL — MVI</th></tr>
            <tr><th>REGIÃO</th><th>QTD</th><th colspan="2">MUNICÍPIO</th><th>NOME</th></tr>
          </thead>
          <tbody>
            ${(() => {
              const capRows = dados.municipiosCapital.map((mun, i) => `
                <tr>
                  ${i===0?`<td rowspan="${dados.municipiosCapital.length}">CAPITAL/REGIÃO METROPOLITANA</td><td rowspan="${dados.municipiosCapital.length}" class="qtd-cell">${dados.capital}</td>`:''}
                  <td colspan="2" class="municipio-cell">${mun}</td>
                  <td class="nome-cell">${dados.nomesCapital[i].join('<br>')}</td>
                </tr>`).join('');

              const intRows = dados.municipiosInterior.map((mun, i) => `
                <tr>
                  ${i===0?`<td rowspan="${dados.municipiosInterior.length}">INTERIOR</td><td rowspan="${dados.municipiosInterior.length}" class="qtd-cell">${dados.interior}</td>`:''}
                  <td colspan="2" class="municipio-cell">${mun}</td>
                  <td class="nome-cell">${dados.nomesInterior[i].join('<br>')}</td>
                </tr>`).join('');

              return capRows + intRows + `
                <tr class="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td class="qtd-cell">${dados.total}</td>
                  <td colspan="3">MVI</td>
                </tr>`;
            })()}
          </tbody>
        </table>
      </div>
    `;
    toast('Dados carregados com sucesso!', 'sucesso');
  }, 700);
}

function gerarPDF(){
  const data = ($('#dataRelatorio') as HTMLInputElement).value || 'NÃO INFORMADO';
  const numero = ($('#numeroRelatorio') as HTMLInputElement).value || 'NÃO INFORMADO';
  const idAnalista = ($('#idAnalista') as HTMLInputElement).value || 'NÃO INFORMADO';

  const lesaoAps = (document.querySelector('input[name="lesao_aps"]:checked') as HTMLInputElement)?.value || 'nao';
  const lesaoTerceiros = (document.querySelector('input[name="lesao_terceiros"]:checked') as HTMLInputElement)?.value || 'nao';
  const mvi = (document.querySelector('input[name="mvi"]:checked') as HTMLInputElement)?.value || 'nao';
  const instBanc = (document.querySelector('input[name="instituicoes_bancarias"]:checked') as HTMLInputElement)?.value || 'nao';
  const outras = (document.querySelector('input[name="outras_ocorrencias"]:checked') as HTMLInputElement)?.value || 'nao';

  // prepara resumo MVI para o PDF
  const groupByRegion = (isCapital: boolean) => {
    const out: { municipio: string; vitimas: string[] }[] = [];
    const filtered = dadosMVI.filter(oc => {
      const mun = (oc.endereco.municipio || '').toLowerCase();
      const capital = municipiosRegiaoMetropolitanaLower.has(mun);
      return isCapital ? capital : !capital;
    });
    const map: Record<string, string[]> = {};
    filtered.forEach(oc => {
      const mun = oc.endereco.municipio || '***';
      if (!map[mun]) map[mun] = [];
      const vs = oc.vitimas.map(v => v.nome).filter(Boolean);
      map[mun].push(...(vs.length ? vs : ['***']));
    });
    Object.entries(map).forEach(([municipio, vitimas]) => out.push({ municipio, vitimas }));
    return out;
  };

  gerarPdfRelatorio({
    data, numero, idAnalista,
    secoes: {
      lesaoAps, lesaoTerceiros, mvi, instBanc, outras
    },
    resumoMvi: (mvi === 'sim')
      ? { capital: groupByRegion(true), interior: groupByRegion(false) }
      : { capital: [], interior: [] }
  });

  toast('PDF gerado com sucesso!', 'sucesso');
}

/* ---------------- Listeners globais ---------------- */
function bindEvents(){
  document.addEventListener('change', onToggleChange);
  document.addEventListener('click', onAddOcorrencia);
  document.addEventListener('click', onRemoveClick);
  document.addEventListener('click', onAddPessoa);
  document.addEventListener('change', onImagemUpload);
  document.addEventListener('click', onRemoveImagem);
  document.addEventListener('input', onInputChange);

  $('#btnPesquisar').addEventListener('click', pesquisarRelatorio);
  $('#btnCarregarPeriodo').addEventListener('click', carregarPeriodo);

  $('#btnGerarPdf').addEventListener('click', gerarPDF);
  $('#btnEnviar').addEventListener('click', enviarRelatorio);
  $('#btnLimpar').addEventListener('click', limparFormulario);

  // Habilita seção bancária assim que escolher o tipo (primeira ocorrência)
  const tipoBanc = $('#tipo-ocorrencia-bancaria') as HTMLSelectElement;
  tipoBanc.addEventListener('change', () => {
    const container = $('#ocorrencias-instituicoes-bancarias') as HTMLDivElement;
    if (tipoBanc.value && container.children.length === 0){
      container.insertAdjacentHTML('beforeend', mkOcorrenciaBlock('instituicoes-bancarias'));
    }
  });
}

/* ---------------- Boot ---------------- */
initDefaults();
bindEvents();
