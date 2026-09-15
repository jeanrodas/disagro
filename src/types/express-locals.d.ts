import 'express-serve-static-core';

/** Datos que los middlewares dejan en res.locals para los controladores. */
declare module 'express-serve-static-core' {
  interface Locals {
    /** Id del cliente autenticado por su cookie de sesión (lo asigna requiereSesionCliente). */
    clienteId?: string;
  }
}
