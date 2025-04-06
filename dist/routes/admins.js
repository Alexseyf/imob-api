"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passwordUtils_1 = require("../utils/passwordUtils");
const client_1 = require("@prisma/client");
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const adminSchema = zod_1.z.object({
    nome: zod_1.z.string(),
    email: zod_1.z.string(),
    senha: zod_1.z.string(),
    isArquivado: zod_1.z.boolean().optional(),
    tipoUsuario: zod_1.z.nativeEnum(client_1.TipoUsuario)
});
router.get("/", async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany();
        res.status(200).json(usuarios);
    }
    catch (error) {
        res.status(400).json(error);
    }
});
router.post("/", async (req, res) => {
    const valida = adminSchema.safeParse(req.body);
    if (!valida.success) {
        res.status(400).json({ erro: valida.error });
        return;
    }
    const erros = (0, passwordUtils_1.passwordCheck)(valida.data.senha);
    if (erros.length > 0) {
        res.status(400).json({ erro: erros.join("; ") });
        return;
    }
    const salt = bcrypt_1.default.genSaltSync(12);
    const hash = bcrypt_1.default.hashSync(valida.data.senha, salt);
    try {
        const usuario = await prisma.usuario.create({
            data: { ...valida.data, senha: hash }
        });
        res.status(201).json(usuario);
    }
    catch (error) {
        res.status(400).json(error);
    }
});
exports.default = router;
