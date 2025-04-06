"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admins_1 = __importDefault(require("./routes/admins"));
const suporte_1 = __importDefault(require("./routes/suporte"));
const imoveis_1 = __importDefault(require("./routes/imoveis"));
const login_1 = __importDefault(require("./routes/login"));
const recuperaSenha_1 = __importDefault(require("./routes/recuperaSenha"));
const validaSenha_1 = __importDefault(require("./routes/validaSenha"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 3001;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
    exposedHeaders: ['Authorization', 'Access-Control-Allow-Origin'],
}));
app.use("/admins", admins_1.default);
app.use("/suporte", suporte_1.default);
app.use("/imoveis", imoveis_1.default);
app.use("/login", login_1.default);
app.use("/recupera-senha", recuperaSenha_1.default);
app.use("/valida-senha", validaSenha_1.default);
app.get('/', (req, res) => {
    res.send('API - ALUGUEL DE IMÓVEIS');
});
app.use((req, res, next) => {
    next();
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        error: 'Algo deu errado!',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
// app.listen(port, () => {
//   console.log(`Servidor rodando na porta: ${port}`)
// })
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log('Servidor rodando na porta 3001');
    });
}
exports.default = app;
