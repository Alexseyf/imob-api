import { PrismaClient } from "@prisma/client";
import { Router, Request } from "express";
import { z } from "zod";
import { verificaToken } from "../middlewares/verificaToken";
import { verificaCliente } from "../middlewares/verificaCliente";
import { verificaAdmin } from "../middlewares/verificaAdmin";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

interface CustomRequest extends Request {
  userLogadoId?: string;
  userLogadoNome?: string;
  tipoUsuario?: string;
}

dotenv.config();
const prisma = new PrismaClient();

const router = Router();

const agendamentoSchema = z.object({
  data: z.coerce.date(),
  imovelId: z.number(),
  adminId: z.string().optional(),
});

router.post(
  "/solicitar",
  verificaToken,
  verificaCliente,
  async (req: CustomRequest, res) => {
    const { userLogadoId } = req;

    if (!userLogadoId) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const valida = agendamentoSchema.safeParse(req.body);
    if (!valida.success) {
      return res.status(400).json({ erro: valida.error });
    }

    try {
      const imovel = await prisma.imovel.findUnique({
        where: { id: valida.data.imovelId },
      });

      if (!imovel) {
        return res.status(404).json({ erro: "Imóvel não encontrado" });
      }

      const adminId = valida.data.adminId || imovel.usuarioId;

      const admin = await prisma.usuario.findFirst({
        where: {
          id: adminId,
          tipoUsuario: "ADMIN",
        },
      });

      if (!admin) {
        return res.status(404).json({ erro: "Administrador não encontrado" });
      }

      const agendamento = await prisma.agendamento.create({
        data: {
          data: valida.data.data,
          imovelId: valida.data.imovelId,
          clienteId: userLogadoId,
          adminId: adminId,
        },
        include: {
          imovel: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      await prisma.log.create({
        data: {
          descricao: `Agendamento Criado`,
          complemento: `Cliente ${
            agendamento.cliente.nome
          } agendou visita ao imóvel ${
            agendamento.imovel.id
          } em ${agendamento.data.toISOString()}`,
          usuarioId: userLogadoId,
          usuarioTipo: "CLIENTE",
        },
      });

      res.status(201).json(agendamento);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
);

router.get(
  "/meus",
  verificaToken,
  verificaCliente,
  async (req: CustomRequest, res) => {
    const { userLogadoId } = req;

    if (!userLogadoId) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    try {
      const agendamentos = await prisma.agendamento.findMany({
        where: {
          clienteId: userLogadoId,
        },
        include: {
          imovel: true,
          admin: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          data: "asc",
        },
      });

      res.status(200).json(agendamentos);
    } catch (error) {
      console.error("Erro ao listar agendamentos:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
);

const confirmacaoSchema = z.object({
  agendamentoId: z.number(),
  mensagemAdicional: z.string().optional(),
});

router.post(
  "/confirmar",
  verificaToken,
  verificaAdmin,
  async (req: CustomRequest, res) => {
    const { userLogadoId } = req;

    if (!userLogadoId) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const valida = confirmacaoSchema.safeParse(req.body);
    if (!valida.success) {
      return res.status(400).json({ erro: valida.error });
    }

    try {
      const agendamento = await prisma.agendamento.findUnique({
        where: {
          id: valida.data.agendamentoId,
        },
        include: {
          imovel: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      if (!agendamento) {
        return res.status(404).json({ erro: "Agendamento não encontrado" });
      }

      if (agendamento.adminId !== userLogadoId) {
        return res
          .status(403)
          .json({
            erro: "Você não tem permissão para confirmar este agendamento",
          });
      }

      if (agendamento.confirmado) {
        return res
          .status(400)
          .json({ erro: "Agendamento já foi confirmado anteriormente" });
      }

      const agendamentoAtualizado = await prisma.agendamento.update({
        where: {
          id: valida.data.agendamentoId,
        },
        data: {
          confirmado: true,
        },
        include: {
          imovel: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
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

      const dataFormatada = agendamento.data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const enderecoCompleto = `${agendamento.imovel.endereco}, ${agendamento.imovel.bairro}`;

      const mensagemAdicional = valida.data.mensagemAdicional
        ? `\n\nInformações adicionais: ${valida.data.mensagemAdicional}`
        : "";

      const mailOptions = {
        from: "imobiliaria@example.com",
        to: agendamento.cliente.email,
        subject: "Confirmação de Agendamento de Visita",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin-bottom: 5px;">Confirmação de Agendamento</h2>
            <p style="color: #7f8c8d; font-size: 16px;">Imobiliária</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <p>Olá <strong>${agendamento.cliente.nome}</strong>,</p>
            <p>Seu agendamento para visitar o imóvel foi confirmado!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #2c3e50; font-size: 18px; margin-top: 0;">Detalhes da visita:</h3>
            <p><strong>Data e horário:</strong> ${dataFormatada}</p>
            <p><strong>Endereço:</strong> ${enderecoCompleto}</p>
            <p><strong>Corretor responsável:</strong> ${agendamento.admin.nome}</p>
            <p><strong>Contato do corretor:</strong> ${agendamento.admin.email}</p>
            ${valida.data.mensagemAdicional ? `<p><strong>Informações adicionais:</strong> ${valida.data.mensagemAdicional}</p>` : ''}
          </div>
          
          <div style="margin-top: 25px;">
            <p>Aguardamos sua visita!</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #7f8c8d; font-size: 12px;">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>Em caso de dúvidas, entre em contato com nosso suporte.</p>
            <p style="margin-top: 10px;">Atenciosamente,<br>Equipe Imobiliária</p>
          </div>
        </div>
        `,
        text: `Olá ${agendamento.cliente.nome},

Seu agendamento para visitar o imóvel foi confirmado!

Detalhes da visita:
- Data e horário: ${dataFormatada}
- Endereço: ${enderecoCompleto}
- Corretor responsável: ${agendamento.admin.nome}
- Contato do corretor: ${agendamento.admin.email}${mensagemAdicional}

Aguardamos sua visita!

Atenciosamente,
Equipe Imobiliária`,
      };

      await transporter.sendMail(mailOptions);
      await prisma.log.create({
        data: {
          descricao: `Agendamento Confirmado`,
          complemento: `Admin ${
            agendamento.admin.nome
          } confirmou visita do cliente ${agendamento.cliente.nome} ao imóvel ${
            agendamento.imovel.id
          } em ${agendamento.data.toISOString()}`,
          usuarioId: userLogadoId,
          usuarioTipo: "ADMIN",
        },
      });

      res.status(200).json({
        mensagem:
          "Agendamento confirmado com sucesso. Email de confirmação enviado ao cliente.",
        agendamento: agendamentoAtualizado,
      });
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
);

router.get(
  "/admin",
  verificaToken,
  verificaAdmin,
  async (req: CustomRequest, res) => {
    const { userLogadoId } = req;

    if (!userLogadoId) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    try {
      const agendamentos = await prisma.agendamento.findMany({
        where: {
          adminId: userLogadoId,
        },
        include: {
          imovel: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: [
          { confirmado: "asc" },
          { data: "asc" },
        ],
      });

      res.status(200).json(agendamentos);
    } catch (error) {
      console.error("Erro ao listar agendamentos do admin:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
);

router.get(
  "/todos",
  verificaToken,
  verificaAdmin,
  async (req: CustomRequest, res) => {
    const { userLogadoId } = req;

    if (!userLogadoId) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    try {
      const agendamentos = await prisma.agendamento.findMany({
        include: {
          imovel: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: [
          { confirmado: "asc" },
          { data: "asc" },
        ],
      });

      res.status(200).json(agendamentos);
    } catch (error) {
      console.error("Erro ao listar todos os agendamentos:", error);
      res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
);

export default router;
