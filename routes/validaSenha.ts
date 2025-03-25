import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from "@prisma/client";
import { passwordCheck } from '../utils/passwordUtils'

const prisma = new PrismaClient(); 
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, code, novaSenha } = req.body;

  if (!email || !code || !novaSenha) {
    return res.status(400).send('Todos os campos devem ser informados');
  }

  const erros = passwordCheck(novaSenha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
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

  const isCodeValid = await bcrypt.compare(code, usuario.resetToken);
  const isTokenExpired = usuario.resetTokenExpires ? new Date() > usuario.resetTokenExpires : true;

  if (!isCodeValid || isTokenExpired) {
    return res.status(400).send('Código inválido ou expirado');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);

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

export default router;