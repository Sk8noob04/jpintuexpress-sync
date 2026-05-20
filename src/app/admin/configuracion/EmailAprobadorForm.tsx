"use client";

import { useRef, useState, useTransition } from "react";

interface Props {
  currentEmail: string;
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string }>;
}

export default function EmailAprobadorForm({ currentEmail, action }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      setResult(res);
      if (res.ok) {
        // keep form with updated value shown
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      {result?.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          {result.error}
        </div>
      )}
      {result?.ok && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm text-green-700 dark:text-green-400">
          Email actualizado correctamente.
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="email_aprobador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email del aprobador para recordatorios
          </label>
          <input
            id="email_aprobador"
            name="email_aprobador"
            type="email"
            required
            defaultValue={currentEmail}
            placeholder="aprobador@empresa.com"
            className="glass-input w-full px-3.5 py-2.5 text-sm rounded-xl"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                     text-white text-sm font-semibold rounded-xl transition shrink-0"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Este email recibe los recordatorios automáticos de solicitudes pendientes enviados por GitHub Actions.
      </p>
    </form>
  );
}
