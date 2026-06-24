-- ระบบ XP/เลเวลนักเรียนต่อวิชา — แยกจาก point_events (แต้มที่ครูให้มือ) โดยตั้งใจ
-- xp_events: XP ต่อชิ้นงานต่อนักเรียน (พฤติกรรมส่ง + คะแนน) recompute/upsert ทับของเดิมทุกครั้งที่เปลี่ยนแปลง
-- xp_streak_bonuses: แต้มพิเศษเมื่อส่งตรงเวลาติดกันครบ 3 ชิ้น เก็บ grade_item ตัวที่ทำให้ครบ เพื่อกัน award ซ้ำ

create table xp_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  grade_item_id uuid not null references grade_items (id) on delete cascade,
  points numeric(6, 2) not null default 0,
  computed_at timestamptz not null default now(),
  unique (student_id, grade_item_id)
);

create index idx_xp_events_course_id on xp_events (course_id);
create index idx_xp_events_student_id on xp_events (student_id);

create table xp_streak_bonuses (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  grade_item_id uuid not null references grade_items (id) on delete cascade,
  points numeric(6, 2) not null default 10,
  created_at timestamptz not null default now(),
  unique (student_id, grade_item_id)
);

create index idx_xp_streak_bonuses_course_id on xp_streak_bonuses (course_id);
create index idx_xp_streak_bonuses_student_id on xp_streak_bonuses (student_id);

alter table xp_events enable row level security;
alter table xp_streak_bonuses enable row level security;

-- ฝั่งนักเรียนเขียนผ่าน service client (bypass RLS) เหมือน assignment_submissions อยู่แล้ว
-- ฝั่งครู (saveScore) เขียนผ่าน client ที่ผูก RLS ปกติ ต้องเช็คทั้ง course owner และ student owner คู่กัน
-- (ตาม pattern ที่แก้ไว้ใน 0008_rls_cross_owner_fix.sql กันช่องโหว่ cross-owner)
create policy "xp_events_owner_all" on xp_events
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  );

create policy "xp_streak_bonuses_owner_all" on xp_streak_bonuses
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  );
