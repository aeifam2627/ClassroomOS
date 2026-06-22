-- Leaderboard / Gamification — ฟีเจอร์ใหม่นอก scope เดิม ตั้งค่าได้ต่อวิชา
-- ครูเลือกได้ว่า: เปิด/ปิด, อิงคะแนนจริงหรือแต้มกิจกรรมแยก, และเปิดเผยตัวตนแค่ไหน

alter table courses
  add column gamification_enabled boolean not null default false,
  add column leaderboard_score_basis text not null default 'grade'
    check (leaderboard_score_basis in ('grade', 'points')),
  add column leaderboard_visibility text not null default 'full_name'
    check (leaderboard_visibility in ('anonymous', 'alias', 'full_name'));

-- point_events: แต้มกิจกรรมที่ครูให้เอง (เช่น ช่วยเหลือเพื่อน, ตอบคำถามในห้อง)
-- แยกจากคะแนนสอบ/งานจริงใน student_scores โดยตั้งใจ ใช้เป็นฐานคะแนนของ leaderboard ได้
-- เมื่อ leaderboard_score_basis = 'points'
create table point_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  points numeric(7, 2) not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid not null references users (id)
);

create index idx_point_events_course_id on point_events (course_id);
create index idx_point_events_student_id on point_events (student_id);

alter table point_events enable row level security;

-- เช็คทั้งฝั่ง course ownership และฝั่ง student ownership ตั้งแต่แรก (ตาม pattern ที่แก้ไว้ใน 0008/0009)
create policy "point_events_owner_all" on point_events
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  );
