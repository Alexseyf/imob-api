"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaCliente = verificaCliente;
const client_1 = require("@prisma/client");
function verificaCliente(req, res, next) {
    if (req.tipoUsuario !== client_1.TipoUsuario.CLIENTE) {
        return res.status(403).json({ erro: "Acesso negado. Apenas clientes podem acessar." });
    }
    next();
}
