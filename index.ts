import express from 'express'
import routesAdmins from './routes/admins'
import routesSuporte from './routes/suporte'
import routesImoveis from './routes/imoveis'
import routesLogin from './routes/login'
import routesRecuperaSenha from './routes/recuperaSenha'
import routesValidaSenha from './routes/validaSenha'
import cors from 'cors'

const app = express()
const port = 3001

app.use(express.json())
app.use(cors(
  {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'], 
    exposedHeaders: ['Authorization', 'Access-Control-Allow-Origin'],
  }
))

app.use("/admins", routesAdmins)
app.use("/suporte", routesSuporte)
app.use("/imoveis", routesImoveis)
app.use("/login", routesLogin)
app.use("/recupera-senha", routesRecuperaSenha)
app.use("/valida-senha", routesValidaSenha)

app.get('/', (req, res) => {
  res.send('API - ALUGUEL DE IMÓVEIS')
})

app.use((req, res, next) => {
  next()
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  console.error('Stack:', err.stack)
  res.status(500).json({ 
    error: 'Algo deu errado!',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// app.listen(port, () => {
//   console.log(`Servidor rodando na porta: ${port}`)
// })

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3001')
  })
}

export default app