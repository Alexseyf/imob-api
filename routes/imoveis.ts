import { PrismaClient, TipoImovel, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { verificaToken } from "../middlewares/verificaToken";
import { verificaAdmin } from "../middlewares/verificaAdmin";
import { verificaSuporte } from "../middlewares/verificaSuporte";

const prisma = new PrismaClient();

const router = Router();

const imovelSchema = z.object({
  area: z.number(),
  valor: z.number(),
  endereco: z.string(),
  bairro: z.string(),
  isArquivado: z.boolean().optional(),
  tipoImovel: z.nativeEnum(TipoImovel),
  usuarioId: z.string(),
  quarto: z.number(),
  banheiro: z.number(),
  cozinha: z.number(),
  sala: z.number(),
  garagem: z.number(),
  suite: z.number(),
  areaServico: z.number(),
  foto: z.string(),
});

router.get("/", async (req, res) => {
  try {
    const imoveis = await prisma.imovel.findMany();
    res.status(200).json(imoveis);
  } catch (error) {
    res.status(400).json(error);
  }
});

// router.post("/", async (req, res) => {
//   const valida = imovelSchema.safeParse(req.body);
//   if (!valida.success) {
//     res.status(400).json({ erro: valida.error });
//     return;
//   }

//   try {
//     const imovel = await prisma.imovel.create({
//       data: { ...valida.data },
//     });
//     res.status(201).json(imovel);
//   } catch (error) {
//     res.status(400).json(error);
//   }
// });

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const imovel = await prisma.imovel.findUnique({
      where: { id: Number(id) },
    });
    res.status(200).json(imovel);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;
  const termoNumero = Number(termo);

  if (isNaN(termoNumero)) {
    try {      const tipoImovelValido = Object.values(TipoImovel).includes(termo.toUpperCase() as TipoImovel);
      const imovel = await prisma.imovel.findMany({
        where: {
          OR: [
            tipoImovelValido ? { tipoImovel: { equals: termo.toUpperCase() as TipoImovel } } : {},            { 
              endereco: { 
                contains: termo,
                mode: Prisma.QueryMode.insensitive
              } 
            },            { 
              bairro: { 
                contains: termo,
                mode: Prisma.QueryMode.insensitive
              } 
            },
            
          ].filter(Boolean),
        },
      });
      res.status(200).json(imovel);
    } catch (error) {
      res.status(400).json(error);
    }
  } else {
    if (termoNumero <= 50000) {
      try {
        const imovel = await prisma.imovel.findMany({
          where: {
            valor: { lte: termoNumero },
          },
        });
        res.status(200).json(imovel);
      } catch (error) {
        res.status(400).json(error);
      }
    }
  }
});

router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const imovel = await prisma.imovel.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(imovel);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
