-- เพิ่ม "บท" (chapters) เป็นมิติจัดกลุ่มชิ้นงานแบบแยกจากหมวดหมู่คะแนน (score_categories)
-- บทไม่มีน้ำหนักของตัวเอง เป็นแค่ tag จัดกลุ่ม/กรองดูใบงาน — น้ำหนักจริงคำนวณจาก score_categories เดิม
create table chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_chapters_course_id on chapters (course_id);

-- ลบบทแล้วชิ้นงานไม่ต้องหายตาม แค่กลายเป็น "ไม่ระบุบท" (ตัดความสัมพันธ์ ไม่ตัดข้อมูลคะแนน)
alter table grade_items
  add column chapter_id uuid references chapters (id) on delete set null;

create index idx_grade_items_chapter_id on grade_items (chapter_id);

alter table chapters enable row level security;

create policy "chapters_owner_all" on chapters
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  );
