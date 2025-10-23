-- CreateTable
CREATE TABLE "Relatorio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "idAnalista" TEXT NOT NULL,
    "lesaoAps" TEXT NOT NULL,
    "lesaoTerceiros" TEXT NOT NULL,
    "mvi" TEXT NOT NULL,
    "instBanc" TEXT NOT NULL,
    "outras" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "tipificacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "relatorioId" INTEGER NOT NULL,
    CONSTRAINT "Ocorrencia_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "Relatorio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "municipio" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "referencia" TEXT,
    "ocorrenciaId" INTEGER NOT NULL,
    CONSTRAINT "Endereco_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vitima" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "nascimento" TEXT,
    "filiacao" TEXT,
    "orcrim" TEXT,
    "registros" TEXT,
    "imagem" TEXT,
    "ocorrenciaId" INTEGER NOT NULL,
    CONSTRAINT "Vitima_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Autor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "nascimento" TEXT,
    "filiacao" TEXT,
    "orcrim" TEXT,
    "registros" TEXT,
    "imagem" TEXT,
    "ocorrenciaId" INTEGER NOT NULL,
    CONSTRAINT "Autor_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Endereco_ocorrenciaId_key" ON "Endereco"("ocorrenciaId");
