"use client";

import { useMemo, useState } from "react";
import { Activity, CarFront, CloudSun, FileUp, MapPinned, ShieldCheck } from "lucide-react";
import { parseCarScannerLongCsv } from "@/lib/telemetry/parser";
import { applyQualityRules } from "@/lib/telemetry/quality";
import { integrateEnergy } from "@/lib/telemetry/metrics";

type Loaded = { name: string; samples: ReturnType<typeof applyQualityRules> };
const stages = [
  ["Vía", "Eje, PK, elevación y pendiente multiventana", MapPinned],
  ["Vehículo", "Perfil, transmisión, relaciones y PIDs", CarFront],
  ["Clima", "Viento, temperatura, lluvia y presión", CloudSun],
  ["Tráfico", "Velocidad libre, incidencias y densidad", Activity],
] as const;

export function TelemetryWorkbench() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const summary = useMemo(() => loaded ? integrateEnergy(loaded.samples) : null, [loaded]);
  const flagged = loaded?.samples.filter((sample) => sample.qualityFlags.length).length ?? 0;

  async function loadFile(file: File) {
    try {
      const samples = applyQualityRules(parseCarScannerLongCsv(await file.text()));
      if (!samples.length) throw new Error("No se encontraron muestras reconocibles.");
      setLoaded({ name: file.name, samples });
      setError(null);
    } catch (reason) {
      setLoaded(null);
      setError(reason instanceof Error ? reason.message : "No se pudo leer el archivo.");
    }
  }

  return (
    <main className="min-h-screen bg-[#071019] text-slate-100">
      <header className="border-b border-white/10 bg-[#091521]/95 px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-[#071019]"><Activity size={22} /></span>
            <div><p className="text-sm font-semibold tracking-wide">ANÁLISIS DE TELEMETRÍA</p><p className="text-xs text-slate-400">Laboratorio de ruta · v0.1.0</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck size={16} /> Procesamiento local</div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[330px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="eyebrow">Entrada de telemetría</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Carga un CSV de Car Scanner</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">El archivo se procesa en este navegador. No se incorpora al repositorio ni se envía a un servidor.</p>
            <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#071019] transition hover:bg-emerald-300">
              <FileUp size={18} /> Seleccionar CSV
              <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && loadFile(event.target.files[0])} />
            </label>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </div>

          <div className="panel p-5">
            <p className="eyebrow">Fuentes del modelo</p>
            <div className="mt-4 space-y-4">
              {stages.map(([title, description, Icon]) => <div key={title} className="flex gap-3"><Icon className="mt-0.5 text-amber-300" size={18}/><div><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p></div></div>)}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Muestras alineadas" value={loaded ? loaded.samples.length.toLocaleString("es-ES") : "—"} detail={loaded?.name ?? "Sin archivo"}/>
            <Metric label="Tiempo cubierto" value={summary ? `${(summary.coveredSeconds / 60).toFixed(1)} min` : "—"} detail="Huecos >3 s excluidos"/>
            <Metric label="Gasolina integrada" value={summary ? `${summary.fuelLitres.toFixed(3)} L` : "—"} detail="Solo caudal válido"/>
            <Metric label="Muestras marcadas" value={loaded ? String(flagged) : "—"} detail="Nunca convertidas en cero"/>
          </div>

          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div><p className="eyebrow">Cadena de decisión</p><h2 className="mt-1 text-lg font-semibold">De observación a waypoint</h2></div>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">Medido ≠ derivado</span>
            </div>
            <div className="route-grid min-h-[420px] p-5">
              <div className="relative h-full min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-[#091521]">
                <svg viewBox="0 0 900 420" className="absolute inset-0 h-full w-full" aria-label="Representación del corredor de análisis">
                  <defs><linearGradient id="route" x1="0" x2="1"><stop stopColor="#39d98a"/><stop offset=".62" stopColor="#f6b85f"/><stop offset="1" stopColor="#ff6b6b"/></linearGradient></defs>
                  <path d="M-20 355 C145 330 110 230 265 250 S420 325 505 205 S670 90 920 62" fill="none" stroke="#132838" strokeWidth="54"/>
                  <path d="M-20 355 C145 330 110 230 265 250 S420 325 505 205 S670 90 920 62" fill="none" stroke="url(#route)" strokeWidth="7" strokeLinecap="round"/>
                  {[150,380,585,760].map((x, i) => <g key={x}><circle cx={x} cy={[286,270,153,96][i]} r="10" fill="#071019" stroke="#f6b85f" strokeWidth="4"/><text x={x+16} y={[290,274,157,100][i]} fill="#cbd5e1" fontSize="14">WP {String(i+1).padStart(2,"0")}</text></g>)}
                </svg>
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 text-xs">
                  <Legend label="Medido" color="bg-emerald-400"/><Legend label="Derivado" color="bg-amber-300"/><Legend label="Externo" color="bg-sky-400"/>
                </div>
              </div>
              <div className="space-y-3">
                <Signal title="1 · Normalizar" text="Mapear PIDs, tiempos, coordenadas y unidades sin alterar el origen." state={loaded ? "listo" : "pendiente"}/>
                <Signal title="2 · Validar" text="Invalidar picos imposibles y declarar cobertura insuficiente." state={loaded ? "listo" : "pendiente"}/>
                <Signal title="3 · Contextualizar" text="Alinear vía, rasante, clima y tráfico por tiempo y posición." state="planificado"/>
                <Signal title="4 · Recomendar" text="Generar velocidad o marcha objetivo con evidencia y versión." state="planificado"/>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="panel p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 truncate text-xs text-slate-500">{detail}</p></div>;
}
function Legend({ label, color }: { label: string; color: string }) { return <div className="rounded-lg bg-[#071019]/80 px-3 py-2"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${color}`}/>{label}</div>; }
function Signal({ title, text, state }: { title: string; text: string; state: string }) { return <div className="rounded-xl border border-white/10 bg-[#091521] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{title}</p><span className="text-[11px] uppercase tracking-wide text-slate-500">{state}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></div>; }
