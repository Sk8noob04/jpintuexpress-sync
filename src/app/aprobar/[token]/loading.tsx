// Route-specific loading override: return null so the root loading.tsx
// "Cargando..." spinner never shows while this async Server Component resolves.
export default function Loading() {
  return null;
}
