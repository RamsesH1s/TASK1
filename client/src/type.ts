export type MsgType = 'sucesso' | 'erro' | 'info';

export interface Endereco {
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  referencia: string;
}

export interface Pessoa {
  nome: string;
  cpf?: string;
  nascimento?: string;
  filiacao?: string;
  orcrim?: string;
  registros?: string;
  imagemDataUrl?: string | null;
}

export interface OcorrenciaBase {
  id: string; // uuid simples
  protocolo: string;
  tipificacao: string;
  descricao: string;
  endereco: Endereco;
  vitimas: Pessoa[];
  autores: Pessoa[];
}

export interface OcorrenciaMVI extends OcorrenciaBase {
  // para MVI precisamos ler vitimas por nome e classificar por região
}

export type SecaoKey =
  | 'lesao-aps'
  | 'lesao-terceiros'
  | 'mvi'
  | 'instituicoes-bancarias'
  | 'outras-ocorrencias';
