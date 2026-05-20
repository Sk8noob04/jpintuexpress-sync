"use client";

import { useState } from "react";

interface Props {
  userId: string;
  currentTelefono: string;
  action: (formData: FormData) => Promise<{ ok?: boolean; error?: string }>;
}

export default function TelefonoInput({ userId, currentTelefono, action }: Props) {
  const [value, setValue] = useState(currentTelefono);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    fd.append("id", userId);
    fd.append("telefono", value);
    const res = await action(fd);
    setSaving(false);
    if (res?.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1 items-center">
      <input
        type="tel"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="50761234567"
        className="w-32 text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
      />
      <button
        type="submit"
        disabled={saving}
        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700
                   dark:hover:bg-gray-600 dark:text-gray-200 disabled:opacity-50 rounded transition"
      >
        {saving ? "..." : saved ? "✓" : "Guardar"}
      </button>
    </form>
  );
}
