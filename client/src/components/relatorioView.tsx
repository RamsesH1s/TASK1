// Simple API service for relatorios
// Exports: listarRelatorios, criarRelatorio, deletarRelatorio

export interface Relatorio {
  id: number;
  numero: string;
  data: string;
  idAnalista: string;
  lesaoAps: string;
  lesaoTerceiros: string;
  mvi: string;
  instBanc: string;
  outras: string;
  ocorrencias: any[];
}

const API_BASE = ((globalThis as any).process?.env?.REACT_APP_API_BASE) || ''; // set REACT_APP_API_BASE in .env if needed

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export async function listarRelatorios(): Promise<Relatorio[]> {
  // GET /relatorios
  try {
    const res = await fetch(`${API_BASE}/relatorios`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<Relatorio[]>(res);
  } catch (err) {
    // Fallback to empty array in case the backend is not available during development
    console.error("listarRelatorios error:", err);
    return [];
  }
}

export async function criarRelatorio(payload: Omit<Relatorio, "id"> | any): Promise<Relatorio | null> {
  // POST /relatorios
  try {
    const res = await fetch(`${API_BASE}/relatorios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Relatorio>(res);
  } catch (err) {
    console.error("criarRelatorio error:", err);
    return null;
  }
}

export async function deletarRelatorio(id: number): Promise<void> {
  // DELETE /relatorios/:id
  try {
    const res = await fetch(`${API_BASE}/relatorios/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    await handleResponse<void>(res);
  } catch (err) {
    console.error("deletarRelatorio error:", err);
    throw err;
  }
}