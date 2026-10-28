import { executeProcedure } from './sp.js';
import type { AuthUser, Role } from '../types/auth.js';

export interface AuthUserRow extends AuthUser {
  passwordHash: string;
  activo: boolean;
}

// Fila tal como la devuelven los SP de usuarios.
interface UsuarioDbRow {
  IDUsuario: number;
  Correo: string;
  PasswordHash?: string;
  Nombre?: string;
  IDRol?: number;
  Rol: string;
  Activo?: boolean;
  FechaCreacion?: string;
}

function mapAuthUser(row: UsuarioDbRow): AuthUser {
  return { id: row.IDUsuario, email: row.Correo, rol: row.Rol as Role };
}

function mapAuthUserRow(row: UsuarioDbRow): AuthUserRow {
  return {
    ...mapAuthUser(row),
    passwordHash: row.PasswordHash ?? '',
    activo: Boolean(row.Activo),
  };
}

export async function consultarPorCorreo(correo: string): Promise<AuthUserRow | null> {
  const rows = await executeProcedure<UsuarioDbRow[]>('SP_Usuarios_ConsultarPorCorreo', [
    { name: 'Correo', value: correo },
  ]);
  return rows[0] ? mapAuthUserRow(rows[0]) : null;
}

export async function consultarPorID(id: number): Promise<AuthUserRow | null> {
  const rows = await executeProcedure<UsuarioDbRow[]>('SP_Usuarios_ConsultarPorID', [
    { name: 'IDUsuario', value: id },
  ]);
  return rows[0] ? mapAuthUserRow(rows[0]) : null;
}

export async function crearCliente(input: {
  email: string;
  passwordHash: string;
  nombre?: string;
}): Promise<AuthUser> {
  const rows = await executeProcedure<UsuarioDbRow[]>('SP_Usuarios_CrearCliente', [
    { name: 'Correo', value: input.email },
    { name: 'PasswordHash', value: input.passwordHash },
    { name: 'Nombre', value: input.nombre ?? null },
  ]);
  return mapAuthUser(rows[0]);
}
