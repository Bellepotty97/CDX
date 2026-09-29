#!/usr/bin/env python3
"""เติมหมายเลขรุ่นต่อท้าย URL ของ CSS/JS ในหน้าเว็บทุกหน้า
   เพื่อให้เบราว์เซอร์ของผู้ใช้โหลดไฟล์ใหม่ทันทีหลัง deploy ไม่ติดแคชเก่า
   ใช้: python3 tools/bump-assets.py            (ตั้งรุ่นเป็นวันที่วันนี้)
        python3 tools/bump-assets.py 20260930   (ระบุรุ่นเอง)"""
import re, sys, glob, io, os, datetime

ver = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().strftime("%Y%m%d")
PAT = re.compile(r'((?:src|href)=")((?:assets|data)/[^"?]+\.(?:js|css))(?:\?v=[^"]*)?(")')
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = 0
for f in sorted(glob.glob(os.path.join(root, "*.html"))):
    s = io.open(f, encoding="utf-8").read()
    s2, c = PAT.subn(lambda m: f'{m.group(1)}{m.group(2)}?v={ver}{m.group(3)}', s)
    if c and s2 != s:
        io.open(f, "w", encoding="utf-8").write(s2)
        print(f"{os.path.basename(f):24} {c} ไฟล์")
        n += c
print(f"ตั้งรุ่นเป็น {ver} รวม {n} รายการ")
