/* ============================================================
   i18n — ไทย / 中文 / English
   ต้นฉบับทั้งหมดในโค้ดเป็นภาษาไทย ระบบนี้แปลข้อความที่แสดงผลตอนรันไทม์
   (exact dictionary → pattern rules → date/unit replacers)
   ============================================================ */
(function () {
'use strict';
const LANGS = ['th', 'zh', 'en'];
const LS = { get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(e){} } };
const THAI = /[฀-๿]/;
let LANG = 'th';
const listeners = [];

function detect(){
  try { const q = new URLSearchParams(location.search).get('lang'); if (LANGS.includes(q)) return q; } catch(e){}
  const s = LS.get('fmo.lang'); if (LANGS.includes(s)) return s;
  const nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'th']);
  for (const l of nav){ const p = String(l).toLowerCase(); if (p.startsWith('th')) return 'th'; if (p.startsWith('zh')) return 'zh'; if (p.startsWith('en')) return 'en'; }
  return 'th';
}

/* ---------- months & dates ---------- */
const MS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const ML = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const EN_L = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EN_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE_MS = MS.map(esc).join('|'), RE_ML = ML.join('|');
const reShort = new RegExp(`(\\d{1,2}) (${RE_MS}) (\\d{2})(?!\\d)`, 'g');
const reMonYr = new RegExp(`(${RE_MS}) (\\d{2})(?!\\d)`, 'g');
const reLong  = new RegExp(`(\\d{1,2}) (${RE_ML}) (\\d{4})`, 'g');
const ce = yy => 2500 + Number(yy) - 543;
const ceL = y4 => Number(y4) - 543;
function dates(s, L){
  s = s.replace(reLong, (m, d, mo, y) => { const mi = ML.indexOf(mo), Y = ceL(y); return L === 'en' ? `${d} ${EN_L[mi]} ${Y}` : `${Y}年${mi + 1}月${Number(d)}日`; });
  s = s.replace(reShort, (m, d, mo, yy) => { const mi = MS.indexOf(mo), Y = ce(yy); return L === 'en' ? `${d} ${EN_S[mi]} ${Y}` : `${Y}/${mi + 1}/${Number(d)}`; });
  s = s.replace(reMonYr, (m, mo, yy) => { const mi = MS.indexOf(mo), Y = ce(yy); return L === 'en' ? `${EN_S[mi]} ${Y}` : `${Y}年${mi + 1}月`; });
  s = s.replace(/ปี (25\d\d)/g, (m, y) => L === 'en' ? String(ceL(y)) : ceL(y) + '年');
  return s;
}

/* ---------- exact dictionary: [th, en, zh] ---------- */
const D = [
/* brand / hero */
['ตราองค์การสะพานปลา','FMO logo','泰国鱼市场组织标志'],
['องค์การสะพานปลา','Fish Marketing Organization','泰国鱼市场组织'],
['Fish Marketing Organization','องค์การสะพานปลา',null],
['ราคากลางสินค้าสัตว์น้ำ','Aquatic product benchmark prices','水产品基准价格'],
['ดัชนีราคากลางสินค้าสัตว์น้ำ','Aquatic Product Price Index','水产品基准价格指数'],
['ราคาอ้างอิงสำหรับผู้บริโภค รวบรวมจากประกาศราคากลางสัตว์น้ำขององค์การสะพานปลา ครอบคลุมปลา กุ้ง ปู หมึก และหอย รวม','Reference prices for consumers, compiled from the benchmark aquatic-product price announcements of the Fish Marketing Organization. Covers fish, shrimp, crab, squid and shellfish, ','供消费者参考的价格，汇编自泰国鱼市场组织发布的水产品基准价格公告，涵盖鱼、虾、蟹、鱿鱼墨鱼和贝类，共'],
['รายการ เลือกช่วงเวลาและรูปแบบการแสดงผลได้ตามต้องการ',' items in total. Choose the time range and display style you prefer.','个品种。可按需选择时间范围和显示方式。'],
['ค้นหาราคาสินค้า','Search product prices','查询产品价格'],
['ค้นหาสินค้าสัตว์น้ำ','Search aquatic products','搜索水产品'],
['พิมพ์ชื่อสินค้า เช่น กุ้งลาย ปลาเก๋า หอยแครง แล้วดูราคาทันที','Type a product, e.g. green tiger prawn, grouper, blood cockle','输入产品名称，如 斑节虾、石斑鱼、血蚶，即刻查看价格'],
['ผลการค้นหา','Search results','搜索结果'],
['อาศัยอำนาจตามความในมาตรา 26 แห่งพระราชบัญญัติจัดระเบียบกิจการแพปลา พ.ศ. 2496','Issued under Section 26 of the Fish Market Regulation Act, B.E. 2496 (1953)','依据佛历2496年（公元1953年）鱼市场管理法第26条发布'],
['จุด','pts','点'],
['เทียบประกาศก่อนหน้า','vs previous announcement','较上期公告'],
['ประกาศล่าสุด','Latest announcement','最新公告'],
['ข้อมูลในระบบ','Data on file','系统内数据'],
['ทรงตัว','Steady','持平'],
['ยังไม่มีประกาศก่อนหน้าให้เทียบ','No earlier announcement to compare','暂无可对比的往期公告'],
['ไม่มีข้อมูล','No data','无数据'],
/* nav */
['เมนูหลัก','Main menu','主菜单'],
['ภาพรวมดัชนี','Overview','指数概览'],
['รายการราคา','Price list','价格列表'],
['แนวโน้มราคา','Price trends','价格走势'],
['จัดการข้อมูล','Manage data','数据管理'],
['ปรับการแสดงผล','Display options','显示设置'],
['ชนิดสินค้า','Product type','产品类别'],['สินค้า','Product','产品'],
['เลือกชนิดสินค้า','Choose a product type','选择产品类别'],
['ทุกชนิด','All types','全部类别'],
['ทั้งหมด','All','全部'],
['ปลา','Fish','鱼类'],['ปู','Crab','蟹类'],['หมึก','Squid','鱿鱼墨鱼'],['กุ้ง','Shrimp','虾类'],['หอย','Shellfish','贝类'],
['ขนาดเล็ก','Small size','小规格'],['ขนาดกลาง','Medium size','中规格'],['ขนาดใหญ่','Large size','大规格'],
['เล็ก','Small','小'],['กลาง','Medium','中'],['ใหญ่','Large','大'],['กระปุก','Jar','罐'],
/* overview */
['ภาพรวมดัชนีราคากลาง','Price index overview','基准价格指数概览'],
['อัปเดตล่าสุด','Last updated','最近更新'],
['ดัชนีราคากลางล่าสุด','Latest price index','最新基准价格指数'],
['เทียบ 1 ปีก่อน','vs 1 year ago','较一年前'],
['สูงสุด / ต่ำสุด ในช่วงที่เลือก','High / low in selected period','所选期间最高 / 最低'],
['ข้อมูลย้อนหลังที่มีในระบบ','Historical data on file','系统内历史数据'],
['ตัวเลือกกราฟดัชนี','Index chart options','指数图表选项'],
['ช่วงเวลา','Period','时间范围'],
['ความละเอียด','Detail','粒度'],
['ความละเอียดของข้อมูล','Data granularity','数据粒度'],
['กราฟ','Chart','图表'],['ชนิดกราฟ','Chart type','图表类型'],
['ดูเป็นตาราง','View as table','以表格查看'],['ดูเป็นกราฟ','View as chart','以图表查看'],
['กราฟดัชนีราคากลางสินค้าสัตว์น้ำ','Aquatic product price index chart','水产品基准价格指数图'],
['ราคาเฉลี่ยตามหมวดหมู่','Average price by category','各类别平均价格'],
['กราฟแท่งเปรียบเทียบราคาเฉลี่ยตามหมวดหมู่','Bar chart comparing average prices by category','各类别平均价格对比柱状图'],
['ราคาที่เปลี่ยนแปลงมากที่สุด','Biggest price changes','价格变动最大'],
['▲ ปรับขึ้นสูงสุด','▲ Largest increases','▲ 涨幅最大'],['▼ ปรับลงสูงสุด','▼ Largest decreases','▼ 跌幅最大'],
['ไม่มีรายการเปลี่ยนแปลง','No changes','无变动'],
['ไม่มีข้อมูลในช่วงเวลานี้','No data for this period','该时段无数据'],
['ไม่มีข้อมูลในช่วงนี้','No data for this period','该时段无数据'],
['ยังไม่มีประกาศให้เปรียบเทียบ','No announcement to compare yet','暂无可对比的公告'],
['ยังไม่มีประกาศก่อนหน้า','No earlier announcement','暂无往期公告'],
['▲ ราคาปรับสูงขึ้น','▲ Prices rose','▲ 价格上调'],['▼ ราคาปรับลดลง','▼ Prices fell','▼ 价格下调'],['ราคาทรงตัว','Prices steady','价格持平'],
['ยังไม่มีข้อมูลย้อนหลังครบ 1 ปี','Less than 1 year of history','历史数据不足一年'],
['▲ สูงกว่าปีก่อน','▲ Higher than last year','▲ 高于去年'],['▼ ต่ำกว่าปีก่อน','▼ Lower than last year','▼ 低于去年'],['ใกล้เคียงปีก่อน','Close to last year','与去年接近'],
['อัตโนมัติ (ใหญ่→กลาง→เล็ก)','Auto (large → medium → small)','自动（大→中→小）'],
['อัตโนมัติ','Auto','自动'],
/* segmented options */
['6 เดือน','6 mo','6个月'],['1 ปี','1 yr','1年'],['3 ปี','3 yr','3年'],['5 ปี','5 yr','5年'],
['รายประกาศ','Per announcement','按公告'],['รายเดือน','Monthly','按月'],['รายปี','Yearly','按年'],
['เส้น','Line','折线'],['พื้นที่','Area','面积'],['แท่ง','Bar','柱状'],
['ฐานทางการ','Official base','官方基期'],['ต้นช่วงที่เลือก','Start of period','所选期间起点'],
['ตามอุปกรณ์','Match device','跟随设备'],['สว่าง','Light','浅色'],['มืด','Dark','深色'],
['มาตรฐาน','Standard','标准'],['ใหญ่มาก','Extra large','特大'],
['ประกาศก่อนหน้า','Previous announcement','上期公告'],['1 ปีก่อน','1 year ago','一年前'],
['ตาราง','Table','表格'],['การ์ด','Cards','卡片'],['ราคา','Price','价格'],['% เปลี่ยนแปลง','% change','% 变化'],
['ต่อเนื่อง','Timeline','连续'],['เทียบรายปี','Year over year','逐年对比'],
/* price list */
['รายการราคากลาง','Benchmark price list','基准价格列表'],
['เลือกวันที่ประกาศ','Choose announcement date','选择公告日期'],['ประกาศถัดไป','Next announcement','下一期公告'],
['◀ เก่ากว่า','◀ Older','◀ 更早'],['ใหม่กว่า ▶','Newer ▶','更新 ▶'],['ล่าสุด','Latest','最新'],
['ค้นหาชื่อสินค้า เช่น กุ้งลาย ปลาเก๋า หอยแครง','Search by name, e.g. green tiger prawn, grouper','按名称搜索，如 斑节虾、石斑鱼、血蚶'],
['ค้นหาสินค้า','Search products','搜索产品'],
['เรียงตาม','Sort by','排序方式'],
['ชื่อสินค้า ก-ฮ','Name (Thai order)','名称（泰文顺序）'],['ราคาสูง → ต่ำ','Price high → low','价格 高→低'],['ราคาต่ำ → สูง','Price low → high','价格 低→高'],['เปลี่ยนแปลงมากสุด','Biggest change','变动最大'],
['หมวดหมู่','Category','类别'],['เทียบกับ','Compare with','对比'],['รูปแบบ','Layout','版式'],['รูปแบบการแสดงรายการ','List layout','列表版式'],
['ชนิดสัตว์น้ำ','Species','品种'],['ราคา (บาท/กก.)','Price (THB/kg)','价格（泰铢/公斤）'],['เทียบก่อนหน้า','vs previous','较上期'],
['ไม่พบสินค้าที่ค้นหา ลองใช้คำอื่น หรือเลือกหมวด "ทั้งหมด"','No products found. Try another word, or choose the "All" category.','未找到产品。请换个关键词，或选择“全部”类别。'],
['ราคาตามประกาศล่าสุด','Prices from the latest announcement','最新公告价格'],
/* trends */
['แนวโน้มและราคาย้อนหลัง','Trends and price history','走势与历史价格'],
['เพิ่มได้สูงสุด 4 รายการ ทั้งสินค้าและดัชนีแต่ละหมวด','Add up to 4 items — products or category indices','最多可添加4项，可选产品或各类别指数'],
['ค้นหาและเพิ่มสินค้าเพื่อเปรียบเทียบ','Search and add products to compare','搜索并添加产品进行对比'],
['ค่าที่แสดง','Show','显示内容'],['มุมมอง','View','视图'],['กราฟแนวโน้มราคา','Price trend chart','价格走势图'],
['พิมพ์ค้นหาสินค้า หรือดัชนีหมวด เพื่อเพิ่ม','Type a product or category index to add','输入产品或类别指数以添加'],
['เลือกครบ 4 รายการแล้ว','Maximum of 4 items selected','已选满4项'],
['ดัชนีรวมทุกสินค้า','Overall index','总指数'],['ดัชนี','Index','指数'],
['ดัชนี (จุด)','Index (pts)','指数（点）'],
['รายการ','Items','项'],['ล่าสุด','Latest','最新'],['เฉลี่ย','Average','平均'],['สูงสุด','High','最高'],['ต่ำสุด','Low','最低'],['เปลี่ยนแปลงในช่วง','Change in period','期间变化'],
['รายการ ','Item','项目'],
['บาทต่อกิโลกรัม','Baht per kilogram','泰铢/公斤'],
['% เปลี่ยนแปลงจากต้นช่วง','% change from start of period','较期初变化 %'],
['ค่าเฉลี่ยรายเดือนซ้อนกันตามปี','Monthly averages overlaid by year','按年叠加的月均值'],
['แสดง 6 ปีล่าสุดเท่านั้น','Showing the latest 6 years only','仅显示最近6年'],
['ขณะนี้มีข้อมูลเพียง 1 ปีในช่วงที่เลือก กราฟเทียบรายปีจะชัดขึ้นเมื่อมีข้อมูลหลายปี','Only 1 year of data in the selected range; the year-over-year chart becomes clearer with more years.','所选范围内仅有1年数据，数据年数增多后逐年对比图会更清晰。'],
['ดัชนีมีหน่วยเป็น "จุด" ส่วนสินค้ามีหน่วยเป็น "บาท/กก." จึงแสดงเป็น % เปลี่ยนแปลงจากต้นช่วงเพื่อเทียบบนแกนเดียวกัน','The index is in "points" while products are in "THB/kg", so values are shown as % change from the start of the period to share one axis.','指数单位为“点”，产品单位为“泰铢/公斤”，因此以较期初变化的百分比显示，便于在同一坐标轴比较。'],
['ไม่มีข้อมูลสำหรับสินค้า/ขนาดที่เลือกในช่วงเวลานี้ ลองเปลี่ยน "ขนาดสินค้า" ในปุ่มปรับการแสดงผล','No data for the selected product/size in this period. Try changing "Product size" in Display options.','所选产品/规格在该时段无数据。请在“显示设置”中更改“产品规格”。'],
/* drawer */
['ช่วงเวลาและความละเอียด','Period and detail','时间范围与粒度'],
['ช่วงเวลาที่แสดง','Period shown','显示的时间范围'],
['นับย้อนจากประกาศล่าสุดในระบบ ใช้กับกราฟทุกหน้า','Counted back from the latest announcement on file; applies to every chart.','从系统内最新公告向前计算，适用于所有图表。'],
['รายเดือน/รายปี คือค่าเฉลี่ยของประกาศในช่วงนั้น เหมาะกับการดูแนวโน้มหลายปี','Monthly/yearly shows the average of announcements in that period — best for multi-year trends.','按月/按年显示该时段公告的平均值，适合查看多年走势。'],
['ฐานของดัชนี (= 100)','Index base (= 100)','指数基期（= 100）'],['ฐานของดัชนี','Index base','指数基期'],
['"ฐานทางการ" = ประกาศ 1 ม.ค. 2568 ตามที่เผยแพร่ไว้ ค่าดัชนีจึงไม่เปลี่ยนเมื่อมีข้อมูลปีก่อนหน้าเพิ่ม ส่วน "ต้นช่วงที่เลือก" ปรับให้กราฟเริ่มที่ 100 ทุกครั้งที่เปลี่ยนช่วงเวลา','"Official base" = the announcement of 1 Jan 2025 as published, so the index does not change when earlier years are added. "Start of period" makes the chart begin at 100 every time the period changes.','“官方基期”= 已公布的2025年1月1日公告，因此新增更早年份数据时指数不会变化。“所选期间起点”则使图表在每次更改时间范围时从100开始。'],
['ราคาที่ใช้แสดง','Price used','采用的价格'],['ขนาดสินค้า','Product size','产品规格'],
['อัตโนมัติ = ใช้ขนาดใหญ่ แล้วกลาง แล้วเล็ก ตามที่มีในแต่ละรายการ หากเลือกขนาดเดียว รายการที่ไม่มีขนาดนั้นจะไม่ถูกนับ','Auto = use large, then medium, then small, whichever each item has. If you pick a single size, items without that size are left out.','自动 = 按大、中、小的顺序采用各品种已有的规格。若只选一种规格，没有该规格的品种将不计入。'],
['เปรียบเทียบการเปลี่ยนแปลงกับ','Compare changes with','变化对比基准'],['เปรียบเทียบกับ','Compare with','对比基准'],
['หน้าตา','Appearance','外观'],['ธีมสี','Color theme','配色'],['ขนาดตัวอักษร','Text size','字号'],
['คืนค่าเริ่มต้น','Reset to defaults','恢复默认'],
['ระบบจำการตั้งค่าไว้ในเบราว์เซอร์ของคุณ คนอื่นไม่ได้รับผลกระทบ','Your settings are remembered in this browser only and do not affect anyone else.','设置仅保存在您的浏览器中，不会影响其他人。'],
['บันทึกแล้ว','Saved','已保存'],['ปิด','Close','关闭'],
['คืนค่าเริ่มต้นแล้ว','Defaults restored','已恢复默认'],
/* footer */
['ข้อมูลราคาอ้างอิงจากประกาศราคากลางสินค้าสัตว์น้ำ','Price data is taken from the benchmark aquatic-product price announcements of the','价格数据取自'],
['อาศัยอำนาจตามมาตรา 26 แห่งพระราชบัญญัติจัดระเบียบกิจการแพปลา พ.ศ. 2496 ลงนามโดย นายปรีดา ยังสุขสถาพร ผู้อำนวยการองค์การสะพานปลา ดัชนีคำนวณจากค่าเฉลี่ยอัตราส่วนราคาของแต่ละรายการเทียบกับประกาศฐาน 1 มกราคม 2568 (ฐาน = 100) ข้อมูลปี 2565–2567 และ 2569 ถอดจากเอกสารประกาศฉบับสแกนที่หน่วยงานมี บางเดือนไม่มีเอกสาร (ปี 2564 ไม่มีข้อมูล) กราฟเชื่อมเฉพาะจุดที่มีประกาศจริง ไม่มีการประมาณหรือเติมค่าในช่วงที่ไม่มีเอกสาร ราคาหอยนางรมแกะเนื้อซึ่งประกาศเป็นช่วง (200–250) ใช้ค่ากลางในการคำนวณ','. Issued under Section 26 of the Fish Market Regulation Act, B.E. 2496 (1953) and signed by Mr. Preeda Yungsukhsataporn, Director of the Fish Marketing Organization. The index is the average of each item\'s price ratio against the base announcement of 1 January 2025 (base = 100). Data for 2022–2024 and 2026 were transcribed from the scanned announcements held by the organization; some months have no document (no data for 2021). Charts connect only real announcement points — nothing is estimated or filled in for periods without a document. Shucked oyster is announced as a range (200–250); the midpoint is used in calculations.','发布的水产品基准价格公告。依据佛历2496年鱼市场管理法第26条发布，由泰国鱼市场组织总裁 Preeda Yungsukhsataporn 先生签署。指数按各品种价格相对于2025年1月1日基期公告的比率求平均（基期 = 100）。2022–2024年及2026年的数据取自本机构持有的公告扫描件，部分月份无文件（2021年无数据）。图表仅连接真实公告的数据点，无文件的时段不做估算或补值。牡蛎肉（去壳）按区间（200–250）公布，计算时取中间值。'],
['แดชบอร์ดสาธิตเพื่อเผยแพร่ข้อมูลแก่ผู้บริโภค','Demonstration dashboard for sharing price information with consumers','面向消费者发布价格信息的演示看板'],
/* seed notes */
['วันที่ในประกาศเว้นว่าง ใช้ 1 พ.ค. 2566 ตามรอบประกาศ','The date on the announcement is blank; 1 May 2023 is used per the announcement cycle.','公告上日期为空白，按公告周期采用2023年5月1日。'],
['วันที่ในประกาศเว้นว่าง ใช้ 1 พ.ย. 2565 ตามรอบประกาศ','The date on the announcement is blank; 1 Nov 2022 is used per the announcement cycle.','公告上日期为空白，按公告周期采用2022年11月1日。'],
['วันที่ในประกาศเว้นว่าง ใช้ 15 พ.ย. 2565 ตามรอบประกาศ','The date on the announcement is blank; 15 Nov 2022 is used per the announcement cycle.','公告上日期为空白，按公告周期采用2022年11月15日。'],
['ประกาศฉบับนี้มี 56 ลำดับ (3 รายการเกินที่ภายหลังไม่มี ไม่นำมาแสดง) จับคู่ตามลำดับและจำนวนช่องราคา ควรตรวจเทียบต้นฉบับ','This announcement has 56 rows (3 extra rows that no longer appear later are not shown). Items were matched by row order and number of price cells — please verify against the original.','本公告共56行（其中3个后来不再出现的多余项目未显示）。品种按行序和价格栏数匹配，建议对照原件核实。'],
['ประกาศฉบับนี้มีรายการเกิน (ไม่นำมาแสดง) จับคู่ตามลำดับและจำนวนช่องราคา','This announcement has an extra row (not shown). Items were matched by row order and number of price cells.','本公告有多余项目（未显示）。品种按行序和价格栏数匹配。'],
['ประกาศลงวันที่ 20 ก.ค. 2565 (ชื่อไฟล์ระบุปีต่างกัน ใช้วันที่ตามเนื้อหา)','Dated 20 Jul 2022 (the file name shows a different year; the date in the document is used).','公告日期为2022年7月20日（文件名所示年份不同，以内容日期为准）。'],
];
MS.forEach((m, i) => D.push([m, EN_S[i], (i + 1) + '月']));
D.push(['ดาวน์โหลดข้อมูลราคา','Download price data','下载价格数据'],['ประกาศที่เลือก (.csv)','Selected announcement (.csv)','所选公告 (.csv)'],['ย้อนหลังทั้งหมด (.csv)','Full history (.csv)','全部历史 (.csv)'],['เปิดด้วย Excel ได้ · ราคาเป็นบาทต่อกิโลกรัม · ทุกรายการ ไม่ขึ้นกับตัวกรอง','Opens in Excel · prices in THB per kg · all items, regardless of filters','可用 Excel 打开 · 价格单位:泰铢/公斤 · 含全部品种,不受筛选影响']);
D.push(['ดัชนีราคากลาง','Price index','基准价格指数'],['ดัชนีราคากลางล่าสุด','Latest price index','最新基准价格指数']);
const DICT = new Map(D.map(r => [r[0], { en: r[1], zh: r[2] }]));

/* item names (th ↔ en ↔ zh) built from seed */
const NAME = new Map(), EN2TH = new Map();
function loadNames(items){
  Object.keys(items || {}).forEach(id => { const it = items[id]; if (!it || !it.th) return;
    NAME.set(it.th, { en: it.en || it.th, zh: it.zh || it.en || it.th });
    if (it.en) EN2TH.set(it.en, it.th);
  });
}

/* ---------- pattern rules (applied to ' · '-separated fragments) ---------- */
const SIZE_T = { 'เล็ก':1, 'กลาง':1, 'ใหญ่':1 };
const R = [];
function rule(re, en, zh){ R.push({ re, en, zh }); }
const N = '(\\d[\\d,]*)';
rule(/^(\d+) ประกาศ$/, '$1 announcements', '$1 期公告');
rule(/^ประกาศ (\d+) ฉบับ$/, '$1 announcements', '$1 期公告');
rule(/^(\d+) รายการ$/, '$1 items', '$1 项');
rule(/^(\d+) วันที่แล้ว$/, '$1 days ago', '$1天前');
rule(/^\((\d+) วันที่แล้ว\)$/, '($1 days ago)', '（$1天前）');
rule(/^(\d+) ปี$/, '$1 yr', '$1 年');
rule(/^(\d+) เดือน$/, '$1 mo', '$1 个月');
rule(/^(\d+) ปี (\d+) เดือน$/, '$1 yr $2 mo', '$1 年 $2 个月');
rule(/^ไม่ถึง 1 เดือน$/, 'under 1 month', '不足1个月');
rule(/^วันนี้ (.+)$/, 'Today {t1}', '今天 {t1}');
rule(/^ดัชนีราคากลางสินค้าสัตว์น้ำ \(ฐาน (.+) = 100\)$/, 'Aquatic Product Price Index (base {t1} = 100)', '水产品基准价格指数（基期 {t1} = 100）');
rule(/^เทียบประกาศ (.+)$/, 'vs {t1}', '对比 {t1} 公告');
rule(/^ฐาน (.+) = 100$/, 'Base {t1} = 100', '基期 {t1} = 100');
rule(/^ฐาน (.+) = 100 จุด$/, 'Base {t1} = 100 pts', '基期 {t1} = 100 点');
rule(/^ฐาน (.+) = 100 \· (.+)$/, 'Base {t1} = 100 · {t2}', '基期 {t1} = 100 · {t2}');
rule(/^ขนาด(เล็ก|กลาง|ใหญ่)$/, '{t1} size', '{t1}规格');
rule(/^ดัชนีราคากลางหมวด(.+)$/, '{t1} price index', '{t1}基准价格指数');
rule(/^(ปลา|ปู|หมึก|กุ้ง|หอย) (\d+) รายการ$/, '{t1}: $2 items', '{t1}：$2 项');
rule(/^ดัชนีหมวด(.+)ล่าสุด$/, 'Latest {t1} index', '最新{t1}指数');
rule(/^ดัชนีหมวด(.+)$/, '{t1} index', '{t1}指数');
rule(/^หมวด(ปลา|ปู|หมึก|กุ้ง|หอย)$/, '{t1} category', '{t1}类');
rule(/^เฉพาะหมวด(.+)$/, '{t1} only', '仅{t1}');
rule(/^แสดงเฉพาะหมวด(.+?) (\d+) รายการ$/, '{t1} only: $2 items', '仅显示{t1}：$2 项');
rule(/^ทุกชนิด (\d+) รายการ$/, 'All types: $1 items', '全部类别：$1 项');
rule(/^สูงสุด (.+)$/, 'High {t1}', '最高 {t1}');
rule(/^ต่ำสุด (.+)$/, 'Low {t1}', '最低 {t1}');
rule(/^แสดง (.+?) – (.+?)$/, 'Showing {t1} – {t2}', '显示 {t1} – {t2}');
rule(/^แสดง (\d+) จาก (\d+) รายการ$/, 'Showing $1 of $2 items', '显示 $1 / $2 项');
rule(/^ประกาศที่ (\d+) จาก (\d+)$/, 'Announcement $1 of $2', '第 $1 / $2 期公告');
rule(/^เทียบกับประกาศวันที่ (.+)$/, 'Compared with the announcement of {t1}', '对比 {t1} 的公告');
rule(/^นี่คือประกาศแรกในระบบ ไม่มีประกาศก่อนหน้าให้เทียบ$/, 'This is the first announcement on file; nothing earlier to compare.', '这是系统内第一期公告，无更早公告可对比。');
rule(/^ไม่มีประกาศช่วง 1 ปีก่อน \(±45 วัน\) ให้เทียบ$/, 'No announcement from about 1 year earlier (±45 days) to compare.', '没有约一年前（±45天）的公告可对比。');
rule(/^หมายเหตุ: (.+)$/, 'Note: {t1}', '备注：{t1}');
rule(/^บาท\/กก\. ประกาศ (.+?) เทียบ (.+)$/, 'THB/kg · announcement {t1} vs {t2}', '泰铢/公斤 · {t1} 公告对比 {t2}');
rule(/^บาท\/กก\. ประกาศ (.+?) \(ยังไม่มีประกาศให้เทียบ\)$/, 'THB/kg · announcement {t1} (nothing to compare yet)', '泰铢/公斤 · {t1} 公告（暂无可对比公告）');
rule(/^ประกาศ (.+?) เทียบ (.+)$/, 'Announcement {t1} vs {t2}', '{t1} 公告对比 {t2}');
rule(/^ล่าสุด (.+)$/, 'Latest {t1}', '最新 {t1}');
rule(/^ปี (.+)$/, '{t1}', '{t1}');
rule(/^ดูแนวโน้มราคา (.+)$/, 'View price trend: {t1}', '查看价格走势：{t1}');
rule(/^เอาออก (.+)$/, 'Remove {t1}', '移除 {t1}');
rule(/^(.+) เทียบรายปี$/, '{t1} — year over year', '{t1} — 逐年对比');
rule(/^จุด \(ฐาน (.+) = 100\)$/, 'points (base {t1} = 100)', '点（基期 {t1} = 100）');
rule(/^(\d+) ประกาศ เรียงจากล่าสุด$/, '$1 announcements, newest first', '共 $1 期公告，最新在前');
rule(/^คุณเลือกดูย้อนหลัง (.+?) แต่ตอนนี้ระบบมีข้อมูลย้อนหลังประมาณ (.+?) \((.+?) – (.+?)\) กราฟจึงแสดงเท่าที่มี ข้อมูลปีก่อนหน้านี้จะปรากฏเมื่อมีการนำเข้า$/, 'You chose {t1} of history, but the system currently holds about {t2} ({t3} – {t4}); the chart shows what is available.', '您选择查看{t1}的历史数据，但系统目前约有{t2}的数据（{t3} – {t4}），图表仅显示现有数据。');
rule(/^ขณะนี้ประกาศราคาล่าสุดในระบบคือวันที่ (.+?) \(ผ่านมาแล้วประมาณ (.+?)\) ราคาที่แสดงอาจไม่ตรงกับราคาตลาดในวันนี้ กรุณาใช้เป็นข้อมูลอ้างอิงเท่านั้น$/, 'The latest announcement on file is dated {t1} (about {t2} ago). Prices shown may differ from today\'s market prices — please use them as a reference only.', '系统内最新公告日期为 {t1}（约{t2}前）。所示价格可能与今日市场价格不一致，请仅作参考。');
rule(/^คุณกำลังดูข้อมูลที่เพิ่มไว้ในเครื่องนี้ (\d+) ประกาศ.*$/, 'You are viewing $1 announcements added on this device (not published to other visitors).', '您正在查看本设备上添加的 $1 期公告（尚未向其他访客发布）。');
rule(/^ไม่พบสินค้าที่ตรงกับ "(.+)" ลองพิมพ์ชื่อสั้นลง เช่น "กุ้ง" หรือ "ปลา"$/, 'No products match "$1". Try a shorter name, e.g. "shrimp" or "fish".', '没有与“$1”匹配的产品。请尝试更短的名称，如“虾”或“鱼”。');
rule(/^ราคาตามประกาศล่าสุด (.+?) \(บาท\/กก\.\) · แตะรายการเพื่อดูรายละเอียดและราคาย้อนหลัง$/, 'Prices from the latest announcement, {t1} (THB/kg). Tap an item for details and price history.', '最新公告（{t1}）价格（泰铢/公斤）。点击条目查看详情和历史价格。');
rule(/^เลือกครบ (\d+) รายการแล้ว$/, 'Maximum of $1 items selected', '已选满 $1 项');
rule(/^ข้อมูลในระบบ (.+)$/, 'Data on file {t1}', '系统内数据 {t1}');
rule(/^(.+) ล่าสุด$/, 'Latest {t1}', '最新{t1}');

/* inline unit / word replacers (non-anchored) */
const INLINE = [
  [/บาท\/กก\./g, 'THB/kg', '泰铢/公斤'],
  [/บาทต่อกิโลกรัม/g, 'Baht per kilogram', '泰铢/公斤'],
  [/(\d) บาท/g, '$1 THB', '$1 泰铢'],
  [/(\d) จุด/g, '$1 pts', '$1 点'],
];

function expand(tpl, m, L, deep){
  return tpl.replace(/\{t?(\d)\}|\$(\d)/g, (x, a, b) => {
    const i = a || b; const v = m[Number(i)] == null ? '' : m[Number(i)];
    return x.startsWith('{t') ? trRaw(v, L, deep + 1) : v;
  });
}
function nameOf(s, L){
  const n = NAME.get(s); if (n) return n[L];
  if (L === 'en' && EN2TH.has(s)) return EN2TH.get(s);
  return null;
}
function trRaw(s, L, deep){
  deep = deep || 0; if (deep > 4) return s;
  s = String(s); const core = s.trim(); if (!core) return s;
  if (/^25\d\d$/.test(core)) return s.replace(core, L === 'en' ? String(ceL(core)) : ceL(core) + '年');
  let hit = DICT.get(core); if (hit && hit[L] != null) return s.replace(core, hit[L]);
  const nm = nameOf(core, L); if (nm != null) return s.replace(core, nm);
  if (!THAI.test(core)) return s;
  /* whole-string rules after date conversion keeps dates intact for rules that capture them; so rules first on raw, dates after */
  for (const r of R){ const m = r.re.exec(core); if (m) return s.replace(core, expand(r[L], m, L, deep)); }
  /* split composite fragments */
  if (core.indexOf(' · ') > 0){
    return s.replace(core, core.split(' · ').map(f => trRaw(f, L, deep + 1)).join(' · '));
  }
  let out = dates(core, L);
  INLINE.forEach(x => { out = out.replace(x[0], x[L === 'en' ? 1 : 2]); });
  /* item names embedded inside a longer string (e.g. tooltips) */
  if (THAI.test(out)){
    NAME.forEach((v, th) => { if (out.indexOf(th) >= 0) out = out.split(th).join(v[L]); });
  }
  return s.replace(core, out);
}
function tr(s){ if (LANG === 'th' || s == null || s === '') return s; return trRaw(s, LANG, 0); }
function trL(s, L){ return L === 'th' ? s : trRaw(s, L, 0); }

/* ---------- DOM walker ---------- */
const orig = new WeakMap(), last = new WeakMap();
const aOrig = new WeakMap();
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'label', 'data-label'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEXTAREA', 'NOSCRIPT']);
let obs = null, busy = false;
function needs(str){ return THAI.test(str) || NAME.has(str) || EN2TH.has(str) || /^\s*25\d\d\s*$/.test(str) || DICT.has(String(str).trim()); }
function doText(n){
  const cur = n.nodeValue; let o = orig.get(n);
  if (o === undefined || (cur !== o && cur !== last.get(n))) { o = cur; orig.set(n, o); }
  const t = (LANG === 'th') ? o : (needs(o) ? tr(o) : o);
  if (t !== cur) n.nodeValue = t;
  last.set(n, t);
}
function doAttrs(el){
  let rec = aOrig.get(el);
  for (const a of ATTRS){
    if (!el.hasAttribute || !el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a);
    if (!rec) { rec = {}; aOrig.set(el, rec); }
    let r = rec[a];
    if (!r || (cur !== r.o && cur !== r.l)) { r = rec[a] = { o: cur, l: cur }; }
    const t = (LANG === 'th') ? r.o : (needs(r.o) ? tr(r.o) : r.o);
    if (t !== cur) el.setAttribute(a, t);
    r.l = t;
  }
}
function walk(root){
  if (!root) return;
  if (root.nodeType === 3){ doText(root); return; }
  if (root.nodeType !== 1) return;
  if (SKIP.has(root.tagName)){ if (root.tagName === 'CANVAS') doAttrs(root); return; }
  if (root.closest && root.closest('[data-no-i18n]')) return;
  doAttrs(root);
  for (let c = root.firstChild; c; c = c.nextSibling) walk(c);
}
function run(fn){ busy = true; if (obs) obs.disconnect(); try { fn(); } finally { if (obs) obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); busy = false; } }
function translateAll(){ run(() => { walk(document.body); }); }
function startObserver(){
  let pending = new Set(), scheduled = false;
  obs = new MutationObserver(muts => {
    if (busy) return;
    muts.forEach(m => { if (m.type === 'childList') m.addedNodes.forEach(n => pending.add(n)); else pending.add(m.target); });
    if (!scheduled){ scheduled = true; Promise.resolve().then(() => { scheduled = false; const p = pending; pending = new Set(); run(() => p.forEach(n => { if (document.body.contains(n)) walk(n); })); }); }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

/* ---------- title / meta ---------- */
const TITLE = { th: 'ดัชนีราคากลางสินค้าสัตว์น้ำ | องค์การสะพานปลา', en: 'Aquatic Product Price Index | Fish Marketing Organization', zh: '水产品基准价格指数 | 泰国鱼市场组织' };
const DESC = { th: 'ดัชนีและราคากลางสินค้าสัตว์น้ำ องค์การสะพานปลา เลือกช่วงเวลา ดูราคาย้อนหลัง และเปรียบเทียบราคาได้', en: 'Benchmark prices and price index for aquatic products from the Fish Marketing Organization of Thailand. Search prices, browse history and compare.', zh: '泰国鱼市场组织发布的水产品基准价格与价格指数。可查询价格、浏览历史走势并进行对比。' };
const HTML_LANG = { th: 'th', en: 'en', zh: 'zh-Hans' };

function apply(){
  document.documentElement.lang = HTML_LANG[LANG];
  document.documentElement.setAttribute('data-lang', LANG);
  document.title = TITLE[LANG];
  const md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', DESC[LANG]);
  document.querySelectorAll('[data-lang-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.langBtn === LANG)));
}
function setLang(l, silent){
  if (!LANGS.includes(l)) return;
  LANG = l; LS.set('fmo.lang', l); apply();
  if (!silent) listeners.forEach(f => { try { f(l); } catch(e){ console.error(e); } });
  translateAll();
}
function init(items){
  loadNames(items); LANG = detect(); apply(); startObserver();
}
window.FMO_I18N = { init, tr, trL, setLang, get lang(){ return LANG; }, onChange(f){ listeners.push(f); }, translateAll, loadNames,
  nameOf(th){ return LANG === 'th' ? th : (nameOf(th, LANG) || th); } };
})();
