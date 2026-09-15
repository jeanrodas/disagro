import type { RequestHandler } from 'express';
import * as adminMetricasService from '../services/admin-metricas.service';

/** GET /api/admin/metricas */
export const obtenerMetricas: RequestHandler = async (_req, res) => {
  res.json(await adminMetricasService.obtenerMetricas());
};
