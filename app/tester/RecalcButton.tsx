'use client';
import { useFormStatus } from 'react-dom';
import posthog from 'posthog-js';

type Props = {
  label?: string;
  disabled?: boolean;
  testerCode: string;  // <- nuevo
  date: string;        // <- nuevo (YYYY-MM-DD)
};

export default function RecalcButton({
  label = 'Recalcular y guardar',
  disabled = false,
  testerCode,
  date,
}: Props) {
  const { pending } = useFormStatus();

  const handleClick = () => {
    try {
      posthog.capture('recalc_click', { tester_code: testerCode, date });
    } catch {
      // nunca romper el submit por telemetría
    }
  };

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={pending || disabled}
      className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-60"
      title={label}
    >
      {pending ? 'Recalculando…' : label}
    </button>
  );
}
