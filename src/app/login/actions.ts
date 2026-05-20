"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/dashboard";

  if (!email || !password) {
    return redirect(`/login?error=${encodeURIComponent("Completa todos los campos")}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg =
      error.message === "Invalid login credentials"
        ? "Email o contrasena incorrectos"
        : "Error al iniciar sesion. Intenta de nuevo.";
    return redirect(`/login?error=${encodeURIComponent(msg)}&email=${encodeURIComponent(email)}`);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("debe_cambiar_password")
    .eq("id", user!.id)
    .single();

  if (profile?.debe_cambiar_password) {
    return redirect("/cambiar-password");
  }

  return redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
