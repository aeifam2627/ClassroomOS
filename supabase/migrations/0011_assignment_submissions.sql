-- ฟีเจอร์: นักเรียนส่งงาน (อัปโหลดไฟล์) ผูกกับชิ้นงาน (grade_items) ที่ครูสร้างไว้ + วันกำหนดส่งพื้นฐาน

-- วันกำหนดส่งของชิ้นงาน ไม่บังคับใส่ ไม่มี logic บล็อกการส่งหลังกำหนด แค่ใช้คำนวณสถานะ "ส่งล่าช้า" ตอนแสดงผล
alter table grade_items
  add column due_at timestamptz;

-- เก็บไฟล์ที่นักเรียนส่งต่อชิ้นงาน คนละตารางจาก student_scores เพราะ student_scores.updated_by
-- NOT NULL อ้าง users(id) (ครู) นักเรียนไม่มี auth.uid() จะสร้างแถวเองในตารางนั้นไม่ได้
-- ส่งใหม่ทับของเดิมได้ (resubmit) — unique (grade_item_id, student_id) มีแถวเดียวต่อคู่นี้เสมอ
create table assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  grade_item_id uuid not null references grade_items (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_size bigint not null,
  submitted_at timestamptz not null default now(),
  unique (grade_item_id, student_id)
);

create index idx_assignment_submissions_grade_item_id on assignment_submissions (grade_item_id);
create index idx_assignment_submissions_student_id on assignment_submissions (student_id);

alter table assignment_submissions enable row level security;

-- ครูดูได้เฉพาะของวิชาตัวเอง — นักเรียนไม่มี auth.uid() เลย เขียน/อ่านฝั่งนักเรียนผ่าน service role เท่านั้น (bypass RLS)
create policy "assignment_submissions_owner_select" on assignment_submissions
  for select using (
    exists (
      select 1 from grade_items gi
      join score_categories sc on sc.id = gi.category_id
      join courses c on c.id = sc.course_id
      where gi.id = grade_item_id and c.owner_id = auth.uid()
    )
  );

-- ครูลบได้ (ไฟล์ผิด/อยากให้ส่งใหม่) ด้วยเงื่อนไขเดียวกัน — ไม่เปิด insert/update policy ให้ authenticated/anon เลย
create policy "assignment_submissions_owner_delete" on assignment_submissions
  for delete using (
    exists (
      select 1 from grade_items gi
      join score_categories sc on sc.id = gi.category_id
      join courses c on c.id = sc.course_id
      where gi.id = grade_item_id and c.owner_id = auth.uid()
    )
  );

-- Storage bucket แบบ private — ไม่เปิด policy บน storage.objects ให้ authenticated/anon เข้าถึงเลย
-- ทุกการอ่าน/เขียนไฟล์ทำผ่าน createServiceClient() ฝั่งเซิร์ฟเวอร์เท่านั้น (เข้ากับ pattern เดิมของระบบที่นักเรียนไม่มี auth.uid())
insert into storage.buckets (id, name, public)
values ('assignment-submissions', 'assignment-submissions', false)
on conflict (id) do nothing;
