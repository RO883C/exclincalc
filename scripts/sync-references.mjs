/**
 * sync-references.mjs
 * 自動同步臨床指引資料庫（pro_resources）到 Supabase
 *
 * 每月 1 日由 GitHub Action 自動執行：
 *   .github/workflows/sync-references.yml
 *
 * 手動執行：
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/sync-references.mjs
 *
 * 資料來源：本檔案中的 RESOURCES 陣列（與 supabase/seed_resources.sql 保持一致）
 * 新增指引時，請同時更新本檔案的 RESOURCES 陣列和 seed_resources.sql
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ═══════════════════════════════════════════════════════════════
// 臨床指引資料（與 supabase/seed_resources.sql 保持同步）
// 最後更新：2026-04-20（版本驗證後更新） — 共 22 筆
// ═══════════════════════════════════════════════════════════════
const RESOURCES = [
  // 糖尿病（含台灣學會）
  { title: "Standards of Care in Diabetes — 2026", author: "American Diabetes Association Professional Practice Committee", year: "2026", category: "指引", url: "https://diabetesjournals.org/care/issue/49/Supplement_1", description: "每年更新的糖尿病臨床照護標準（最新2026版），涵蓋GLP-1 RA支援第1型糖尿病（BMI>30）、tirzepatide、SGLT-2i、心血管與腎臟保護。", source: "American Diabetes Association (ADA), Diabetes Care 2026;49(Suppl.1)", tags: ["糖尿病","血糖","ADA","指引","第一型","第二型","GLP-1","SGLT-2","tirzepatide"] },
  { title: "台灣糖尿病臨床照護指引 2022", author: "台灣糖尿病學會 (Taiwan Diabetes Society)", year: "2022", category: "指引", url: "https://www.endo-dm.org.tw/dia/DMCARE/2022/index.htm", description: "結合台灣本地流行病學數據與國際指引，針對台灣患者特性制定的第2型糖尿病照護指引，包含健保藥物給付規定。", source: "台灣糖尿病學會 (TDS)", tags: ["糖尿病","台灣","健保","指引","中文","第二型"] },
  { title: "台灣糖尿病腎臟病臨床照護指引 2024", author: "台灣糖尿病學會・台灣腎臟醫學會", year: "2024", category: "指引", url: "https://www.endo-dm.org.tw", description: "台灣 DKD 最新聯合指引，包含 GFR/UACR 分期管理、SGLT-2 抑制劑腎保護建議（依台灣健保給付條件說明）、Finerenone 適應症。", source: "台灣糖尿病學會 (TDS) / 台灣腎臟醫學會 (TSN), 2024", tags: ["糖尿病","腎臟","DKD","台灣","SGLT-2","Finerenone","健保","中文"] },
  // 高血壓
  { title: "2022 台灣高血壓治療指引", author: "台灣高血壓學會・台灣心臟學會", year: "2022", category: "指引", url: "https://www.tsh.org.tw", description: "依據台灣本地數據更新的高血壓診治指引，包含診斷標準（≥130/80 mmHg）、居家血壓監測作為診斷標準、危險分層、藥物選擇優先順序。", source: "台灣高血壓學會 (TSH) / 台灣心臟學會 (TSOC)", tags: ["高血壓","血壓","台灣","指引","中文","心臟","居家血壓"] },
  { title: "2023 ESH Guidelines for the Management of Arterial Hypertension", author: "Mancia G, Kreutz R, Brunström M, et al.", year: "2023", category: "指引", url: "https://doi.org/10.1097/HJH.0000000000003480", description: "歐洲高血壓學會最新指引，更新了血壓分類、SCORE2風險評估、聯合用藥策略。", source: "European Society of Hypertension (ESH), J Hypertension 2023;41(12)", tags: ["高血壓","ESH","歐洲","指引","SCORE2"] },
  // 血脂 / 心血管
  { title: "台灣血脂異常臨床治療指引 2023", author: "台灣動脈硬化暨血管疾病學會", year: "2023", category: "指引", url: "https://www.ths.org.tw", description: "台灣血脂指引，LDL-C 治療目標（極高風險 <55 mg/dL）、他汀劑量換算、台灣健保給付規定。", source: "台灣動脈硬化暨血管疾病學會 (TAS)", tags: ["血脂","LDL","膽固醇","他汀","台灣","指引","心血管"] },
  { title: "台灣心臟學會 ASCVD 預防指引 2024", author: "台灣心臟學會 (Taiwan Society of Cardiology)", year: "2024", category: "指引", url: "https://www.tsoc.org.tw", description: "台灣 ASCVD 一級與二級預防最新指引，包含風險評估、降脂策略、抗血小板治療、血壓與血糖整合管理（含 HFpEF 特別章節）。", source: "台灣心臟學會 (TSOC), 2024", tags: ["心血管","ASCVD","預防","台灣","心臟","HFpEF","中文"] },
  { title: "2023 ACC/AHA Guideline for Diagnosis and Management of Heart Failure", author: "Heidenreich PA, Bozkurt B, Aguilar D, et al.", year: "2023", category: "指引", url: "https://doi.org/10.1016/j.jacc.2021.12.012", description: "心臟衰竭完整診治指引，涵蓋 HFrEF/HFmrEF/HFpEF 分類、四大基礎藥物、設備治療適應症。", source: "ACC/AHA, JACC 2022;79(17)", tags: ["心臟衰竭","HFrEF","HFpEF","SGLT2","ACC","AHA","指引"] },
  // 腎臟
  { title: "台灣腎臟醫學會 CKD 臨床照護共識 2025", author: "台灣腎臟醫學會 (Taiwan Society of Nephrology)", year: "2025", category: "指引", url: "https://www.tsn.org.tw", description: "台灣 CKD 基層照護共識（2025最新），涵蓋 cystatin C 納入 GFR 估算、SGLT-2 抑制劑與 Finerenone 腎保護（依台灣健保條件）、轉介標準。", source: "台灣腎臟醫學會 (TSN), 2025", tags: ["慢性腎病","CKD","腎功能","台灣","SGLT-2","Finerenone","健保","中文"] },
  { title: "KDIGO 2024 CKD Guideline", author: "Kidney Disease: Improving Global Outcomes (KDIGO)", year: "2024", category: "指引", url: "https://kdigo.org/guidelines/ckd-evaluation-management/", description: "慢性腎病評估與管理國際指引，包含 cystatin C 納入 GFR 分期、SGLT-2 抑制劑腎保護新建議、蛋白尿目標管理。", source: "KDIGO, Kidney International Supplements 2024", tags: ["慢性腎病","CKD","GFR","腎功能","KDIGO","SGLT-2","蛋白尿"] },
  // 預防醫學
  { title: "USPSTF Clinical Preventive Services Recommendations", author: "US Preventive Services Task Force", year: "2024", category: "網站", url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics", description: "美國預防醫學工作組建議整理，含各年齡層篩檢建議等級（A/B/C/D/I）。", source: "US Preventive Services Task Force (USPSTF)", tags: ["預防醫學","篩檢","癌症","USPSTF","公共衛生"] },
  { title: "台灣成人預防保健服務", author: "衛生福利部國民健康署", year: "2024", category: "網站", url: "https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=189", description: "台灣全民健保成人預防保健服務規範，包含 40 歲以上每三年一次體檢項目、65 歲以上每年一次。", source: "衛生福利部國民健康署 (HPA)", tags: ["預防醫學","健保","台灣","健檢","篩檢","中文"] },
  // 教科書
  { title: "Harrison's Principles of Internal Medicine, 22nd Edition", author: "Loscalzo J, Fauci A, Kasper D, et al.", year: "2025", category: "書籍", url: "https://accessmedicine.mhmedical.com/book.aspx?bookid=3095", cover_url: "https://covers.openlibrary.org/b/isbn/9781264268504-M.jpg", description: "內科學聖經，第 22 版（2025）全面更新，新增醫師健康章節、COVID-19、床邊超音波、抗凝血治療。", source: "McGraw-Hill / AccessMedicine, 22nd Edition 2025", tags: ["內科學","教科書","Harrison's","住院醫師","英文"] },
  { title: "Current Medical Diagnosis & Treatment (CMDT) 2026", author: "Tierney LM, Henderson MC (Eds.)", year: "2026", category: "書籍", url: "https://accessmedicine.mhmedical.com/book.aspx?bookid=3594", cover_url: "https://covers.openlibrary.org/b/isbn/9781265423278-M.jpg", description: "每年更新的臨床工具書，以條列格式快速查閱診斷標準與治療建議。", source: "McGraw-Hill / Lange, CMDT 2026 (65th Ed.)", tags: ["家醫科","診斷","治療","CMDT","教科書","英文"] },
  { title: "Pocket Medicine: The Massachusetts General Hospital Handbook, 8th Edition", author: "Sabatine MS (Ed.)", year: "2022", category: "書籍", url: "https://www.wolterskluwer.com/en/solutions/ovid/pocket-medicine-6-209", cover_url: "https://covers.openlibrary.org/b/isbn/9781975179960-M.jpg", description: "麻省總醫院口袋手冊，住院醫師值班必備，極度精煉的臨床指引格式，適合快速決策。", source: "Wolters Kluwer / Lippincott, ISBN: 978-1-975179-96-0", tags: ["內科學","口袋書","MGH","住院醫師","速查","英文"] },
  { title: "台灣家庭醫學科住院醫師訓練核心教材（第四版）", author: "台灣家庭醫學醫學會", year: "2022", category: "書籍", url: "https://www.tafm.org.tw", description: "台灣家醫科住院醫師訓練官方教材，涵蓋以病人為中心的醫療、全家照護、社區醫學、老人醫學。", source: "台灣家庭醫學醫學會 (TAFM)", tags: ["家庭醫學","台灣","住院醫師","訓練","中文","以病人為中心"] },
  { title: "全民健康保險藥品給付規定", author: "衛生福利部中央健康保險署", year: "2024", category: "網站", url: "https://www.nhi.gov.tw/Content_List.aspx?n=238533FCBA5B1A95", description: "台灣健保藥品給付條件查詢，包含各藥物申請條件、需附文件、給付限制。", source: "衛生福利部中央健康保險署 (NHIA)", tags: ["健保","藥品","給付","台灣","法規","中文"] },
  // 感染症
  { title: "Sanford Guide to Antimicrobial Therapy 2026", author: "Gilbert DN, Chambers HF, Saag MS, et al.", year: "2026", category: "書籍", url: "https://www.sanfordguide.com", description: "抗微生物治療速查指南（2026最新版），涵蓋各種感染症首選與替代抗生素、劑量（含腎功能調整劑量）、抗藥性監測。", source: "Antimicrobial Therapy, Inc. / Sanford Guide 2026", tags: ["抗生素","感染症","antimicrobial","抗藥性","速查","英文"] },
  // 呼吸
  { title: "GINA 2025: Global Strategy for Asthma Management and Prevention", author: "Global Initiative for Asthma", year: "2025", category: "指引", url: "https://ginasthma.org/2025-gina-strategy-report/", description: "全球哮喘倡議年度報告（2025），包含擴展的第2型生物標記指引、氣候變遷對氣喘的影響、修訂的治療算法。", source: "Global Initiative for Asthma (GINA) 2025", tags: ["氣喘","哮喘","GINA","ICS","吸入劑","呼吸","指引"] },
  { title: "GOLD 2026: Global Strategy for Prevention, Diagnosis and Management of COPD", author: "Global Initiative for Chronic Obstructive Lung Disease", year: "2026", category: "指引", url: "https://goldcopd.org/2026-gold-report-and-pocket-guide/", description: "COPD 全球策略年度報告（2026），包含修訂肺功能測量協議、新型 PDE3/4 抑制劑建議、RSV 疫苗接種建議、ABE 分組策略。", source: "Global Initiative for Chronic Obstructive Lung Disease (GOLD) 2026", tags: ["COPD","慢性阻塞","肺病","GOLD","LAMA","LABA","吸入劑","指引"] },
  // 骨骼肌肉
  { title: "2020 ACR Guideline for the Management of Gout", author: "FitzGerald JD, Dalbeth N, Mikuls T, et al.", year: "2020", category: "指引", url: "https://doi.org/10.1002/acr.24180", description: "美國風濕病學會痛風指引（目前仍為最新版），更新了急性發作處置、降尿酸治療起始時機、治療目標（血清尿酸 < 6 mg/dL）。", source: "American College of Rheumatology (ACR), Arthritis & Rheumatology 2020;72(6)", tags: ["痛風","尿酸","ACR","風濕","Allopurinol","Febuxostat","指引"] },
  // WHO
  { title: "WHO Model List of Essential Medicines, 24th Edition", author: "World Health Organization", year: "2025", category: "指引", url: "https://www.who.int/publications/i/item/B09474", description: "WHO 基本藥物清單第 24 版（2025年9月），列出全球基礎醫療必需藥物，是了解國際藥物政策的基準。", source: "World Health Organization (WHO), 24th Edition 2025", tags: ["WHO","基本藥物","藥品政策","公共衛生","英文"] },
];

// ═══════════════════════════════════════════════════════
// 執行同步
// ═══════════════════════════════════════════════════════

console.log(`Syncing ${RESOURCES.length} clinical references to Supabase...`);

const { error: delErr } = await supabase
  .from("pro_resources")
  .delete()
  .is("created_by", null);

if (delErr) {
  console.error("Delete failed:", delErr.message);
  process.exit(1);
}

const rows = RESOURCES.map(r => ({
  ...r,
  cover_url: r.cover_url ?? null,
  is_public: true,
  created_by: null,
}));

const { error: insertErr } = await supabase
  .from("pro_resources")
  .insert(rows);

if (insertErr) {
  console.error("Insert failed:", insertErr.message);
  process.exit(1);
}

console.log(`Synced ${rows.length} references successfully`);

const { count } = await supabase
  .from("pro_resources")
  .select("*", { count: "exact", head: true })
  .is("created_by", null);

console.log(`Total system references in DB: ${count}`);
