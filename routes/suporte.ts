import { passwordCheck } from '../utils/passwordUtils'
import { PrismaClient, TipoUsuario, TipoImovel } from "@prisma/client"
import { Router, Request, Response } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaToken } from '../middlewares/verificaToken'
import { verificaSuporte } from '../middlewares/verificaSuporte'

const prisma = new PrismaClient()
const router = Router()

const adminSchema = z.object({
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  isArquivado: z.boolean().optional(),
  tipoUsuario: z.nativeEnum(TipoUsuario)
})

const imovelSchema = z.object({
  area: z.number(),
  valor: z.number(),
  endereco: z.string(),
  bairro: z.string(),
  isArquivado: z.boolean().optional(),
  tipoImovel: z.nativeEnum(TipoImovel),
  usuarioId: z.string(),
  quarto: z.number(),
  banheiro: z.number(),
  cozinha: z.number(),
  sala: z.number(),
  garagem: z.number(),
  suite: z.number(),
  areaServico: z.number(),
  foto: z.string(),
})

router.get("/", verificaToken, verificaSuporte, async (req: Request | any, res: Response) => {
  try {
    const admins = await prisma.usuario.findMany()
    res.status(200).json(admins)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", verificaToken, verificaSuporte, async (req: Request | any, res: Response) => {
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
    const admin = await prisma.usuario.create({
      data: { ...valida.data, senha: hash }
    })
    res.status(201).json(admin)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/imovel", verificaToken, verificaSuporte, async (req: Request | any, res) => {
  const valida = imovelSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const imovel = await prisma.imovel.create({
      data: { ...valida.data }
    })

    await prisma.log.create({
      data: {
        descricao: "Imóvel cadastrado",
        complemento: `Imóvel ${imovel.id} cadastrado por suporte`,
        usuarioId: req.userLogadoId,
        usuarioTipo: TipoUsuario.SUPORTE
      }
    })
    
    res.status(201).json(imovel)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/imoveis-por-bairro", verificaToken, verificaSuporte, async (req: Request | any, res: Response) => {
  try {
    const imoveisPorBairro = await prisma.$queryRaw`
      SELECT 
        bairro, 
        COUNT(*)::INTEGER as total_imoveis 
      FROM 
        imoveis 
      WHERE 
        "isArquivado" = false 
      GROUP BY 
        bairro 
      ORDER BY 
        total_imoveis DESC
    `;
    
    const resultado = (imoveisPorBairro as any[]).map(item => ({
      bairro: item.bairro,
      total_imoveis: Number(item.total_imoveis)
    }));
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar contagem de imóveis por bairro:", error);
    res.status(400).json({ erro: "Erro ao buscar contagem de imóveis por bairro", detalhes: error });
  }
});

router.get("/admins-agendamentos", verificaToken, verificaSuporte, async (req: Request | any, res: Response) => {
  try {
    const admins = await prisma.usuario.findMany({
      where: {
        tipoUsuario: TipoUsuario.ADMIN,
        isArquivado: false
      },
      select: {
        id: true,
        nome: true
      }
    });
 
    const resultado = await Promise.all(
      admins.map(async (admin) => {
        const agendamentosConfirmados = await prisma.agendamento.count({
          where: {
            adminId: admin.id,
            confirmado: true
          }
        });

        const agendamentosNaoConfirmados = await prisma.agendamento.count({
          where: {
            adminId: admin.id,
            confirmado: false
          }
        });
        
        return {
          id: admin.id,
          nome: admin.nome,
          agendamentos: {
            confirmados: agendamentosConfirmados,
            naoConfirmados: agendamentosNaoConfirmados,
            total: agendamentosConfirmados + agendamentosNaoConfirmados
          }
        };
      })
    );
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar admins e agendamentos:", error);
    res.status(400).json({ erro: "Erro ao buscar admins e agendamentos", detalhes: error });
  }
});

router.get("/clientes", verificaToken, verificaSuporte, async (req, res) => {
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

router.get("/listar-admins", verificaToken, verificaSuporte, async (req: Request | any, res: Response) => {
  try {
    const admins = await prisma.usuario.findMany({
      where: {
        tipoUsuario: TipoUsuario.ADMIN,
        isArquivado: false
      },
      select: {
        id: true,
        nome: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    res.status(200).json(admins);
  } catch (error) {
    console.error("Erro ao buscar administradores:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

export default router