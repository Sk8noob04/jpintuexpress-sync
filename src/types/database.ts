/**
 * Tipos compartidos del dominio.
 * Cuando definamos las tablas en Supabase (Fase 2), generaremos automáticamente
 * el tipo `Database` con la CLI de Supabase. Por ahora dejamos los tipos manuales.
 */

export type UserRole = "solicitante" | "aprobador" | "admin";

export type SolicitudEstado = "pendiente" | "aprobada" | "rechazada";

export interface Linea {
  id: string;
  nombre: string;
  activa: boolean;
  created_at: string;
}

export interface Activo {
  id: string;
  nombre: string;
  linea_id: string;
  activo: boolean;
  created_at: string;
}

export interface Profile {
  id: string; // mismo id que auth.users.id
  nombre_completo: string;
  email: string;
  role: UserRole;
  debe_cambiar_password: boolean;
  created_at: string;
}

export interface Solicitud {
  id: string;
  solicitante_id: string;
  motivo: string;
  costo_estimado: number;
  linea_id: string;
  activo_id: string;
  estado: SolicitudEstado;
  comentario_aprobador: string | null;
  aprobador_id: string | null;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}
