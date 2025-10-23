import { PrismaClient } from "@prisma/client";

export async function seedExample(prisma: PrismaClient) {
  const existentes = await prisma.relatorio.count();
  if (existentes > 0) {
    console.log("📦 Banco já contém relatórios, seed ignorado.");
    return;
  }

  console.log("🌱 Criando relatório de exemplo...");

  await prisma.relatorio.create({
    data: {
      numero: "REL-2025-001",
      data: new Date(),
      idAnalista: "THA-001",
      lesaoAps: "Sim",
      lesaoTerceiros: "Não",
      mvi: "Sim",
      instBanc: "Banco do Brasil",
      outras: "Nenhuma",
      ocorrencias: {
        create: [
          {
            tipo: "MVI",
            protocolo: "PROT-2025-0001",
            tipificacao: "Art. 129 - Lesão corporal",
            descricao:
              "Durante uma abordagem em via pública, indivíduo em motocicleta foi abordado por suspeita de irregularidade. Houve resistência, resultando em lesão leve.",
            endereco: {
              create: {
                municipio: "Presidente Dutra",
                bairro: "Centro",
                logradouro: "Rua João Lisboa",
                numero: "123",
                complemento: "Próximo à Praça da Matriz",
                referencia: "Frente à padaria São José"
              }
            },
            vitimas: {
              create: [
                {
                  nome: "José Carlos dos Santos",
                  cpf: "123.456.789-00",
                  nascimento: "1987-06-12",
                  filiacao: "Filho de Maria e Antônio dos Santos",
                  orcrim: "Nenhuma",
                  registros: "Sem antecedentes",
                  imagem: ""
                }
              ]
            },
            autores: {
              create: [
                {
                  nome: "Raimundo Pereira da Silva",
                  cpf: "987.654.321-00",
                  nascimento: "1979-03-21",
                  filiacao: "Filho de Joana e Pedro da Silva",
                  orcrim: "Suspeita de envolvimento com grupo local",
                  registros: "Lesão corporal em 2018",
                  imagem: ""
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("✅ Relatório de exemplo criado com sucesso!");
}
