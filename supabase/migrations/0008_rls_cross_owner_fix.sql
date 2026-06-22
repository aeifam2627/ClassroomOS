-- Hardening: ปิดช่องโหว่ RLS ที่เช็คแค่ฝั่ง course/grade_item ว่าเป็นของครู
-- แต่ไม่ได้เช็คว่า student_id ที่อ้างถึงเป็นนักเรียนของครูคนเดียวกันด้วย
-- เดิม: ครู A อาจ insert/update แถวที่ระบุ student_id ของนักเรียนครู B ได้
-- (ถ้ารู้ uuid) เพราะ policy ผ่านแค่ฝั่ง course_id/grade_item_id เท่านั้น

drop policy "course_students_owner_all" on course_students;

create policy "course_students_owner_all" on course_students
  for all using (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = course_id and c.owner_id = auth.uid())
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  );

drop policy "student_scores_owner_all" on student_scores;

create policy "student_scores_owner_all" on student_scores
  for all using (
    exists (
      select 1 from grade_items gi
      join score_categories sc on sc.id = gi.category_id
      join courses c on c.id = sc.course_id
      where gi.id = grade_item_id and c.owner_id = auth.uid()
    )
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  ) with check (
    exists (
      select 1 from grade_items gi
      join score_categories sc on sc.id = gi.category_id
      join courses c on c.id = sc.course_id
      where gi.id = grade_item_id and c.owner_id = auth.uid()
    )
    and exists (select 1 from students s where s.id = student_id and s.owner_id = auth.uid())
  );
