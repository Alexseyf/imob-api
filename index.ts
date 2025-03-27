import express from 'express'
import routesAdmins from './routes/admins'
import routesImoveis from './routes/imoveis'
import routesLogin from './routes/login'
import routesRecuperaSenha from './routes/recuperaSenha'
import routesValidaSenha from './routes/validaSenha'

const app = express()
const port = 3001

app.use(express.json())

app.use("/admins", routesAdmins)
app.use("/imoveis", routesImoveis)
app.use("/login", routesLogin)
app.use("/recupera-senha", routesRecuperaSenha)
app.use("/valida-senha", routesValidaSenha)

app.get('/', (req, res) => {
  res.send('API - ALUGUEL DE IMÓVEIS')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})