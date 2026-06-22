-- เพิ่มรายละเอียดชิ้นงาน (คืออะไร ให้ทำอะไร) แยกจากชื่อชิ้นงาน (title) ที่เป็นแค่ชื่อสั้นๆ
alter table grade_items
  add column description text not null default '';
