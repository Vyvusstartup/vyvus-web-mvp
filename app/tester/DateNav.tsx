'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}
function todayUTC() {
  return toYMD(new Date());
}
function addDays(dateStr: string, delta: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return toYMD(d);
}

export default function DateNav({
  date,
  min,
  max,
}: {
  date: string;
  min?: string;
  max?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setDate = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('date', next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        className="px-3 py-1 rounded border hover:bg-gray-50"
        onClick={() => setDate(addDays(date, -1))}
        aria-label="Día anterior"
      >
        « Anterior
      </button>

      <input
        className="px-3 py-1 rounded border"
        type="date"
        value={date}
        min={min}
        max={max}
        onChange={(e) => e.target.value && setDate(e.target.value)}
      />

      <button
        className="px-3 py-1 rounded border hover:bg-gray-50"
        onClick={() => setDate(todayUTC())}
        aria-label="Hoy"
      >
        Hoy
      </button>

      <button
        className="px-3 py-1 rounded border hover:bg-gray-50"
        onClick={() => setDate(addDays(date, +1))}
        aria-label="Día siguiente"
      >
        Siguiente »
      </button>
    </div>
  );
}
