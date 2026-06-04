"use client";
import { useState } from "react";
import { sbInsert } from "../lib/supabase";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  function send() {
    sbInsert("pf_analyses", { kind: "nps", input_title: `NPS ${score}`, input_text: text.slice(0, 1000), result: { score } }).catch(() => {});
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setScore(null); setText(""); }, 1800);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {open ? (
        <div className="card w-72 border-brand-700 p-4 shadow-2xl">
          {sent ? <p className="text-center text-sm text-emerald-400">✓ Thank you!</p> : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">How likely are you to recommend PathFinder?</p>
                <button onClick={() => setOpen(false)} className="text-slate-500">✕</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <button key={i} onClick={() => setScore(i)}
                    className={`h-7 w-7 rounded text-xs font-bold ${score === i ? "bg-brand-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{i}</button>
                ))}
              </div>
              <textarea className="input mt-3 h-16 text-xs" placeholder="What would make it better? (optional)" value={text} onChange={(e) => setText(e.target.value)} />
              <button disabled={score === null} onClick={send} className="btn-primary mt-2 w-full justify-center text-xs disabled:opacity-40">Send feedback</button>
            </>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-brand-500">💬 Feedback</button>
      )}
    </div>
  );
}
