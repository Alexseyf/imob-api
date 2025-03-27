import { PrismaClient, TipoImovel } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { verificaToken } from "../middlewares/verificaToken";
import { verificaAdmin } from "../middlewares/verificaAdmin";
import { verificaSuporte } from "../middlewares/verificaSuporte";

const prisma = new PrismaClient(
//   {
//   log: [
//     {
//       emit: 'event',
//       level: 'query',
//     },
//     {
//       emit: 'stdout',
//       level: 'error',
//     },
//     {
//       emit: 'stdout',
//       level: 'info',
//     },
//     {
//       emit: 'stdout',
//       level: 'warn',
//     },
//   ],
// }
// )

// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query)
//   console.log('Params: ' + e.params)
//   console.log('Duration: ' + e.duration + 'ms')
// }
)


const router = Router();

const imovelSchema = z.object({
  area: z.number(),
  valor: z.number(),
  endereco: z.string(),
  bairro: z.string(),
  isArquivado: z.boolean().optional(),
  tipoImovel: z.nativeEnum(TipoImovel),
  usuarioId: z.number(),
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

router.post("/", verificaToken, verificaSuporte,  async (req, res) => {
  const valida = imovelSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  try {
    const imovel = await prisma.imovel.create({
      data: { ...valida.data },
    });
    res.status(201).json(imovel);
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
