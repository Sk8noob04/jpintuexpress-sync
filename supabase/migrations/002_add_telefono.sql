-- ============================================================
-- Migracion: Agregar campo telefono a perfiles de usuario
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Agregar columna telefono a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telefono TEXT;

-- 2. Comentario descriptivo
COMMENT ON COLUMN public.profiles.telefono IS 
  'Numero de WhatsApp del usuario (con codigo de pais, sin +). Ej: 50761234567';
