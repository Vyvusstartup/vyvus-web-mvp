'use client';
import { useFormStatus } from 'react-dom';

export default function RecalcButton({
  label = 'Recalcular y guardar',
  disabled = false,
}: { label?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60"
      title={label}
    >
      {pending ? 'Recalculando…' : label}
    </button>
  );
}
