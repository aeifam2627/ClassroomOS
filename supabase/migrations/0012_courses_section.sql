-- เพิ่ม "ห้อง" (section) เพื่อแยกครูสอนวิชาเดียวกันหลายห้อง (เช่น 1/1, 1/2) เป็น free text เปิดกว้าง
alter table courses
  add column section text not null default '';
