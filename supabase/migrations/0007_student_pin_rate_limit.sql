-- กฎ #3 ใน CLAUDE.md: PIN มีแค่ 4-6 หลัก ต้องมี rate limiting ป้องกัน brute-force
-- เก็บจำนวนครั้งที่กรอกผิดติดต่อกัน + เวลาที่ถูกล็อกไว้ที่ตัวนักเรียนเลย (ไม่ต้องมีตารางแยก)
alter table students
  add column pin_failed_attempts int not null default 0,
  add column pin_locked_until timestamptz;
