import { PrismaClient, TipoImovel } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { verificaToken } from "../middlewares/verificaToken";
import { verificaAdmin } from "../middlewares/verificaAdmin";

const prisma = new PrismaClient();
const router = Router();

const imovelSchema = z.object({
  area: z.number(),
  valor: z.number(),
  endereco: z.string(),
  bairro: z.string(),
  isArquivado: z.boolean().optional(),
  TipoImovel: z.nativeEnum(TipoImovel),
  usuarioId: z.number()
});

const dependenciaSchema = z.object({
  quarto: z.number(),
  banheiro: z.number(),
  cozinha: z.number(),
  sala: z.number(),
  garagem: z.number(),
  suite: z.number(),
  areaServico: z.number(),
  imovelId: z.number()
});

router.get("/", async (req, res) => {
  try {
    const admins = await prisma.imovel.findMany();
    res.status(200).json(admins);
  } catch (error) {
    res.status(400).json(error);
  }
});

// router.post("/", verificaToken, verificaAdmin, async (req, res) => {
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

export default router;
