import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"
import { Router } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("Email deve ser informado");
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString();

  const saltRounds = 10;
  const hashedCode = await bcrypt.hash(code, saltRounds);

  const usuario = await prisma.usuario.findFirst({
    where: {
      email,
    },
  });

  if (!usuario) {
    return res.status(404).send("Email não encontrado");
  }

  await prisma.usuario.update({
    where: {
      id: usuario.id,
    },
    data: {
      resetToken: hashedCode,
      resetTokenExpires: new Date(Date.now() + 300000),
    },
  });

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: "your-email@example.com",
    to: email,
    subject: "Recuperação de senha",
    text: `${usuario.nome}, seu código de verificação é: ${code}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Código de recuperação envidado para o email");
  } catch (error) {
    res.status(500).send("Falha ao enviar o email");
  }
});

export default router;
