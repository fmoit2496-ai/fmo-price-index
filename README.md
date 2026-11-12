# FMO Aquatic Product Price Index Dashboard
# แดชบอร์ดดัชนีราคากลางสินค้าสัตว์น้ำ (องค์การสะพานปลา)

Handover package for the IT team · ชุดส่งมอบสำหรับฝ่าย IT

- Live demo / เว็บที่เผยแพร่อยู่: https://velvety-daffodil-8f6d37.netlify.app
- Languages / ภาษา: Thai, Chinese (Simplified), English — `?lang=th|zh|en`
- Data coverage / ข้อมูล: 82 announcements, 2022-02-01 → 2026-10-01, 53 items

---

## ภาษาไทย

### 1. ภาพรวม
เว็บแสดงราคากลางสินค้าสัตว์น้ำ 53 รายการ และ "ดัชนีราคากลาง" จากประกาศขององค์การสะพานปลา
เป็น **ไฟล์ HTML ไฟล์เดียว** (`dist/index.html`) ไม่มีเซิร์ฟเวอร์หลังบ้าน ไม่มีฐานข้อมูล
ข้อมูลราคาทั้งหมดฝังอยู่ในไฟล์ ใช้งานได้โดยเปิดไฟล์ในเบราว์เซอร์ หรือวางบนเว็บโฮสต์แบบ static ใดก็ได้

ฟังก์ชันหลัก: ค้นหาราคาสินค้า (เล็ก/กลาง/ใหญ่), ตารางและการ์ดราคาพร้อมเทียบกับประกาศก่อนหน้าหรือ 1 ปีก่อน,
กราฟแนวโน้ม, ดัชนีรวมและรายหมวด, ดาวน์โหลดราคาเป็น CSV, โหมดมืด, 3 ภาษา

### 2. โครงสร้างโฟลเดอร์
```
fmo-price-dashboard/
├─ README.md
├─ dist/index.html          ไฟล์เว็บที่พร้อมใช้ (ตัวเดียวกับที่อยู่บน Netlify)
├─ src/
│  ├─ body.html             โครงหน้าเว็บ (HTML)
│  ├─ style.css             การตกแต่ง
│  ├─ app.js                ตรรกะทั้งหมด: ข้อมูล, ดัชนี, กราฟ, ตาราง, ค้นหา, ส่งออก CSV, หน้าแอดมิน
│  ├─ i18n.js               ระบบ 3 ภาษา (พจนานุกรม + กฎแปลงข้อความ)
│  ├─ chart.umd.js          Chart.js 4.4.0 (ไลบรารีกราฟ)
│  ├─ seed_data.json        ข้อมูลราคาทั้งหมด (แก้ไฟล์นี้เมื่อมีประกาศใหม่)
│  ├─ logo_b64.txt          โลโก้ (base64)
│  └─ build.py              สคริปต์รวมไฟล์ทั้งหมดเป็น index.html
└─ data/
   ├─ fmo-data-sources.csv  รายการประกาศ 82 ฉบับ + รหัสเอกสารต้นทาง + หมายเหตุการถอดข้อมูล
   └─ fmo-price-template.csv แม่แบบ CSV สำหรับนำเข้าราคา
```

### 3. วิธีสร้างไฟล์เว็บใหม่ (build)
ต้องมี Python 3 (ไม่ต้องติดตั้งแพ็กเกจเพิ่ม)
```
cd src
python3 build.py --out ../dist/index.html
```
เปิด `dist/index.html` ในเบราว์เซอร์เพื่อทดสอบ แล้วนำไปวางบนเว็บโฮสต์
(ผลลัพธ์จากคำสั่งนี้ตรงกับไฟล์ `dist/index.html` ที่ให้มา ตรวจเทียบแล้ว)

### 4. วิธีเพิ่มประกาศราคาใหม่
แก้ `src/seed_data.json` ซึ่งมี 4 ส่วน
- `items` : รหัสสินค้า → `{th, en, zh, cat, sizes[]}`
  (`cat` = fish | crab | squid | shrimp | shell, `sizes` ⊂ S, M, B, JAR)
- `dates` : รายการวันที่ประกาศ เรียงจากเก่าไปใหม่ รูปแบบ `YYYY-MM-DD` (ค.ศ.)
- `prices` : `prices["2026-10-01"][รหัสสินค้า]["M"] = 260` (หน่วย บาท/กก.)
- `meta` : `meta["วันที่"] = {doc: รหัสเอกสารต้นทาง, note: หมายเหตุ(ถ้ามี)}`

เมื่อเพิ่มวันที่ใหม่ ต้องเพิ่มทั้งใน `dates` และ `prices` แล้ว build ใหม่
ระบบคำนวณดัชนีและกราฟให้อัตโนมัติ

### 5. วิธีคำนวณดัชนี
ดัชนี = ค่าเฉลี่ยของ (ราคาแต่ละรายการ ÷ ราคาของรายการเดียวกันในประกาศฐาน) × 100
ประกาศฐานตรึงไว้ที่ **1 ม.ค. 2568 (2025-01-01)** ตั้งค่าที่ `OFFICIAL_BASE` ใน `app.js`
(ข้อมูลปีก่อนหน้านำมาแสดงในกราฟแต่ไม่เปลี่ยนค่าฐาน)
หอยนางรมแกะเนื้อ (กระปุก) ประกาศเป็นช่วง 200–250 ระบบเก็บเป็นค่ากลาง 225
เดือนที่ไม่มีเอกสารประกาศ ระบบไม่ประมาณค่า กราฟจะเชื่อมเฉพาะจุดที่มีประกาศจริง

### 6. ระบบ 3 ภาษา (`src/i18n.js`)
ต้นฉบับข้อความในหน้าเว็บเป็นภาษาไทย ระบบแปลตอนแสดงผล (runtime) โดย
- พจนานุกรมคู่ข้อความ [ไทย, อังกฤษ, จีน] และกฎ regex สำหรับข้อความที่มีตัวเลข/วันที่
- ชื่อสินค้าอ่านจาก `items[].en / .zh` ใน `seed_data.json`
- วันที่แปลง พ.ศ. → ค.ศ. สำหรับภาษาอังกฤษและจีน
- ภาษาถูกเลือกจาก `?lang=` → ค่าที่จำใน `localStorage` (`fmo.lang`) → ภาษาของเบราว์เซอร์ → ค่าเริ่มต้นไทย

**ถ้าแก้ข้อความไทยในหน้าเว็บ** ต้องเพิ่มข้อความคู่แปลใน `i18n.js` ด้วย ไม่เช่นนั้นภาษาอังกฤษ/จีนจะยังแสดงเป็นไทย
ทางเลือกในอนาคต: ย้ายเป็นไฟล์แปลแบบ key-value (เช่น i18next) ซึ่งดูแลง่ายกว่า

### 7. หน้าแอดมิน (นำเข้าราคาในเบราว์เซอร์)
เปิดโดยต่อท้ายลิงก์ด้วย `#admin` (ปิดด้วย `#admin-off`) ใช้นำเข้า CSV หรือกรอกราคาเอง
**ข้อจำกัดสำคัญ**
- ข้อมูลที่นำเข้าเก็บใน `localStorage` ของเบราว์เซอร์เครื่องนั้นเท่านั้น (`fmo.custom`) ผู้ใช้คนอื่นไม่เห็น
- **ไม่มีระบบล็อกอิน** ใครรู้ `#admin` ก็เปิดหน้าได้ (แต่ไม่กระทบเครื่องของคนอื่น)
- หน้านี้เป็นภาษาไทยอย่างเดียว

ถ้าต้องการให้ฝ่ายที่รับผิดชอบกรอกราคาแล้วทุกคนเห็นพร้อมกัน ต้องพัฒนาส่วนหลังบ้านเพิ่ม (ดูข้อ 9)

### 8. การพึ่งพาภายนอก
- Google Fonts (Prompt, IBM Plex Sans Thai, Noto Sans SC) โหลดจาก `fonts.googleapis.com`
  ถ้าเครือข่ายหน่วยงานบล็อก เว็บยังใช้ได้ แต่ฟอนต์จะเป็นฟอนต์สำรองของระบบ
  (ถ้าต้องการ ให้ดาวน์โหลดฟอนต์มาเก็บไว้ที่เซิร์ฟเวอร์เอง)
- ไม่มีการเรียก API หรือส่งข้อมูลผู้ใช้ออกนอกเว็บ ไม่มีระบบวิเคราะห์ผู้เข้าชม

### 9. ข้อเสนอแนะสำหรับการพัฒนาต่อ
1. ย้ายข้อมูลราคาไปฐานข้อมูล/API และทำหน้าแอดมินที่มีระบบล็อกอิน เพื่อให้ฝ่ายที่รับผิดชอบกรอกราคาได้เอง
2. ผูกกับโดเมนขององค์การ (เช่น price.fmo.org) และตั้ง HTTPS
3. เก็บซอร์สใน Git (GitHub/GitLab) แล้วตั้ง CI/CD ให้ build และ deploy อัตโนมัติ
4. ย้ายข้อความ 3 ภาษาเป็นไฟล์แปลที่แก้ง่าย
5. เพิ่มการทดสอบอัตโนมัติ (ชุดทดสอบที่ใช้ตอนพัฒนาไม่ได้รวมมาในชุดนี้)
6. ตรวจสอบการเข้าถึง (accessibility) และเพิ่ม export เป็น .xlsx หากต้องการ

### 10. ข้อควรตรวจสอบก่อนเผยแพร่อย่างเป็นทางการ
- **ข้อมูลถอดจากไฟล์ PDF สแกนด้วยการอ่านด้วยตา** (ไม่ใช่ข้อมูลดิจิทัลต้นทาง) ข้อมูลปี 2565–2567 และ 2569 ควรให้เจ้าหน้าที่ตรวจเทียบต้นฉบับ
  ประกาศที่มีหมายเหตุใน `data/fmo-data-sources.csv` ควรตรวจเป็นพิเศษ
- บางเดือนไม่มีเอกสารประกาศ (เช่น ปี 2564 ไม่มีข้อมูล)
- **ชื่อสินค้าภาษาจีนและอังกฤษ รวมถึงชื่อองค์การภาษาจีน เป็นฉบับแปลที่ยังไม่ผ่านการตรวจโดยองค์การ**
  รายการ "Catfish" และ "Shad" ชื่ออังกฤษตามประกาศ อาจติดป้ายผิด ควรตรวจกับผู้เชี่ยวชาญ
- ไม่ควรใช้ข้อมูลเพื่อการอ้างอิงทางกฎหมายหรือการค้า จนกว่าองค์การจะรับรองข้อมูล

---

## English

### 1. Overview
A static dashboard of benchmark prices for 53 aquatic products plus a price index, built from the
Fish Marketing Organization's announcements. It is **one self-contained HTML file** (`dist/index.html`):
no backend, no database, all data embedded. Host it on any static web host.

Features: product price search (S/M/B), price table and cards with comparison to the previous
announcement or 1 year earlier, trend charts, overall and per-category index, CSV download,
dark mode, three languages.

### 2. Layout
See the tree in the Thai section. `src/` holds the sources, `dist/index.html` is the built
output (identical to what is live), `data/` holds the audit list and the CSV import template.

### 3. Build
Requires Python 3 only (no extra packages).
```
cd src
python3 build.py --out ../dist/index.html
```
The output was verified byte-identical to the supplied `dist/index.html`.

### 4. Adding a new announcement
Edit `src/seed_data.json`:
- `items`: id → `{th, en, zh, cat, sizes[]}` (`cat`: fish | crab | squid | shrimp | shell; sizes: S, M, B, JAR)
- `dates`: announcement dates, oldest first, `YYYY-MM-DD` (Gregorian)
- `prices`: `prices["2026-10-01"][itemId]["M"] = 260` (THB/kg)
- `meta`: `meta[date] = {doc: sourceDocId, note: optional}`

Add the date to both `dates` and `prices`, then rebuild.

### 5. Index method
Index = mean of (item price ÷ same item's price at the base announcement) × 100.
The base is pinned to **1 Jan 2025** (`OFFICIAL_BASE` in `app.js`); earlier data is charted
but does not change the base. Shucked oyster (jar) is announced as a 200–250 range and stored as
the midpoint, 225. Months without an announcement are not estimated; charts connect real points only.

### 6. Internationalisation (`src/i18n.js`)
UI text is authored in Thai and translated at runtime with a dictionary of [th, en, zh] pairs plus
regex rules for strings containing numbers and dates. Item names come from `items[].en/.zh`.
Buddhist-era dates are converted to Gregorian for en/zh. Language precedence: `?lang=` →
`localStorage` (`fmo.lang`) → browser language → Thai.
**If you change Thai UI copy, add its translations to `i18n.js`**, or en/zh will show Thai.
A key-value translation library (e.g. i18next) would be easier to maintain.

### 7. Admin panel
Open with `#admin` appended to the URL (`#admin-off` to hide). It imports CSV or manual prices.
Limitations: imported data is stored only in that browser's `localStorage` (`fmo.custom`) and is not
shared with other visitors; there is **no authentication**; the panel is Thai-only.
Shared, multi-user data entry needs a backend (see 9).

### 8. External dependencies
Google Fonts (Prompt, IBM Plex Sans Thai, Noto Sans SC) from `fonts.googleapis.com`; if blocked the
site still works with fallback fonts (self-host the fonts if needed). No API calls, no analytics,
no user data leaves the page. Chart.js 4.4.0 is embedded.

### 9. Suggested next steps
1. Move price data to a database/API and build an authenticated admin for data entry.
2. Use an FMO domain (e.g. price.fmo.org) with HTTPS.
3. Keep the source in Git with CI/CD for build and deploy.
4. Move translations to maintainable resource files.
5. Add automated tests (the development test scripts are not included).
6. Accessibility audit; add .xlsx export if required.

### 10. Verify before official release
- **Data was transcribed visually from scanned PDFs**, not from a digital source. Data for 2022–2024
  and 2026 should be checked against the originals by FMO staff; check announcements flagged in
  `data/fmo-data-sources.csv` first. Some months have no announcement document.
- **Chinese and English item names and the Chinese organisation name are unreviewed translations.**
  Items "Catfish" and "Shad" mirror the announcement and may be mislabelled.
- Do not use the data for legal or commercial reference until FMO has confirmed it.
