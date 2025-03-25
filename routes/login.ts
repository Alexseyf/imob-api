import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  const msg = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: msg })
    return
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { email }
    })

    if (usuario == null) {
      res.status(400).json({ erro: msg })
      return
    }
    if (bcrypt.compareSync(senha, usuario.senha)) {
      const token = jwt.sign({
        userLogadoId: usuario.id,
        userLogadoNome: usuario.nome,
        tipoUsuario: usuario.tipoUsuario
      },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        usuarioTipo: usuario.tipoUsuario,
        token
      })
      await prisma.log.create({
        data: { 
          descricao: "Login Realizado",  
          complemento: `Usuário: ${usuario.email}`,
          usuarioId: usuario.id,
          usuarioTipo: usuario.tipoUsuario
        }
      })
    } else {
      await prisma.log.create({
        data: { 
          descricao: "Tentativa de Acesso Inválida", 
          complemento: `Usuário: ${usuario.email}`,
          usuarioId: usuario.id,
          usuarioTipo: usuario.tipoUsuario
        }
      })

      res.status(400).json({ erro: msg })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router