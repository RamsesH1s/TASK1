import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { seedExample } from "./seed";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Rota de teste
app.get("/", (_, res) => {
  res.json({ message: "✅ API de Relatórios ativa e funcionando!" });
});

// Criar relatório
app.post("/relatorios", async (req, res) => {
  try {
    const novo = await prisma.relatorio.create({ data: req.body });
    res.status(201).json(novo);
  } catch (error) {
    res.status(400).json({ error: "Erro ao salvar relatório", detalhes: error });
  }
});

// Listar relatórios
app.get("/relatorios", async (_, res) => {
  const relatorios = await prisma.relatorio.findMany({
    include: { ocorrencias: { include: { vitimas: true, autores: true, endereco: true } } },
    orderBy: { id: "desc" }
  });
  res.json(relatorios);
});

// Buscar relatório por ID
app.get("/relatorios/:id", async (req, res) => {
  const id = Number(req.params.id);
  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
    include: { ocorrencias: { include: { vitimas: true, autores: true, endereco: true } } }
  });

  if (!relatorio) return res.status(404).json({ error: "Relatório não encontrado" });
  res.json(relatorio);
});

// Deletar relatório
app.delete("/relatorios/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.relatorio.delete({ where: { id } });
    res.json({ message: "Relatório excluído com sucesso!" });
  } catch {
    res.status(404).json({ error: "Relatório não encontrado" });
  }
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  await seedExample(prisma);
  app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
}

startServer();
