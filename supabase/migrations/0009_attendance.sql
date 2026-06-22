-- โมดูลเช็คชื่อ (attendance) — feature ใหม่นอก scope เดิม ต่อยอดจาก courses/students
-- ไม่แก้ตารางหลัก แค่เพิ่มตารางใหม่ 2 ตาราง ตามที่ CLAUDE.md กันที่ไว้ใน schema ไว้แล้ว

create table attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  session_date date not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references users (id),
  unique (course_id, session_date)
);

create index idx_attendance_sessions_course_id on attendance_sessions (course_id);

-- กฎ #5 แบบเดียวกับ student_scores: เก็บ audit trail (updated_at, updated_by)
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references attendance_sessions (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'excused')),
  note text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid not null references users (id),
  unique (session_id, student_id)
);

create index idx_attendance_records_session_id on attendance_records (session_id);
create index idx_attendance_records_student_id on attendance_records (student_id);

create or replace function touch_attendance_records_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_touch_attendance_records_updated_at
before update on attendance_records
for each row execute function touch_attendance_records_updated_at();

alter table attendance_sessions enable row level security;
alter table attendance_records enable row level security;

create policy "attendance_sessions_owner_all" on attendance_sessions
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
  );

-- เช็คทั้งฝั่ง session->course และฝั่ง student เป็นของครูคนเดียวกัน
-- (เรียนรู้จากช่องโหว่ที่เจอใน course_students/student_scores — ดู 0008_rls_cross_owner_fix.sql)
create policy "attendance_records_owner_all" on attendance_records
  for all using (
    exists (
      select 1 from attendance_sessions s
      join courses c on c.id = s.course_id
      where s.id = session_id and c.owner_id = auth.uid()
    )
    and exists (select 1 from students st where st.id = student_id and st.owner_id = auth.uid())
  ) with check (
    exists (
      select 1 from attendance_sessions s
      join courses c on c.id = s.course_id
      where s.id = session_id and c.owner_id = auth.uid()
    )
    and exists (select 1 from students st where st.id = student_id and st.owner_id = auth.uid())
  );
