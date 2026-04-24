-- ═══════════════════════════════════════════════════════════
-- ClinCalc Pro — 臨床參考資料庫種子資料
-- 最後更新：2026-04-20（版本驗證後更新）
-- 總計：22 筆（台灣指引 9 筆 + 國際指引 8 筆 + 教科書 5 筆）
--
-- ⚠️ 安全可重複執行：先刪除系統預載再重新插入
--    （created_by IS NULL = 系統預載，不影響用戶自建資料）
-- ═══════════════════════════════════════════════════════════

DELETE FROM pro_resources WHERE created_by IS NULL;

INSERT INTO pro_resources (title, author, year, category, url, cover_url, description, source, tags, is_public, created_by)
VALUES

-- ══════════════════════════════
-- 糖尿病指引
-- ══════════════════════════════

(
  'Standards of Care in Diabetes — 2026',
  'American Diabetes Association Professional Practice Committee',
  '2026', '指引',
  'https://diabetesjournals.org/care/issue/49/Supplement_1',
  NULL,
  '每年更新的糖尿病臨床照護標準（最新2026版），涵蓋篩檢、診斷、GLP-1 RA支援第1型糖尿病（BMI>30）、tirzepatide、SGLT-2i、心血管與腎臟保護、低血糖處理。台灣糖尿病管理最重要的國際參考文獻。',
  'American Diabetes Association (ADA), Diabetes Care 2026;49(Suppl.1)',
  ARRAY['糖尿病','血糖','ADA','指引','第一型','第二型','GLP-1','SGLT-2','tirzepatide'],
  true, NULL
),

(
  '台灣糖尿病臨床照護指引 2022',
  '台灣糖尿病學會 (Taiwan Diabetes Society)',
  '2022', '指引',
  'https://www.endo-dm.org.tw/dia/DMCARE/2022/index.htm',
  NULL,
  '結合台灣本地流行病學數據與國際指引，針對台灣患者特性制定的第2型糖尿病照護指引，包含健保藥物給付規定、台灣特有的族群風險、門診照護流程。',
  '台灣糖尿病學會 (TDS)',
  ARRAY['糖尿病','台灣','健保','指引','中文','第二型'],
  true, NULL
),

(
  '台灣糖尿病腎臟病臨床照護指引 2024',
  '台灣糖尿病學會・台灣腎臟醫學會',
  '2024', '指引',
  'https://www.endo-dm.org.tw',
  NULL,
  '台灣糖尿病腎臟病（DKD）最新聯合指引，由台灣糖尿病學會與台灣腎臟醫學會合作制定。包含 GFR/UACR 分期管理、SGLT-2 抑制劑腎保護建議（依台灣健保給付條件說明）、Finerenone 適應症。',
  '台灣糖尿病學會 (TDS) / 台灣腎臟醫學會 (TSN), 2024',
  ARRAY['糖尿病','腎臟','DKD','台灣','SGLT-2','Finerenone','健保','中文'],
  true, NULL
),

-- ══════════════════════════════
-- 高血壓指引
-- ══════════════════════════════

(
  '2022 台灣高血壓治療指引',
  '台灣高血壓學會・台灣心臟學會',
  '2022', '指引',
  'https://www.tsh.org.tw',
  NULL,
  '依據台灣本地數據更新的高血壓診治指引，包含診斷標準（≥130/80 mmHg）、居家血壓監測作為診斷標準、危險分層、生活型態介入、藥物選擇優先順序（ACEi/ARB、CCB、利尿劑）及特殊族群建議。',
  '台灣高血壓學會 (TSH) / 台灣心臟學會 (TSOC)',
  ARRAY['高血壓','血壓','台灣','指引','中文','心臟','居家血壓'],
  true, NULL
),

(
  '2023 ESH Guidelines for the Management of Arterial Hypertension',
  'Mancia G, Kreutz R, Brunström M, et al.',
  '2023', '指引',
  'https://doi.org/10.1097/HJH.0000000000003480',
  NULL,
  '歐洲高血壓學會最新指引，更新了血壓分類、心血管風險評估工具（SCORE2）、血壓測量標準化、聯合用藥策略（SPC 單片複合藥），以及難治性高血壓定義與處置。',
  'European Society of Hypertension (ESH), J Hypertension 2023;41(12)',
  ARRAY['高血壓','ESH','歐洲','指引','SCORE2'],
  true, NULL
),

-- ══════════════════════════════
-- 血脂異常 / 心血管
-- ══════════════════════════════

(
  '台灣血脂異常臨床治療指引 2023',
  '台灣動脈硬化暨血管疾病學會',
  '2023', '指引',
  'https://www.ths.org.tw',
  NULL,
  '台灣血脂指引，包含 LDL-C 治療目標（極高風險 <55 mg/dL、高風險 <70 mg/dL）、他汀類藥物劑量換算、Ezetimibe 合併用藥、台灣健保給付規定。',
  '台灣動脈硬化暨血管疾病學會 (TAS)',
  ARRAY['血脂','LDL','膽固醇','他汀','台灣','指引','心血管'],
  true, NULL
),

(
  '台灣心臟學會 ASCVD 預防指引 2024',
  '台灣心臟學會 (Taiwan Society of Cardiology)',
  '2024', '指引',
  'https://www.tsoc.org.tw',
  NULL,
  '台灣動脈粥樣硬化性心血管疾病（ASCVD）一級與二級預防最新指引，包含風險評估工具、生活型態介入、降脂策略、抗血小板治療、血壓與血糖管理整合建議（含 HFpEF 特別章節）。',
  '台灣心臟學會 (TSOC), 2024',
  ARRAY['心血管','ASCVD','預防','台灣','心臟','HFpEF','中文'],
  true, NULL
),

(
  '2023 ACC/AHA Guideline for Diagnosis and Management of Heart Failure',
  'Heidenreich PA, Bozkurt B, Aguilar D, et al.',
  '2023', '指引',
  'https://doi.org/10.1016/j.jacc.2021.12.012',
  NULL,
  '心臟衰竭完整診治指引，涵蓋 HFrEF/HFmrEF/HFpEF 分類、四大基礎藥物（ACEI/ARNI、β-blocker、MRA、SGLT2i）、設備治療適應症（ICD、CRT）、急性心衰治療流程。',
  'ACC/AHA, Journal of the American College of Cardiology 2022;79(17)',
  ARRAY['心臟衰竭','HFrEF','HFpEF','SGLT2','ACC','AHA','指引'],
  true, NULL
),

-- ══════════════════════════════
-- 慢性腎病
-- ══════════════════════════════

(
  '台灣腎臟醫學會 CKD 臨床照護共識 2025',
  '台灣腎臟醫學會 (Taiwan Society of Nephrology)',
  '2025', '指引',
  'https://www.tsn.org.tw',
  NULL,
  '台灣慢性腎病基層照護共識（2025年最新），涵蓋 cystatin C 納入 GFR 估算、SGLT-2 抑制劑與 Finerenone 腎保護建議（依台灣健保條件）、轉介標準與追蹤建議。',
  '台灣腎臟醫學會 (TSN), 2025',
  ARRAY['慢性腎病','CKD','腎功能','台灣','SGLT-2','Finerenone','健保','中文'],
  true, NULL
),

(
  'KDIGO 2024 CKD Guideline',
  'Kidney Disease: Improving Global Outcomes (KDIGO)',
  '2024', '指引',
  'https://kdigo.org/guidelines/ckd-evaluation-management/',
  NULL,
  '慢性腎病評估與管理國際指引，包含 cystatin C 納入 GFR 分期（G1-G5/A1-A3）、SGLT-2 抑制劑腎保護新建議、蛋白尿目標、腎性貧血及礦物代謝管理。',
  'KDIGO, Kidney International Supplements 2024',
  ARRAY['慢性腎病','CKD','GFR','腎功能','KDIGO','SGLT-2','蛋白尿'],
  true, NULL
),

-- ══════════════════════════════
-- 預防醫學
-- ══════════════════════════════

(
  'USPSTF Clinical Preventive Services Recommendations',
  'US Preventive Services Task Force',
  '2024', '網站',
  'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics',
  NULL,
  '美國預防醫學工作組建議整理，含各年齡層與危險因子的篩檢建議等級（A/B/C/D/I），涵蓋大腸直腸癌、子宮頸癌、乳癌、骨質疏鬆、糖尿病、高血壓篩檢。',
  'US Preventive Services Task Force (USPSTF)',
  ARRAY['預防醫學','篩檢','癌症','USPSTF','公共衛生'],
  true, NULL
),

(
  '台灣成人預防保健服務',
  '衛生福利部國民健康署',
  '2024', '網站',
  'https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=189',
  NULL,
  '台灣全民健保成人預防保健服務規範，包含 40 歲以上每三年一次體檢項目（血糖、血脂、腎功能、BMI、血壓）、65 歲以上每年一次、慢性病高危族群加強篩檢規定。',
  '衛生福利部國民健康署 (HPA)',
  ARRAY['預防醫學','健保','台灣','健檢','篩檢','中文'],
  true, NULL
),

-- ══════════════════════════════
-- 教科書
-- ══════════════════════════════

(
  'Harrison''s Principles of Internal Medicine, 22nd Edition',
  'Loscalzo J, Fauci A, Kasper D, et al.',
  '2025', '書籍',
  'https://accessmedicine.mhmedical.com/book.aspx?bookid=3095',
  'https://covers.openlibrary.org/b/isbn/9781264268504-M.jpg',
  '內科學聖經，第 22 版（2025）全面更新，新增醫師健康章節、COVID-19、床邊超音波、抗凝血治療，涵蓋免疫學、腫瘤、感染、代謝、心血管、神經等所有內科領域。',
  'McGraw-Hill / AccessMedicine, 22nd Edition 2025',
  ARRAY['內科學','教科書','Harrison''s','住院醫師','英文'],
  true, NULL
),

(
  'Current Medical Diagnosis & Treatment (CMDT) 2026',
  'Tierney LM, Henderson MC (Eds.)',
  '2026', '書籍',
  'https://accessmedicine.mhmedical.com/book.aspx?bookid=3594',
  'https://covers.openlibrary.org/b/isbn/9781265423278-M.jpg',
  '每年更新的臨床工具書，以條列格式快速查閱診斷標準與治療建議，家醫科門診最實用的床邊參考書之一。各疾病包含定義、症狀、檢查、治療藥物劑量。',
  'McGraw-Hill / Lange, CMDT 2026 (65th Ed.)',
  ARRAY['家醫科','診斷','治療','CMDT','教科書','英文'],
  true, NULL
),

(
  'Pocket Medicine: The Massachusetts General Hospital Handbook, 8th Edition',
  'Sabatine MS (Ed.)',
  '2022', '書籍',
  'https://www.wolterskluwer.com/en/solutions/ovid/pocket-medicine-6-209',
  'https://covers.openlibrary.org/b/isbn/9781975179960-M.jpg',
  '麻省總醫院口袋手冊，住院醫師值班必備，極度精煉的臨床指引格式，涵蓋內科所有次專科的診斷流程、劑量速查、常用計算公式。',
  'Wolters Kluwer / Lippincott, ISBN: 978-1-975179-96-0',
  ARRAY['內科學','口袋書','MGH','住院醫師','速查','英文'],
  true, NULL
),

(
  '台灣家庭醫學科住院醫師訓練核心教材（第四版）',
  '台灣家庭醫學醫學會',
  '2022', '書籍',
  'https://www.tafm.org.tw',
  NULL,
  '台灣家醫科住院醫師訓練官方教材，涵蓋以病人為中心的醫療、全家照護、社區醫學、老人醫學、慢性病管理、預防保健、台灣本土流行病數據及健保制度解說。',
  '台灣家庭醫學醫學會 (TAFM)',
  ARRAY['家庭醫學','台灣','住院醫師','訓練','中文','以病人為中心'],
  true, NULL
),

(
  '全民健康保險藥品給付規定',
  '衛生福利部中央健康保險署',
  '2024', '網站',
  'https://www.nhi.gov.tw/Content_List.aspx?n=238533FCBA5B1A95',
  NULL,
  '台灣健保藥品給付條件查詢，包含各藥物申請條件、需附文件、給付限制（特定條件/事前審查）。開立慢性病藥物前確認給付資格的必查來源。',
  '衛生福利部中央健康保險署 (NHIA)',
  ARRAY['健保','藥品','給付','台灣','法規','中文'],
  true, NULL
),

-- ══════════════════════════════
-- 感染症 / 抗生素
-- ══════════════════════════════

(
  'Sanford Guide to Antimicrobial Therapy 2026',
  'Gilbert DN, Chambers HF, Saag MS, et al.',
  '2026', '書籍',
  'https://www.sanfordguide.com',
  NULL,
  '抗微生物治療速查指南（2026最新版），涵蓋各種感染症首選與替代抗生素、劑量（含腎功能調整劑量）、療程，並標示抗藥性監測資訊。台灣也廣泛使用。',
  'Antimicrobial Therapy, Inc. / Sanford Guide 2026',
  ARRAY['抗生素','感染症','antimicrobial','抗藥性','速查','英文'],
  true, NULL
),

-- ══════════════════════════════
-- 呼吸系統
-- ══════════════════════════════

(
  'GINA 2025: Global Strategy for Asthma Management and Prevention',
  'Global Initiative for Asthma',
  '2025', '指引',
  'https://ginasthma.org/2025-gina-strategy-report/',
  NULL,
  '全球哮喘倡議年度更新報告（2025），包含擴展的第2型生物標記指引、氣候變遷對氣喘的影響、修訂的治療算法（ICS 為基礎）、急性惡化處理。',
  'Global Initiative for Asthma (GINA) 2025',
  ARRAY['氣喘','哮喘','GINA','ICS','吸入劑','呼吸','指引'],
  true, NULL
),

(
  'GOLD 2026: Global Strategy for Prevention, Diagnosis and Management of COPD',
  'Global Initiative for Chronic Obstructive Lung Disease',
  '2026', '指引',
  'https://goldcopd.org/2026-gold-report-and-pocket-guide/',
  NULL,
  'COPD 全球策略年度報告（2026），包含修訂的肺功能測量協議、新型 PDE3/4 抑制劑建議、RSV 疫苗接種建議、ABE 分組策略、吸入藥物選擇（LAMA/LABA/ICS）。',
  'Global Initiative for Chronic Obstructive Lung Disease (GOLD) 2026',
  ARRAY['COPD','慢性阻塞','肺病','GOLD','LAMA','LABA','吸入劑','指引'],
  true, NULL
),

-- ══════════════════════════════
-- 骨骼肌肉 / 風濕
-- ══════════════════════════════

(
  '2020 ACR Guideline for the Management of Gout',
  'FitzGerald JD, Dalbeth N, Mikuls T, et al.',
  '2020', '指引',
  'https://doi.org/10.1002/acr.24180',
  NULL,
  '美國風濕病學會痛風指引（目前仍為最新版），更新了急性發作處置（秋水仙素/NSAIDs/類固醇）、降尿酸治療起始時機、治療目標（血清尿酸 < 6 mg/dL）。',
  'American College of Rheumatology (ACR), Arthritis & Rheumatology 2020;72(6)',
  ARRAY['痛風','尿酸','ACR','風濕','Allopurinol','Febuxostat','指引'],
  true, NULL
),

-- ══════════════════════════════
-- WHO
-- ══════════════════════════════

(
  'WHO Model List of Essential Medicines, 24th Edition',
  'World Health Organization',
  '2025', '指引',
  'https://www.who.int/publications/i/item/B09474',
  NULL,
  'WHO 基本藥物清單第 24 版（2025年9月發布），列出全球基礎醫療必需藥物，包含核心清單與補充清單，依照疾病分類整理。',
  'World Health Organization (WHO), 24th Edition 2025',
  ARRAY['WHO','基本藥物','藥品政策','公共衛生','英文'],
  true, NULL
);

-- 確認筆數
SELECT COUNT(*) AS total_seeded FROM pro_resources WHERE is_public = true AND created_by IS NULL;
