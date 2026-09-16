import { Router } from 'express';
import * as adminAuthController from '../controllers/admin-auth.controller';
import * as adminClientesController from '../controllers/admin-clientes.controller';
import * as adminMetricasController from '../controllers/admin-metricas.controller';
import { requiereAdmin } from '../middlewares/admin.middleware';
import { limitadorLogin } from '../middlewares/rate-limit.middleware';

/** Rutas bajo /api/admin */
export const adminRouter = Router();

// Públicas: iniciar sesión y cerrarla (cerrar solo borra la cookie)
// El login lleva el límite más estricto: es el blanco natural de la fuerza bruta
adminRouter.post('/login', limitadorLogin, adminAuthController.login);
adminRouter.post('/logout', adminAuthController.logout);

// Todo lo que sigue, incluidas rutas inexistentes, exige un JWT de administrador válido
adminRouter.use(requiereAdmin);

adminRouter.get('/me', adminAuthController.me);
adminRouter.get('/clientes', adminClientesController.listarClientes);
adminRouter.get('/clientes/:id', adminClientesController.obtenerCliente);
adminRouter.get('/metricas', adminMetricasController.obtenerMetricas);
