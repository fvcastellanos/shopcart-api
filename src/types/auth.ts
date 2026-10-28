export type Role = 'Cliente' | 'Operador' | 'Administrador';

/**
 * Usuario autenticado tal como viaja en el token JWT.
 */
export interface AuthUser {
  id: number;
  email: string;
  rol: Role;
}
