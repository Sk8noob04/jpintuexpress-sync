import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import MagicLinksClient from "./MagicLinksClient";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, email, role").eq("id", user.id).single();

  if (!profile || !["admin", "aprobador"].includes(profile.role)) redirect("/dashboard");

  // Get all pending solicitudes with their tokens
  const admin = createAdminClient();
  const { data: raw } = await admin
    .from("solicitudes")
    .select(`
      id, motivo, costo_estimado, proveedor, fecha_limite, created_at, token_aprobacion,
      prioridades(nombre),
      profiles!solicitante_id(nombre_completo)
    `)
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  const solicitudes = (raw as any[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">

        <div className="mb-6">
          <BackButton href="/admin" label="Panel de administración" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Links de Aprobacion</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Links directos para aprobar solicitudes sin necesidad de iniciar sesion.
            Compartelos por WhatsApp cuando sea necesario.
          </p>
        </div>

        {solicitudes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">No hay solicitudes pendientes</p>
            <p className="text-sm text-gray-400 mt-1">Todas las solicitudes han sido procesadas.</p>
          </div>
        ) : (
          <MagicLinksClient solicitudes={solicitudes} />
        )}
      </main>
    </div>
  );
}
