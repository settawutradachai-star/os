# Blueberry - Sequential E-ED Flow

ระบบถูกปรับให้ทำงานตามลำดับของบทเรียนจากบนลงล่าง:

1. แบบทดสอบก่อนเรียนต้องเสร็จก่อน
2. จึงเริ่มเนื้อหา/วิดีโอได้
3. วิดีโอจะยิง `POST /heartbeat` ผ่าน `/api/heartbeat` ซ้ำจน e-ED ตอบ `percent >= 100` เท่านั้น (`item_complete === "Y"` แต่ percent ยังไม่ถึง 100 จะยังไม่ปลดล็อก)
4. Payload วิดีโอใช้:
   - `h: 44000`
   - `itemid`: lesson itemid
   - `lesson_type: "Y"`
   - `lessonid`: lessonid
   - `recid`: recid ของการลงทะเบียนวิชา
5. เมื่อ heartbeat รายงาน `percent >= 100` เท่านั้นจึงไปแบบทดสอบหลังเรียน
6. ทำ item ก่อนหน้าไม่เสร็จ จะไม่สามารถข้ามไป item ถัดไปได้
7. เลือก Auto หลายงาน ระบบจะประมวลผลตามลำดับที่ e-ED ส่งมา ไม่ได้แยกทำ quiz/media เป็นคนละกลุ่ม

## Run

```bash
npm i
npm run dev
```

ถ้าเครื่องมีปัญหา `next: Permission denied` หลังแตก ZIP ให้รัน:

```bash
rm -rf node_modules
npm i
npm run dev
```
