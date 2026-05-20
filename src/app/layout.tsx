import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import NavigationLoader from "@/components/NavigationLoader";

export const metadata: Metadata = {
  title: "JPintuExpress — Solicitudes de Compra",
  description: "Sistema interno de gestión de solicitudes de compra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica dark antes de que React hidrate */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.toggle('dark', t === 'dark');
            } catch(e){}
          })();
        `}} />
      </head>
      <body className="
        min-h-screen antialiased text-gray-900 dark:text-gray-100
        bg-[#F2F2F7] dark:bg-gray-950
        sm:bg-gradient-to-br sm:from-slate-300 sm:via-slate-200 sm:to-slate-300
        dark:bg-gradient-to-br dark:from-gray-950 dark:via-slate-900 dark:to-gray-950
        transition-colors duration-200
      ">
        <BackgroundOrbs />
        <ThemeProvider>
          <NavigationLoader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
