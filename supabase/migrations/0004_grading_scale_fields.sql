-- เพิ่มฟิลด์ที่ต้องใช้แสดงตารางเกณฑ์การให้คะแนน (Grading Scale) ตาม ui_design/04_grade_structure.png
-- description = คำอธิบายระดับ (เช่น "ดีเยี่ยม (Excellent)"), gpa_value = ค่าระดับ (เช่น 4.00)
-- ช่วงคะแนน (max ของแต่ละระดับ) ไม่เก็บเป็นคอลัมน์ เพราะคำนวณได้จาก min_score ของระดับที่สูงกว่าถัดไปเสมอ
-- (เก็บซ้ำจะเสี่ยงข้อมูลไม่ตรงกันถ้าแก้ระดับหนึ่งแล้วลืมแก้อีกระดับ)
alter table grading_scales
  add column description text not null default '',
  add column gpa_value numeric(3, 2);
