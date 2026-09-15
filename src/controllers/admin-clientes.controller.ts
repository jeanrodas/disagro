import type { RequestHandler } from 'express';
import { clienteIdSchema, filtrosClientesSchema } from '../schemas/admin-clientes.schema';
import * as adminClientesService from '../services/admin-clientes.service';
import { validar } from '../utils/validacion';

/** GET /api/admin/clientes?page=&limit=&buscar= */
export const listarClientes: RequestHandler = async (req, res) => {
  const filtros = validar(filtrosClientesSchema, req.query, 'Parámetros de búsqueda inválidos');
  res.json(await adminClientesService.listarClientes(filtros));
};

/** GET /api/admin/clientes/:id */
export const obtenerCliente: RequestHandler = async (req, res) => {
  const { id } = validar(clienteIdSchema, req.params, 'Identificador de cliente inválido');
  res.json(await adminClientesService.obtenerDetalleCliente(id));
};
