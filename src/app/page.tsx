import { redirect } from "next/navigation";

// La raíz siempre redirige al dashboard.
// El middleware o el dashboard manejan auth y rol.
export default function HomePage() {
  redirect("/dashboard");
}
