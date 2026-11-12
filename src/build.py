import json, re, sys, random
test = '--test' in sys.argv
out = sys.argv[sys.argv.index('--out')+1]

LIGHT = """:root{
  --bg:#F4F8FC; --card:#FFFFFF; --ink:#0A2647; --muted:#556E8B; --line:#DCE8F4; --line-2:#EAF2FA; --soft:#E3F0FC;
  --primary:#1568B8; --link:#1568B8; --up:#C7392B; --up-soft:#FDE7E4; --down:#0A7F72; --down-soft:#E1F7F3;
  --grid:#E6EEF8; --series-main:#1568B8; --bar-prev:#BFD9F2; --field:#FFFFFF;
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --s4:#eda100;
  --tt-bg:#0A2647; --shadow-sm:0 1px 2px rgba(8,34,64,.05),0 10px 28px -14px rgba(8,34,64,.16);
}"""
DARK = """    --bg:#07142A; --card:#0F2341; --ink:#E8F0FA; --muted:#9DB4CF; --line:#21406A; --line-2:#16335A; --soft:#14335C;
    --primary:#2F76C8; --link:#7DBBF5; --up:#FF9F93; --up-soft:rgba(239,91,75,.18); --down:#5FE0CF; --down-soft:rgba(15,185,167,.16);
    --grid:#1A3760; --series-main:#5AA9F0; --bar-prev:#33557F; --field:#0B1D38;
    --s1:#3987e5; --s2:#d95926; --s3:#199e70; --s4:#c98500;
    --tt-bg:#030B17; --shadow-sm:0 3px 12px -4px rgba(0,0,0,.5);"""

css = open('style.css', encoding='utf-8').read()
css = css.replace('/*__LIGHT_TOKENS__*/', LIGHT).replace('/*__DARK_TOKENS__*/', DARK)
css = re.sub(r'\.panel\{display:block !important;\}', '', css)

head = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="ดัชนีและราคากลางสินค้าสัตว์น้ำ องค์การสะพานปลา เลือกช่วงเวลา ดูราคาย้อนหลัง และเปรียบเทียบราคาได้">
<meta name="theme-color" content="#0A2647">
<title>ดัชนีราคากลางสินค้าสัตว์น้ำ | องค์การสะพานปลา</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&family=Prompt:wght@500;600;700&display=swap" rel="stylesheet">
<style>
""" + css + """
</style>
</head>
"""
seed = json.load(open('seed_data.json', encoding='utf-8'))
if test:
    # SYNTHETIC DATA FOR TESTING ONLY — never shipped
    random.seed(7)
    base = seed['prices'][seed['dates'][0]]
    for y in (2021, 2022, 2023, 2024):
        for m in range(1, 13):
            for d in (1, 15):
                date = f"{y}-{m:02d}-{d:02d}"
                drift = 1 + (y-2024)*0.05 + 0.06*__import__('math').sin(m/12*6.28)
                rec = {}
                for iid, sizes in base.items():
                    rec[iid] = {s: round(p*drift*(1+random.uniform(-.03,.03))) for s, p in sizes.items()}
                seed['prices'][date] = rec
    for m in range(1, 11):
        date = f"2026-{m:02d}-01"
        rec = {iid: {s: round(p*1.04*(1+random.uniform(-.03,.03))) for s, p in sizes.items()} for iid, sizes in base.items()}
        seed['prices'][date] = rec
    seed['dates'] = sorted(seed['prices'])
seed_json = json.dumps(seed, ensure_ascii=False, separators=(',', ':'))
logo = open('logo_b64.txt').read().strip()
chartjs = open('chart.umd.js', encoding='utf-8').read()
i18n = open('i18n.js', encoding='utf-8').read()
assert '</script' not in chartjs.lower(), 'chart.js contains </script'
assert '</script' not in seed_json.lower()
app = open('app.js', encoding='utf-8').read()
body = open('body.html', encoding='utf-8').read()
body = body.replace('__SEED_JSON__', seed_json).replace('__LOGO_B64__', logo).replace('__CHARTJS__', chartjs).replace('__I18N_JS__', i18n).replace('__APP_JS__', app)
open(out, 'w', encoding='utf-8').write(head + body)
print('built', out, len(head + body), 'bytes', 'TEST' if test else 'PROD')
