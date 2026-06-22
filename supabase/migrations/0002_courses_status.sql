-- เพิ่มสถานะรายวิชา ใช้ตอนแสดงผลหน้าจัดการรายวิชา (เปิดสอน / ปิดเรียน / เตรียมเปิดสอน)
-- เก็บเป็นค่าภาษาอังกฤษใน DB แล้วแปลเป็นไทยที่ UI layer เพื่อให้ผูกกับ check constraint ได้ง่ายกว่า
alter table courses
  add column status text not null default 'upcoming'
    check (status in ('open', 'closed', 'upcoming'));
