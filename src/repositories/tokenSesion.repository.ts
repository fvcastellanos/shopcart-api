import { executeProcedure } from './sp.js';

export async function crearTokenSesion(input: {
  idUsuario: number;
  refreshTokenHash: string;
  fechaExpiracion: Date;
}): Promise<void> {
  await executeProcedure('SP_TokenSesion_Crear', [
    { name: 'IDUsuario', value: input.idUsuario },
    { name: 'RefreshTokenHash', value: input.refreshTokenHash },
    { name: 'FechaExpiracion', value: input.fechaExpiracion },
  ]);
}

export async function consultarTokenSesionActivo(
  refreshTokenHash: string,
): Promise<{ idUsuario: number } | null> {
  const rows = await executeProcedure<{ IDTokenSesion: number; IDUsuario: number }[]>(
    'SP_TokenSesion_ConsultarActivo',
    [{ name: 'RefreshTokenHash', value: refreshTokenHash }],
  );
  return rows[0] ? { idUsuario: rows[0].IDUsuario } : null;
}

export async function revocarTokenSesion(refreshTokenHash: string): Promise<void> {
  await executeProcedure('SP_TokenSesion_Revocar', [
    { name: 'RefreshTokenHash', value: refreshTokenHash },
  ]);
}
