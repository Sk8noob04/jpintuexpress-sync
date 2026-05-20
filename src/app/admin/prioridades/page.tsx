import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import PrioridadesClient from "./PrioridadesClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function PrioridadesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { data: prioridades } = await admin
    .from("prioridades")
    .select("id, nombre, descripcion, nivel")
    .order("nivel");

  const { success, error } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <BackButton href="/admin" label="Panel de administración" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">Prioridades de Compra</h1>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <PrioridadesClient prioridades={prioridades ?? []} />
      </main>
    </div>
  );
}
