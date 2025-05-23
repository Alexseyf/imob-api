import { passwordCheck } from '../utils/passwordUtils'
import { PrismaClient, TipoUsuario } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaToken } from '../middlewares/verificaToken'
import { verificaAdmin } from '../middlewares/verificaAdmin'

const prisma = new PrismaClient()
const router = Router()

const adminSchema = z.object({
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  isArquivado: z.boolean().optional(),
  tipoUsuario: z.nativeEnum(TipoUsuario)
})

router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany()
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/clientes", verificaToken, verificaAdmin, async (req, res) => {
  try {
    const clientes = await prisma.usuario.findMany({
      where: {
        tipoUsuario: TipoUsuario.CLIENTE,
        isArquivado: false
      },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        isArquivado: true,
        tipoUsuario: true,
        clienteAgendamentos: {
          select: {
            id: true,
            data: true,
            confirmado: true,
            imovel: {
              select: {
                id: true,
                endereco: true,
                bairro: true
              }
            }
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    res.status(200).json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

router.post("/",  async (req, res) => {
  const valida = adminSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const erros = passwordCheck(valida.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(valida.data.senha, salt)

  try {
    const usuario = await prisma.usuario.create({
      data: { ...valida.data, senha: hash }
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router