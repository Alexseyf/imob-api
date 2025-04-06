"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    const { email, senha } = req.body;
    const msg = "Login ou senha incorretos";
    if (!email || !senha) {
        res.status(400).json({ erro: msg });
        return;
    }
    try {
        const usuario = await prisma.usuario.findFirst({
            where: { email }
        });
        if (usuario == null) {
            res.status(400).json({ erro: msg });
            return;
        }
        if (bcrypt_1.default.compareSync(senha, usuario.senha)) {
            const token = jsonwebtoken_1.default.sign({
                userLogadoId: usuario.id,
                userLogadoNome: usuario.nome,
                tipoUsuario: usuario.tipoUsuario
            }, process.env.JWT_KEY, { expiresIn: "1h" });
            res.status(200).json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                usuarioTipo: usuario.tipoUsuario,
                token
            });
            await prisma.log.create({
                data: {
                    descricao: "Login Realizado",
                    complemento: `Usuário: ${usuario.email}`,
                    usuarioId: usuario.id,
                    usuarioTipo: usuario.tipoUsuario
                }
            });
        }
        else {
            await prisma.log.create({
                data: {
                    descricao: "Tentativa de Acesso Inválida",
                    complemento: `Usuário: ${usuario.email}`,
                    usuarioId: usuario.id,
                    usuarioTipo: usuario.tipoUsuario
                }
            });
            res.status(400).json({ erro: msg });
        }
    }
    catch (error) {
        res.status(400).json(error);
    }
});
exports.default = router;
