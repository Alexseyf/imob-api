"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaSuporte = verificaSuporte;
const client_1 = require("@prisma/client");
function verificaSuporte(req, res, next) {
    if (req.tipoUsuario !== client_1.TipoUsuario.SUPORTE) {
        return res.status(403).json({ erro: "Acesso negado. Apenas suporte técnico pode acessar." });
    }
    next();
}
