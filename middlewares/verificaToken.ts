import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express'

interface TokenI {
  userLogadoId: number
  userLogadoNome: string
  tipoUsuario: string
}

export function verificaToken(req: Request | any, res: Response, next: NextFunction) {
  const { authorization } = req.headers

  if (!authorization) {
    res.status(401).json({ error: "Token não informado" })
    return
  }

  const token = authorization.split(" ")[1]

  try {
    const decode = jwt.verify(token, process.env.JWT_KEY as string)
    const { userLogadoId, userLogadoNome, tipoUsuario} = decode as TokenI
    req.userLogadoId   = userLogadoId
    req.userLogadoNome = userLogadoNome
    req.tipoUsuario    = tipoUsuario    
    next()
  } catch (error) {
    res.status(401).json({ error: "Token inválido" })
  }
}