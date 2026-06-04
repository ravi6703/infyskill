"use client";
import { useState } from "react";
import Link from "next/link";
import skills from "../../data/skills.json";
import courses from "../../data/courses.json";
import journeys from "../../data/journeys.json";
import { analyzeJD } from "../../lib/match";
import { sbInsert } from "../../lib/supabase";

const SAMPLE = `We are hiring a GenAI Engineer to build production LLM applications.
Requirements: Python, LangChain or LangGraph, RAG pipelines, vector databases (Pinecone),
prompt engineering, fine-tuning with Hugging Face, FastAPI, Docker, CI/CD, AWS or GCP.
Experience with agents, MLOps and model evaluation is a plus.`;

export default function Analyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(null);

  function run() {
    if (text.trim().length < 30) return;
    const r = analyzeJD(text, skills, courses, journeys);
    setResult(r); setSaved(null);
    sbInsert("pf_analyses", { kind: "jd", input_title: text.slice(0, 80), input_text: text.slice(0, 5000), result: { coverage: r.coverage, skills: r.skills, journeys: r.journeys.map((j) => j.role) } })
      .then((row) => row && setSaved(row.id)).catch(() => {});
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white">JD → Journey Analyzer</h1>
      <p className="mt-2 max-w-3xl text-slate-400">
        Paste any job description. The engine extracts skills against the 3,650-skill taxonomy, computes library coverage,
        and recommends the closest career journey plus a curated course list. This is the same engine that powers NEXUS auto-journeys.
      </p>
      <textarea className="input mt-6 h-52 font-mono text-xs" placeholder="Paste a job description here…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 flex gap-3">
        <button onClick={run} className="btn-primary">Analyze JD</button>
        <button onClick={() => setText(SAMPLE)} className="btn-ghost">Load sample JD</button>
      </div>

      {result && (
        <div className="mt-10 space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5 text-center">
              <div className="text-4xl font-extrabold text-white">{result.coverage}%</div>
              <div className="mt-1 text-sm text-slate-400">of extracted skills covered by the library</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-4xl font-extrabold text-white">{result.skills.length}</div>
              <div className="mt-1 text-sm text-slate-400">skills extracted from this JD</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-4xl font-extrabold text-white">{result.courses.length}</div>
              <div className="mt-1 text-sm text-slate-400">matching courses found</div>
            </div>
          </div>

          <section>
            <h2 className="text-lg font-bold text-white">Extracted skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.covered.map((s) => <span key={s} className="chip bg-emerald-900/60 text-emerald-300">{s}</span>)}
              {result.gaps.map((s) => <span key={s} className="chip bg-amber-900/60 text-amber-300">{s} (gap)</span>)}
            </div>
          </section>

          {result.journeys.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-white">Recommended journeys</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {result.journeys.map((j) => (
                  <Link key={j.slug} href={`/journeys/${j.slug}`} className="card group p-4 transition hover:border-brand-500">
                    <h3 className="font-bold text-white group-hover:text-brand-300">{j.role}</h3>
                    <p className="mt-1 text-xs text-slate-400">{j.weeks} weeks · {j.readiness}% ready · {j.hits.length} skill overlaps</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-bold text-white">Curated course path</h2>
            <div className="mt-3 space-y-2">
              {result.courses.map((c, i) => (
                <Link key={c.slug} href={`/course/${c.slug}`} className="card flex flex-wrap items-center gap-3 px-4 py-3 transition hover:border-brand-500">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                  <span className="flex-1 text-sm text-slate-200">{c.title}</span>
                  <span className="text-xs text-slate-500">{c.hits.slice(0, 4).join(" · ")}</span>
                </Link>
              ))}
            </div>
          </section>
          {saved && <p className="text-xs text-slate-500">Analysis saved (id: {saved}).</p>}
        </div>
      )}
    </div>
  );
}
