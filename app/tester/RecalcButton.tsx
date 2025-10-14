'use client';
import { useFormStatus } from 'react-dom';

export default function RecalcButton({
  label = 'Recalcular y guardar',
}: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60"
      title="Recalcular score con los datos de esta fecha y guardarlo"
    >
      {pending ? 'Recalculando…' : label}
    </button>
  );
}
