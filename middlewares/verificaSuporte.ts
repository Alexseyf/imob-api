import { Request, Response, NextFunction } from "express";
import { TipoUsuario } from "@prisma/client";

interface CustomRequest extends Request {
  userLogadoId?: number
  userLogadoNome?: string
  tipoUsuario?: string
}

export function verificaSuporte(req: CustomRequest, res: Response, next: NextFunction) {
  if (req.tipoUsuario !== TipoUsuario.SUPORTE) {
    return res.status(403).json({ erro: "Acesso negado. Apenas suporte técnico pode acessar." });
  }
  next();
}