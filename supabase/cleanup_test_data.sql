-- =====================================================
-- SCRIPT DE LIMPIEZA - Ejecutar en Supabase SQL Editor
-- Borra todos los datos de prueba para producción
-- =====================================================

-- 1. Borrar solicitudes (primero por FK)
DELETE FROM public.solicitudes;

-- 2. Borrar auditoría
DELETE FROM public.user_audit_log;

-- 3. Borrar activos y líneas de prueba
-- (Descomentar si se quieren limpiar también)
-- DELETE FROM public.activos;
-- DELETE FROM public.lineas;

-- 4. Los usuarios se borran desde:
--    Supabase Dashboard → Authentication → Users → Delete
--    (Los profiles se borran automáticamente via cascade)

-- 5. Limpiar settings si se quiere
-- DELETE FROM public.app_settings WHERE key != 'email_aprobador';
