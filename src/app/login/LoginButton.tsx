"use client";

import { useFormStatus } from "react-dom";

export default function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70
                 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm
                 transition focus:outline-none focus:ring-2 focus:ring-blue-500
                 focus:ring-offset-2 mt-2 inline-flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Verificando...
        </>
      ) : (
        "Entrar"
      )}
    </button>
  );
}
