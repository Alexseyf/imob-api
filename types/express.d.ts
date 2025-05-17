import "express";

declare module "express" {
  export interface Request {
    tipoUsuario?: string;
    userLogadoId?: string;
    userLogadoNome?: string;
  }
}