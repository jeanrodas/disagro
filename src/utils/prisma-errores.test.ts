import { describe, expect, it } from 'vitest';
import { restriccionUnicaViolada } from './prisma-errores';

describe('restriccionUnicaViolada', () => {
  it('Prisma 7 con adaptador pg: lee el índice de meta.driverAdapterError (forma real capturada)', () => {
    const err = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: {
        driverAdapterError: {
          name: 'DriverAdapterError',
          cause: {
            originalCode: '23505',
            kind: 'UniqueConstraintViolation',
            constraint: { index: 'clientes_email_key' },
            table: 'clientes',
          },
        },
        modelName: 'Cliente',
      },
    };
    expect(restriccionUnicaViolada(err)).toBe('clientes_email_key');
  });

  it('adaptador que reporta campos en lugar de índice', () => {
    const err = { code: 'P2002', meta: { driverAdapterError: { cause: { constraint: { fields: ['codigo'] } } } } };
    expect(restriccionUnicaViolada(err)).toBe('codigo');
  });

  it('forma clásica con meta.target', () => {
    expect(restriccionUnicaViolada({ code: 'P2002', meta: { target: ['session_token'] } })).toBe('session_token');
    expect(restriccionUnicaViolada({ code: 'P2002', meta: { target: 'clientes_email_key' } })).toBe('clientes_email_key');
  });

  it('P2002 sin detalle => "desconocida" (se trata como no reintentable)', () => {
    expect(restriccionUnicaViolada({ code: 'P2002' })).toBe('desconocida');
  });

  it('otros errores => null', () => {
    expect(restriccionUnicaViolada({ code: 'P2003', meta: {} })).toBeNull();
    expect(restriccionUnicaViolada(new Error('boom'))).toBeNull();
    expect(restriccionUnicaViolada(null)).toBeNull();
    expect(restriccionUnicaViolada('P2002')).toBeNull();
  });
});
