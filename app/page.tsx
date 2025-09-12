import Link from 'next/link';

export default function Home() {
  return (
    <main className="space-y-6">
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">Tu Longevity Score</h2>
        <p>Calcula un puntaje de 0–100 a partir de 10 métricas de estilo de vida y sueño. Versión DEMO, educativa y no diagnóstica.</p>
        <Link className="btn btn-primary inline-block" href="/calcular">Calcular mi score</Link>
      </div>

      <div className="card space-y-2">
        <h3 className="font-semibold">¿Cómo se calcula?</h3>
        <p>Usamos normalización DEMO (min–max) por métrica y una suma ponderada. En producción: percentiles por edad/sexo y pesos por evidencia.</p>
        <a className="text-primary underline" href="/docs/Vyvus_LongevityScore_Explicado_Simple_y_Matematico.pdf" target="_blank" rel="noreferrer">Abrir el PDF explicador</a>
      </div>

      <div className="card space-y-2">
        <h3 className="font-semibold">Aviso importante</h3>
        <ul className="list-disc ml-5 text-sm">
          <li>Herramienta educativa; no proporciona diagnóstico médico.</li>
          <li>Esta es una versión DEMO sin calibración real.</li>
        </ul>
      </div>
    </main>
  );
}
