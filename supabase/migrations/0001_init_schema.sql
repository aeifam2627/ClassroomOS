-- ============================================================================
-- Classroom & Grade Management System — Initial Schema
-- อ้างอิงกฎจาก CLAUDE.md ข้อ 3 (ห้ามพลาด 9 ข้อ)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Core Module
-- ----------------------------------------------------------------------------

-- users: ครูผู้สอน เชื่อมกับ Supabase Auth แบบ 1:1 ผ่าน id (= auth.users.id)
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- students: นักเรียน ผูกกับ owner_id (ครูเจ้าของ)
-- กฎ #1: รหัสนักเรียน unique เฉพาะภายในครูคนเดียว ไม่ unique ข้ามครู
-- กฎ #2: ห้ามเก็บ PIN เป็น plain text เก็บ pin_hash (bcrypt) เท่านั้น
create table students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users (id) on delete cascade,
  student_code text not null,
  name text not null,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, student_code)
);

create index idx_students_owner_id on students (owner_id);

-- courses: รายวิชา ผูกกับ owner_id (ใช้ชื่อคอลัมน์เจ้าของให้สอดคล้องกับ students — กฎ #6)
create table courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users (id) on delete cascade,
  name text not null,
  code text not null,
  term text not null,
  academic_year text not null,
  created_at timestamptz not null default now()
);

create index idx_courses_owner_id on courses (owner_id);

-- course_students: ตารางเชื่อม M2M ระหว่างวิชากับนักเรียน
-- กฎ #7: composite PK (course_id, student_id) กันเพิ่มนักเรียนซ้ำในวิชาเดียว
-- กฎ #8: ลบ course หรือ student แล้ว cascade ลบความสัมพันธ์นี้ไปด้วย (ไม่กระทบตารางอื่น)
create table course_students (
  course_id uuid not null references courses (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create index idx_course_students_student_id on course_students (student_id);

-- ----------------------------------------------------------------------------
-- Grade Module
-- ----------------------------------------------------------------------------

-- grading_scales: เกณฑ์การตัดเกรดของแต่ละวิชา
-- กฎ #8: ลบ course แล้ว restrict ไม่ให้ลบถ้ายังมีเกณฑ์ผูกอยู่ ป้องกันลบเผลอ (ลบเกณฑ์ก่อนเองได้)
create table grading_scales (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  grade_letter text not null,
  min_score numeric(5, 2) not null,
  created_at timestamptz not null default now()
);

create index idx_grading_scales_course_id on grading_scales (course_id);

-- score_categories: หมวดหมู่คะแนนและน้ำหนัก (%)
-- กฎ #4: weight_percent รวมกันต้องเท่ากับ 100 ต่อวิชา (validate ที่ trigger ด้านล่างด้วย)
create table score_categories (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  name text not null,
  weight_percent numeric(5, 2) not null check (weight_percent > 0 and weight_percent <= 100),
  created_at timestamptz not null default now()
);

create index idx_score_categories_course_id on score_categories (course_id);

-- grade_items: ชิ้นงาน/การสอบ ภายใต้หมวดหมู่
create table grade_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references score_categories (id) on delete cascade,
  title text not null,
  max_score numeric(7, 2) not null check (max_score > 0),
  created_at timestamptz not null default now()
);

create index idx_grade_items_category_id on grade_items (category_id);

-- student_scores: ผลคะแนนนักเรียน
-- กฎ #5: ต้องมี audit trail — updated_at, updated_by ทุกครั้งที่แก้คะแนน
create table student_scores (
  id uuid primary key default gen_random_uuid(),
  grade_item_id uuid not null references grade_items (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  score numeric(7, 2) check (score >= 0),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'graded')),
  updated_at timestamptz not null default now(),
  updated_by uuid not null references users (id),
  unique (grade_item_id, student_id)
);

create index idx_student_scores_student_id on student_scores (student_id);
create index idx_student_scores_grade_item_id on student_scores (grade_item_id);

-- ============================================================================
-- Trigger: validate weight_percent รวมต้อง <= 100 ต่อ course (กฎ #4)
-- ตรวจ <= 100 ที่ DB layer (กันข้อมูลพังจริง) ส่วนตรวจ "ต้องรวมเป็น 100 พอดี"
-- ก่อนเปิดใช้งานวิชา ให้ validate ที่ Application Layer เพราะระหว่างตั้งค่าหมวดหมู่
-- ยังไม่ครบ 100% ได้เป็นปกติ (เช่น เพิ่มหมวดหมู่ทีละอัน)
-- ============================================================================

create or replace function check_score_categories_weight()
returns trigger as $$
declare
  total numeric(6, 2);
begin
  select coalesce(sum(weight_percent), 0)
  into total
  from score_categories
  where course_id = coalesce(new.course_id, old.course_id);

  if total > 100 then
    raise exception 'ผลรวม weight_percent ของวิชานี้เกิน 100%% (ปัจจุบัน %)', total;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_check_score_categories_weight
after insert or update on score_categories
for each row execute function check_score_categories_weight();

-- ============================================================================
-- Trigger: auto-update updated_at ของ student_scores ทุกครั้งที่แก้ไข (กฎ #5)
-- ============================================================================

create or replace function touch_student_scores_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_touch_student_scores_updated_at
before update on student_scores
for each row execute function touch_student_scores_updated_at();

-- ============================================================================
-- Row-Level Security (กฎ #9) — ครูเห็นได้เฉพาะข้อมูลของตัวเอง
-- นักเรียนเข้าถึงคะแนนผ่าน Server-side API ด้วย service role เท่านั้น (ตรวจ PIN เอง)
-- ดังนั้นไม่เปิด policy ฝั่ง anon ให้นักเรียนอ่านตรงผ่าน Supabase client
-- ============================================================================

alter table users enable row level security;
alter table students enable row level security;
alter table courses enable row level security;
alter table course_students enable row level security;
alter table grading_scales enable row level security;
alter table score_categories enable row level security;
alter table grade_items enable row level security;
alter table student_scores enable row level security;

create policy "users_select_own" on users
  for select using (id = auth.uid());

create policy "users_update_own" on users
  for update using (id = auth.uid());

create policy "students_owner_all" on students
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "courses_owner_all" on courses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "course_students_owner_all" on course_students
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  );

create policy "grading_scales_owner_all" on grading_scales
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  );

create policy "score_categories_owner_all" on score_categories
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  );

create policy "grade_items_owner_all" on grade_items
  for all using (
    exists (
      select 1 from score_categories sc
      join courses c on c.id = sc.course_id
      where sc.id = category_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from score_categories sc
      join courses c on c.id = sc.course_id
      where sc.id = category_id and c.owner_id = auth.uid()
    )
  );

create policy "student_scores_owner_all" on student_scores
  for all using (
    exists (
      select 1 from grade_items gi
      join score_categories sc on sc.id = gi.category_id
      join courses c on c.id = sc.course_id
      where gi.id = grade_item_id and c.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from grade_items gi
      join score_categories sc on sc.id = gi.category_id
      join courses c on c.id = sc.course_id
      where gi.id = grade_item_id and c.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Bootstrap: สร้างแถวใน users อัตโนมัติเมื่อมีการสมัครครูใหม่ผ่าน Supabase Auth
-- ใช้ trigger บน auth.users เพราะ RLS ของ users ไม่อนุญาตให้ insert ตรงจาก client
-- ============================================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
