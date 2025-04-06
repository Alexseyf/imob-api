"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const verificaToken_1 = require("../middlewares/verificaToken");
const verificaSuporte_1 = require("../middlewares/verificaSuporte");
const prisma = new client_1.PrismaClient();
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
const router = (0, express_1.Router)();
const imovelSchema = zod_1.z.object({
    area: zod_1.z.number(),
    valor: zod_1.z.number(),
    endereco: zod_1.z.string(),
    bairro: zod_1.z.string(),
    isArquivado: zod_1.z.boolean().optional(),
    tipoImovel: zod_1.z.nativeEnum(client_1.TipoImovel),
    usuarioId: zod_1.z.number(),
    quarto: zod_1.z.number(),
    banheiro: zod_1.z.number(),
    cozinha: zod_1.z.number(),
    sala: zod_1.z.number(),
    garagem: zod_1.z.number(),
    suite: zod_1.z.number(),
    areaServico: zod_1.z.number(),
    foto: zod_1.z.string(),
});
router.get("/", async (req, res) => {
    try {
        const imoveis = await prisma.imovel.findMany();
        res.status(200).json(imoveis);
    }
    catch (error) {
        res.status(400).json(error);
    }
});
router.post("/", async (req, res) => {
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
    }
    catch (error) {
        res.status(400).json(error);
    }
});
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const imovel = await prisma.imovel.findUnique({
            where: { id: Number(id) },
        });
        res.status(200).json(imovel);
    }
    catch (error) {
        res.status(400).json(error);
    }
});
router.delete("/:id", verificaToken_1.verificaToken, verificaSuporte_1.verificaSuporte, async (req, res) => {
    const { id } = req.params;
    try {
        const imovel = await prisma.imovel.delete({
            where: { id: Number(id) },
        });
        res.status(200).json(imovel);
    }
    catch (error) {
        res.status(400).json(error);
    }
});
exports.default = router;
