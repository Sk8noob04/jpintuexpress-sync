-- =====================================================================
-- MIGRACIÓN 001: Magic links, placa manual, lineas opcionales
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Agregar campo placa (texto libre, reemplaza activos dropdown)
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS placa TEXT;

-- 2. Agregar token de aprobación (magic link sin login)
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS token_aprobacion UUID DEFAULT gen_random_uuid();

-- Asegurar que todos los registros existentes tengan token
UPDATE public.solicitudes SET token_aprobacion = gen_random_uuid()
WHERE token_aprobacion IS NULL;

-- Índice único para búsqueda rápida por token
CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitudes_token
  ON public.solicitudes(token_aprobacion);

-- 3. Hacer linea_id y activo_id opcionales (ya no son obligatorios)
ALTER TABLE public.solicitudes ALTER COLUMN linea_id DROP NOT NULL;
ALTER TABLE public.solicitudes ALTER COLUMN activo_id DROP NOT NULL;

-- 4. Actualizar función inmutable para no verificar linea_id/activo_id
CREATE OR REPLACE FUNCTION public.solicitudes_check_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.solicitante_id  IS DISTINCT FROM old.solicitante_id
     OR new.motivo       IS DISTINCT FROM old.motivo
     OR new.costo_estimado IS DISTINCT FROM old.costo_estimado
     OR new.created_at   IS DISTINCT FROM old.created_at THEN
    RAISE EXCEPTION 'No se pueden modificar los datos originales de una solicitud';
  END IF;
  RETURN new;
END;
$$;

-- =====================================================================
-- FIN DE MIGRACIÓN 001
-- =====================================================================
