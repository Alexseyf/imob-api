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
    from: "imobiliaria@example.com",
    to: email,
    subject: "Recuperação de Senha - Imobiliária",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 5px;">Recuperação de Senha</h2>
        <p style="color: #7f8c8d; font-size: 16px;">Imobiliária</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p>Olá <strong>${usuario.nome}</strong>,</p>
        <p>Recebemos uma solicitação para recuperar sua senha de acesso.</p>
        <p>Utilize o código abaixo para prosseguir com a redefinição:</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
        <h3 style="color: #2c3e50; font-size: 24px; letter-spacing: 5px; margin: 0;">${code}</h3>
      </div>
      
      <div style="margin-top: 25px;">
        <p>Este código é válido por <strong>5 minutos</strong>.</p>
        <p>Se você não solicitou a recuperação de senha, por favor, ignore este e-mail.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
        <p>Este é um e-mail automático, por favor não responda.</p>
        <p>Em caso de dúvidas, entre em contato com nosso suporte.</p>
      </div>
    </div>
    `,
    text: `Olá ${usuario.nome},

Recebemos uma solicitação para recuperar sua senha de acesso.
    
Seu código de verificação é: ${code}
    
Este código é válido por 5 minutos.
    
Se você não solicitou a recuperação de senha, por favor, ignore este e-mail.
    
Este é um e-mail automático, por favor não responda.
Em caso de dúvidas, entre em contato com nosso suporte.
    
Atenciosamente,
Equipe Imobiliária`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("Código de recuperação enviado para o email");
  } catch (error) {
    res.status(500).send("Falha ao enviar o email");
  }
});

export default router;
