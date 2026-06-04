-- PathFinder AI schema. Run this in the Supabase SQL editor of your project
-- (e.g. kxwcnnrjoqgntribvhft), then run: node supabase/seed.mjs <PROJECT_URL> <ANY_KEY_WITH_INSERT>
create table if not exists pf_courses (id serial primary key, title text unique not null, domain text, proficiency text, skills text[]);
create table if not exists pf_modules (id serial primary key, course text not null, module_num text, title text, skills text[]);
create table if not exists pf_lessons (id serial primary key, course text not null, module_num text, lesson_num text, title text, skills text[]);
create table if not exists pf_items (id serial primary key, course text not null, module_num text, lesson_num text, item_type text, title text, duration text, skills text[]);
create table if not exists pf_skills (id serial primary key, name text unique not null, domain text, usage_count int);
create table if not exists pf_analyses (id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('jd','curriculum')), input_title text, input_text text, result jsonb, created_at timestamptz default now());
create index if not exists pf_items_course_idx on pf_items (course);
create index if not exists pf_lessons_course_idx on pf_lessons (course);
create index if not exists pf_modules_course_idx on pf_modules (course);
alter table pf_courses enable row level security; alter table pf_modules enable row level security;
alter table pf_lessons enable row level security; alter table pf_items enable row level security;
alter table pf_skills enable row level security; alter table pf_analyses enable row level security;
create policy "public read courses" on pf_courses for select using (true);
create policy "public read modules" on pf_modules for select using (true);
create policy "public read lessons" on pf_lessons for select using (true);
create policy "public read items" on pf_items for select using (true);
create policy "public read skills" on pf_skills for select using (true);
create policy "public insert analyses" on pf_analyses for insert with check (true);
create policy "public read analyses" on pf_analyses for select using (true);
-- TEMPORARY seed policies: drop after running seed.mjs (see 02_drop_seed_policies.sql)
create policy "tmp seed courses" on pf_courses for insert with check (true);
create policy "tmp seed modules" on pf_modules for insert with check (true);
create policy "tmp seed lessons" on pf_lessons for insert with check (true);
create policy "tmp seed items" on pf_items for insert with check (true);
create policy "tmp seed skills" on pf_skills for insert with check (true);
