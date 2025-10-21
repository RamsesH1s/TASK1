import { jsPDF } from 'jspdf';

function line(pdf: jsPDF, txt: string, x: number, y: number){
  pdf.text(txt, x, y);
  return y + 7;
}

export interface PdfResumoMVI {
  capital: { municipio: string; vitimas: string[] }[];
  interior: { municipio: string; vitimas: string[] }[];
}

export function gerarPdfRelatorio(opts: {
  data: string;
  numero: string;
  idAnalista: string;
  secoes: {
    lesaoAps: string;
    lesaoTerceiros: string;
    mvi: string;
    instBanc: string;
    outras: string;
  };
  resumoMvi?: PdfResumoMVI;
}) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = 18;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('RELATÓRIO DE AÇÕES CORRENTES', 105, y, { align: 'center' });

  y += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  y = line(pdf, `Data: ${opts.data || 'NÃO INFORMADO'}`, 20, y);
  y = line(pdf, `Número: ${opts.numero || 'NÃO INFORMADO'}`, 20, y);
  y = line(pdf, `ID Analista: ${opts.idAnalista || 'NÃO INFORMADO'}`, 20, y);
  y += 5;

  const sectionTitle = (t: string) => {
    if (y > 260){ pdf.addPage(); y = 18; }
    pdf.setFont('helvetica','bold'); pdf.setFontSize(14);
    y = line(pdf, t, 20, y);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(12);
  };

  const sectionItem = (t: string) => {
    if (y > 270){ pdf.addPage(); y = 18; }
    y = line(pdf, t, 25, y);
  };

  // 1.0
  sectionTitle('1.0 OCORRÊNCIAS ENVOLVENDO AGENTES PÚBLICOS DE SEGURANÇA');
  sectionItem(`1.1 Lesão de APS: ${opts.secoes.lesaoAps.toUpperCase()}`);
  if (opts.secoes.lesaoAps === 'não' || opts.secoes.lesaoAps === 'nao') sectionItem('   SEM ALTERAÇÃO');
  sectionItem(`1.2 Morte ou lesão de terceiros: ${opts.secoes.lesaoTerceiros.toUpperCase()}`);
  if (opts.secoes.lesaoTerceiros === 'não' || opts.secoes.lesaoTerceiros === 'nao') sectionItem('   SEM ALTERAÇÃO');

  // 2.0
  sectionTitle('2.0 MORTE VIOLENTA INTENCIONAL - MVI');
  sectionItem(`2.1 Ocorrência de MVI: ${opts.secoes.mvi.toUpperCase()}`);
  if (opts.secoes.mvi === 'não' || opts.secoes.mvi === 'nao') sectionItem('   SEM ALTERAÇÃO');

  // 3.0
  sectionTitle('3.0 OCORRÊNCIAS COM INSTITUIÇÕES FINANCEIRAS');
  sectionItem(`3.1 Instituições Bancárias: ${opts.secoes.instBanc.toUpperCase()}`);
  if (opts.secoes.instBanc === 'não' || opts.secoes.instBanc === 'nao') sectionItem('   SEM ALTERAÇÃO');

  // 4.0
  sectionTitle('4.0 OUTRAS OCORRÊNCIAS RELEVANTES');
  sectionItem(`4.1 Ocorrências relevantes: ${opts.secoes.outras.toUpperCase()}`);
  if (opts.secoes.outras === 'não' || opts.secoes.outras === 'nao') sectionItem('   SEM ALTERAÇÃO');

  // 5.0 Resumo MVI
  sectionTitle('5.0 RESUMO DE MORTES VIOLENTAS INTENCIONAIS - MVI');
  if (!opts.resumoMvi || (opts.resumoMvi.capital.length === 0 && opts.resumoMvi.interior.length === 0)){
    sectionItem('SEM ALTERAÇÃO');
  }else{
    const drawList = (titulo: string, arr: {municipio: string; vitimas: string[]}[]) => {
      sectionItem(`${titulo}: ${arr.length} ocorrência(s)`);
      arr.forEach(item => {
        sectionItem(`   Município: ${item.municipio}`);
        (item.vitimas.length ? item.vitimas : ['***']).forEach(v => {
          sectionItem(`     Vítima: ${v}`);
        });
      });
    };
    drawList('CAPITAL/REGIÃO METROPOLITANA', opts.resumoMvi.capital);
    drawList('INTERIOR', opts.resumoMvi.interior);
    sectionItem(`TOTAL: ${opts.resumoMvi.capital.length + opts.resumoMvi.interior.length} ocorrência(s)`);
  }

  pdf.save('relatorio-pm-pi.pdf');
}
