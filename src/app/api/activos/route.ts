import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const linea_id = searchParams.get("linea_id");

  if (!linea_id) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: activos, error } = await supabase
    .from("activos")
    .select("id, nombre")
    .eq("linea_id", linea_id)
    .eq("activo", true)
    .order("nombre");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(activos ?? []);
}
