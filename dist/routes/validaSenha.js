"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const passwordUtils_1 = require("../utils/passwordUtils");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    const { email, code, novaSenha } = req.body;
    if (!email || !code || !novaSenha) {
        return res.status(400).send('Todos os campos devem ser informados');
    }
    const erros = (0, passwordUtils_1.passwordCheck)(novaSenha);
    if (erros.length > 0) {
        res.status(400).json({ erro: erros.join("; ") });
        return;
    }
    const usuario = await prisma.usuario.findFirst({
        where: {
            email,
        },
    });
    if (!usuario) {
        return res.status(404).send('Email não encontrado');
    }
    if (!usuario.resetToken) {
        return res.status(400).send('Código inválido ou expirado');
    }
    const isCodeValid = await bcrypt_1.default.compare(code, usuario.resetToken);
    const isTokenExpired = usuario.resetTokenExpires ? new Date() > usuario.resetTokenExpires : true;
    if (!isCodeValid || isTokenExpired) {
        return res.status(400).send('Código inválido ou expirado');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt_1.default.hash(novaSenha, saltRounds);
    await prisma.usuario.update({
        where: {
            id: usuario.id,
        },
        data: {
            senha: hashedPassword,
            resetToken: null,
            resetTokenExpires: null,
        },
    });
    res.status(200).send('Senha alterada com sucesso');
});
exports.default = router;
