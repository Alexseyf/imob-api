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