export const API_URL = "http://localhost:4000";

export async function listarRelatorios() {
  const response = await fetch(`${API_URL}/relatorios`);
  if (!response.ok) throw new Error("Erro ao listar relatórios");
  return response.json();
}

export async function criarRelatorio(dados: any) {
  const response = await fetch(`${API_URL}/relatorios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
  if (!response.ok) throw new Error("Erro ao criar relatório");
  return response.json();
}

export async function deletarRelatorio(id: number) {
  const response = await fetch(`${API_URL}/relatorios/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao deletar relatório");
  return response.json();
}
