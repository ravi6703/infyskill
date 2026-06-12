"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sbSelect } from "../../../lib/supabase";
import specs from "../../../data/journeys.json";
import allCourses from "../../../data/courses.json";
import coaches from "../../../data/coaches.json";
import skillMeta from "../../../data/skills.json";
import allModules from "../../../data/modules.json";

const clean = (t) => t.replace(/^[:\s]+/, "");
const normCourse = (t) => t.replace(/^[:\s]+/, "").trim().toLowerCase();
const CLUSTER_OF = Object.fromEntries(skillMeta.map((s) => [s.name.toLowerCase(), s.cluster]));
const initials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");

const ICON = { Video: "▶", Reading: "📄", Practice: "✏️", Assignment: "🧪", Quiz: "❓", Discussion: "💬", Lab: "🔬", Project: "🚀" };
const SIDE = ["left", "right"];

export default function CourseDetail({ course }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null);
  const [view, setView] = useState("skill"); // "skill" | "content"

  useEffect(() => {
    const t = encodeURIComponent(course.title);
    Promise.all([
      sbSelect("pf_modules", `course=eq.${t}&order=id`),
      sbSelect("pf_lessons", `course=eq.${t}&order=id`),
      sbSelect("pf_items", `course=eq.${t}&order=id`),
    ]).then(([modules, lessons, items]) => {
      setData({ modules, lessons, items });
    }).catch((e) => setErr(String(e)));
  }, [course.title]);

  const totalVideos = data ? data.items.filter((i) => i.item_type === "Video").length : null;
  const totalItems = data ? data.items.length : null;
  // hours live in the local module data (Supabase pf_modules has no hours column)
  const totalHours = useMemo(() => Math.round(allModules.filter((m) => normCourse(m.course) === normCourse(course.title)).reduce((s, m) => s + (Number(m.hours) || 0), 0)), [course.title]);
  const ITEM_MIX = data ? (() => { const c = {}; data.items.forEach((i) => { c[i.item_type] = (c[i.item_type] || 0) + 1; }); return c; })() : {};

  // VISION: which specializations this course's skills feed into
  const unlocks = useMemo(() => {
    const cs = new Set(course.skills.map((s) => s.toLowerCase()));
    return specs.map((sp) => {
      const hits = sp.skills.filter((s) => cs.has(s.toLowerCase()));
      return { sp, hits, pct: Math.round((hits.length / Math.max(6, sp.skills.length)) * 100) };
    }).filter((x) => x.hits.length >= 2).sort((a, b) => b.hits.length - a.hits.length).slice(0, 4);
  }, [course.skills]);

  // dominant clusters of this course's skills → match coaches
  const courseClusters = useMemo(() => {
    const c = {};
    course.skills.forEach((s) => { const cl = CLUSTER_OF[s.toLowerCase()]; if (cl) c[cl] = (c[cl] || 0) + 1; });
    return new Set(Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cl]) => cl));
  }, [course.skills]);
  const matchedCoaches = useMemo(() =>
    coaches.map((co) => ({ co, hit: co.clusters.filter((cl) => courseClusters.has(cl)).length }))
      .filter((x) => x.hit > 0).sort((a, b) => b.hit - a.hit || b.co.years - a.co.years).slice(0, 3).map((x) => x.co),
  [courseClusters]);

  // coaches who deliver the live layer for this course
  const masterCoach = matchedCoaches[0];
  const projectCoach = matchedCoaches[1] || matchedCoaches[0];

  // the holistic, BI-delivered learning experience for THIS course — specific topics from its own modules/skills
  const experience = useMemo(() => {
    const sk = course.skills.filter((s) => /^[A-Z]/.test(s));
    const top = sk.slice(0, 3);
    const modTitles = (data?.modules || []).map((m) => clean(m.title));
    const liveTopics = (modTitles.length ? modTitles : top).slice(0, 3);
    const items = [];
    items.push({ icon: "▶", label: "Self-paced content", color: "brand",
      title: "Recorded modules — learn at your own pace",
      detail: data ? `${data.modules.length} modules · ${totalVideos} videos · ~${totalHours} hrs. Topics: ${modTitles.slice(0, 3).join("; ")}${modTitles.length > 3 ? "…" : ""}` : "Recorded video modules with readings & quizzes." });
    items.push({ icon: "🎙", label: "Live classes", color: "peel",
      title: "Instructor-led sessions on the hard parts",
      detail: `Taught live: ${liveTopics.join("; ")} — worked examples, problem-solving & live doubt-clearing.` });
    items.push({ icon: "★", label: "Masterclass", color: "flame",
      title: `Industry masterclass: ${top[0] || clean(course.title)}`,
      detail: `Agenda: ${top[0] || "the core topic"} in production · real architectures & trade-offs · common pitfalls and how practitioners solve them.`,
      coach: masterCoach });
    items.push({ icon: "🚀", label: "Applied project", color: "teal",
      title: `Build a ${top.slice(0, 2).join(" & ") || "real-world"} project`,
      detail: "Coached, graded, portfolio-ready — apply the skills end-to-end on a real brief.",
      coach: projectCoach });
    if ((data?.modules?.length || 0) >= 3)
      items.push({ icon: "🏆", label: "Hackathon", color: "rose",
        title: `48-hour build sprint`,
        detail: `Ship a ${course.domain || "working"} solution under time pressure, demoed to industry judges.` });
    items.push({ icon: "🤝", label: "Mentorship", color: "ink",
      title: "Weekly mentorship & doubt-solving",
      detail: "1:1 coaching with a practitioner from the network below." });
    items.push({ icon: "✅", label: "Assessment", color: "teal",
      title: "Skill checkpoints & certificate",
      detail: "Verified skill checks at each stage + a completion certificate employers recognise." });
    return items;
  }, [course.skills, course.domain, data, totalVideos, totalHours, masterCoach, projectCoach]);

  const COLOR = { brand: "border-brand-200 bg-brand-50 text-brand-700", peel: "border-peel-200 bg-peel-50 text-peel-700", flame: "border-flame-200 bg-flame-50 text-flame-700", teal: "border-teal-200 bg-teal-50 text-teal-700", rose: "border-rose-200 bg-rose-50 text-rose-600", ink: "border-ink-200 bg-ink-100 text-ink-600" };

  return (
    <div>
      <Link href="/catalog" className="text-sm font-bold text-brand-600">← Catalog</Link>

      <div className="card mt-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex gap-2">
              <span className="chip-blue">{course.domain}</span>
              <span className="chip-peel">{course.proficiency}</span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-ink-900">{clean(course.title)}</h1>
          </div>
          {data && (
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-black text-brand-600">{data.modules.length}</p><p className="text-[11px] text-ink-500">modules</p></div>
              <div><p className="text-2xl font-black text-brand-600">{data.lessons.length}</p><p className="text-[11px] text-ink-500">lessons</p></div>
              <div><p className="text-2xl font-black text-brand-600">{totalVideos}</p><p className="text-[11px] text-ink-500">videos</p></div>
              {totalHours > 0 && <div><p className="text-2xl font-black text-brand-600">{totalHours}</p><p className="text-[11px] text-ink-500">hours</p></div>}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Skills you&apos;ll build</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {course.skills.map((s) => <span key={s} className="chip-blue">{s}</span>)}
          </div>
        </div>
      </div>

      {/* VISION — where this course takes you */}
      {unlocks.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Why this matters</p>
          <h2 className="mt-1 text-lg font-black text-ink-900">This course is a step toward {unlocks.length} AI-era role{unlocks.length > 1 ? "s" : ""}</h2>
          <p className="mt-1 text-sm text-ink-600">A course → builds verified skills → which power real specializations → leading to a career. Here&apos;s where these skills take you:</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {unlocks.map(({ sp, hits, pct }) => (
              <Link key={sp.slug} href={`/specializations/${sp.slug}`} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                <p className="font-black text-ink-900">{sp.role}</p>
                {sp.salary && <p className="mt-0.5 text-sm font-bold text-teal-600">{sp.salary.india}</p>}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-ink-500">{hits.length} of this role&apos;s skills come from this course</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* THE COMPLETE LEARNING EXPERIENCE — holistic, specific, derived from this course's own content */}
      <section className="mt-6 card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-peel-600">Board Infinity · the complete learning experience</p>
        <h2 className="mt-1 text-lg font-black text-ink-900">What we deliver for this course</h2>
        <p className="mt-1 text-sm text-ink-500">Not just recorded videos — a full blended program. Recorded content is self-paced; everything marked <span className="font-bold text-peel-600">● Live</span> is delivered live by Board Infinity.</p>
        <div className="relative mt-4 space-y-2 border-l-2 border-brand-100 pl-5">
          {experience.map((x, i) => {
            const isLive = ["Live classes", "Masterclass", "Applied project", "Hackathon", "Mentorship"].includes(x.label);
            return (
              <div key={i} className="relative rounded-xl border border-ink-200 bg-white p-3">
                <span className="absolute -left-[26px] top-4 grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[8px] text-white">{i + 1}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip border ${COLOR[x.color]} shrink-0`}>{x.icon} {x.label}</span>
                  <span className="text-sm font-bold text-ink-900">{x.title}</span>
                  {isLive && <span className="text-[10px] font-black uppercase tracking-wide text-peel-600">● Live</span>}
                  {x.coach && <span className="ml-auto text-[11px] text-ink-500">led by <b className="text-ink-700">{x.coach.name}</b></span>}
                </div>
                <p className="mt-1 text-xs text-ink-500">{x.detail}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-ink-400">Live elements &amp; project briefs are a proposed design; topics are auto-derived from this course&apos;s modules and finalised with the delivery team.</p>
      </section>

      {/* coach network — who delivers the live layer */}
      {matchedCoaches.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">From our coach network</p>
              <h2 className="mt-1 text-lg font-black text-ink-900">Coaches who deliver this course live</h2>
              <p className="mt-1 text-sm text-ink-500">Industry practitioners matched to this course&apos;s skills — they run the live classes, masterclass &amp; project coaching above.</p>
            </div>
            <Link href="/specializations" className="text-xs font-bold text-brand-600 hover:underline">Explore roles →</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {matchedCoaches.map((c, i) => {
              const role = i === 0 ? "Masterclass" : i === 1 ? "Project coach" : "Live mentor";
              return (
                <div key={c.name} className="rounded-xl border border-ink-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lift">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-lg font-black text-brand-600">{initials(c.name)}</span>
                  <p className="mt-2 font-black text-ink-900">{c.name}</p>
                  <p className="text-xs text-ink-500">{c.title}</p>
                  <p className="text-[11px] text-ink-400">{c.company} · {c.years}+ yrs</p>
                  <span className="mt-2 inline-block chip-peel text-[10px]">Leads: {role}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-ink-400">Representative coach profiles, matched by skill.</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-ink-900">Learning Roadmap</h2>
        <div className="flex rounded-lg border border-ink-200 bg-ink-50 p-1 text-sm font-bold">
          <button onClick={() => setView("skill")} className={`rounded-md px-3 py-1.5 transition ${view === "skill" ? "bg-brand-500 text-white" : "text-ink-600 hover:text-brand-600"}`}>🎯 Skills &amp; Careers</button>
          <button onClick={() => setView("content")} className={`rounded-md px-3 py-1.5 transition ${view === "content" ? "bg-brand-500 text-white" : "text-ink-600 hover:text-brand-600"}`}>📚 Course Content</button>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {view === "skill" ? "Every skill in this course, ranked by how many AI-era roles demand it — and where to go next." : "The full curriculum — modules, lessons and videos."}
      </p>

      {err && <p className="mt-6 text-rose-600">Could not load roadmap: {err}</p>}
      {!data && !err && <p className="mt-6 animate-pulse text-ink-400">Building the roadmap…</p>}

      {/* SKILLS & CAREERS — each skill ranked by market demand across AI-era roles + where to go next */}
      {data && view === "skill" && (() => {
        const JUNK = /^(beginner|intermediate|advanced|course|navigation|orientation|exam|syllabus)/i;
        const sk = course.skills.filter((s) => !JUNK.test(s));
        // demand per skill: which specializations (roles) list this skill
        const rows = sk.map((s) => {
          const sl = s.toLowerCase();
          const roles = specs.filter((sp) => sp.skills.some((x) => x.toLowerCase() === sl));
          return { skill: s, roles };
        }).sort((a, b) => b.roles.length - a.roles.length);
        const maxR = Math.max(1, ...rows.map((r) => r.roles.length));
        const rolesTouched = new Set(rows.flatMap((r) => r.roles.map((x) => x.slug))).size;
        // where to go next: other courses sharing >=2 skills
        const mySlug = course.slug;
        const myset = new Set(sk.map((s) => s.toLowerCase()));
        const next = allCourses.filter((c) => c.slug !== mySlug)
          .map((c) => ({ c, overlap: (c.skills || []).filter((s) => myset.has(s.toLowerCase())).length }))
          .filter((x) => x.overlap >= 2).sort((a, b) => b.overlap - a.overlap).slice(0, 4);

        const hot = rows.filter((r) => r.roles.length > 0);
        const cold = rows.filter((r) => r.roles.length === 0);

        return (
          <div className="mt-6 space-y-6">
            {/* market summary — compact KPI tiles */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [sk.length, "skills taught", "text-ink-900"],
                [hot.length, "hired-for skills", "text-teal-600"],
                [rolesTouched, `AI-era role${rolesTouched !== 1 ? "s" : ""} reached`, "text-brand-600"],
              ].map(([n, label, col]) => (
                <div key={label} className="card flex flex-col p-4">
                  <span className={`text-3xl font-black leading-none ${col}`}>{n}</span>
                  <span className="mt-1 text-xs font-bold text-ink-500">{label}</span>
                </div>
              ))}
            </div>

            {/* in-demand skills — ranked, dense list (no empty bars) */}
            {hot.length > 0 && (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-ink-900">In-demand skills</h3>
                  <span className="chip-green text-[10px]">ranked by hiring demand</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">Skills our tracked AI-era roles actually hire for — most-demanded first. Tap a role to see its full journey.</p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
                  {hot.map(({ skill, roles }, i) => (
                    <div key={skill} className="flex items-start gap-3 border-b border-ink-100 px-4 py-3.5 transition last:border-0 hover:bg-brand-50/40">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-black text-brand-600">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-bold text-ink-900">{skill}</p>
                          <span className="shrink-0 text-xs font-black text-teal-600">🔥 {roles.length} role{roles.length > 1 ? "s" : ""}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${Math.max(14, Math.round((roles.length / maxR) * 100))}%` }} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {roles.slice(0, 4).map((r) => (
                            <Link key={r.slug} href={`/specializations/${r.slug}`} className="chip-blue text-[11px] hover:bg-brand-100">{r.role} →</Link>
                          ))}
                          {roles.length > 4 && <span className="chip-gray text-[11px]">+{roles.length - 4} more</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* foundational skills — compact chip cloud (no broken empty rows) */}
            {cold.length > 0 && (
              <div className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-ink-900">Foundational skills</h3>
                  <span className="chip-gray text-[10px]">{cold.length}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-500">The base these roles assume you already have — taught here so nothing&apos;s missing from your foundation.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cold.map(({ skill }) => <span key={skill} className="chip-gray">{skill}</span>)}
                </div>
              </div>
            )}

            {/* where to go next */}
            {next.length > 0 && (
              <div className="card border-peel-200 bg-peel-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-peel-700">Where to go next</p>
                <p className="mt-1 text-sm text-ink-600">Courses that build on these same skills — your natural next step.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {next.map(({ c, overlap }) => (
                    <Link key={c.slug} href={`/course/${c.slug}`} className="card p-3 transition hover:-translate-y-0.5 hover:shadow-lift">
                      <p className="font-bold text-ink-900">{clean(c.title)}</p>
                      <p className="mt-0.5 text-[11px] text-ink-500">shares {overlap} skills with this course</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {data && view === "content" && (
        <div className="relative mt-6">
          {/* depth summary */}
          <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm">
            <span className="font-black text-ink-900">{data.modules.length} modules</span>
            <span className="text-ink-600">{data.lessons.length} lessons</span>
            <span className="text-ink-600">{totalItems} learning items</span>
            {Object.entries(ITEM_MIX).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <span key={k} className="text-ink-500">{ICON[k] || "•"} {v} {k.toLowerCase()}{v > 1 ? "s" : ""}</span>
            ))}
            {totalHours > 0 && <span className="ml-auto font-bold text-brand-600">~{totalHours} hrs total</span>}
          </div>
          {/* center spine */}
          <div className="absolute left-1/2 top-[68px] hidden h-[calc(100%-68px)] w-0.5 -translate-x-1/2 bg-brand-100 md:block" />
          <div className="space-y-5">
            {/* start node */}
            <div className="flex justify-center">
              <span className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-black text-white shadow-lift">Start here</span>
            </div>

            {data.modules.map((m, idx) => {
              const lessons = data.lessons.filter((l) => l.module_num === m.module_num);
              const mVids = data.items.filter((i) => i.module_num === m.module_num && i.item_type === "Video").length;
              const mHrs = Math.round(Number(m.hours) || 0);
              const isOpen = open === m.id;
              const side = SIDE[idx % 2];
              const mods = (m.skills || []).slice(0, 4);
              return (
                <div key={m.id} className="md:grid md:grid-cols-2 md:gap-8">
                  {/* spacer for alternating layout */}
                  {side === "right" && <div className="hidden md:block" />}
                  <div className={`relative ${side === "right" ? "md:text-left" : "md:text-right"}`}>
                    {/* node dot */}
                    <span className={`absolute top-5 hidden h-3 w-3 rounded-full border-2 border-white bg-brand-500 md:block ${side === "right" ? "-left-[18px]" : "-right-[18px]"}`} />
                    <button onClick={() => setOpen(isOpen ? null : m.id)}
                      className={`card w-full p-4 text-left transition hover:border-brand-400 hover:shadow-lift ${side === "right" ? "" : "md:text-right"}`}>
                      <div className={`flex items-center gap-2 ${side === "right" ? "" : "md:flex-row-reverse"}`}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-black text-brand-600">{m.module_num}</span>
                        <span className="font-black text-ink-900">{m.title}</span>
                      </div>
                      <div className={`mt-2 flex flex-wrap gap-1.5 ${side === "right" ? "" : "md:justify-end"}`}>
                        {mods.map((s) => <span key={s} className="chip-gray">{s}</span>)}
                      </div>
                      <p className={`mt-2 text-xs font-bold text-brand-600`}>{lessons.length} lessons · {mVids} videos{mHrs > 0 ? ` · ${mHrs} hrs` : ""} · {isOpen ? "hide" : "expand"} ▾</p>
                    </button>

                    {isOpen && (
                      <div className={`mt-2 space-y-1.5 ${side === "right" ? "" : "md:text-left"}`}>
                        {lessons.map((l) => {
                          const items = data.items.filter((i) => i.module_num === l.module_num && i.lesson_num === l.lesson_num);
                          const mix = {}; items.forEach((i) => { mix[i.item_type] = (mix[i.item_type] || 0) + 1; });
                          return (
                            <div key={l.id} className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-left">
                              <p className="text-sm font-bold text-brand-700">Lesson {l.lesson_num}: {l.title}</p>
                              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
                                {Object.entries(mix).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                                  <span key={k}>{ICON[k] || "•"} {v} {k.toLowerCase()}{v > 1 ? "s" : ""}</span>
                                ))}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {side === "left" && <div className="hidden md:block" />}
                </div>
              );
            })}

            {/* finish node */}
            <div className="flex justify-center pt-2">
              <span className="rounded-full bg-peel-500 px-4 py-1.5 text-sm font-black text-white shadow-lift">🎯 Course complete — skills earned</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
