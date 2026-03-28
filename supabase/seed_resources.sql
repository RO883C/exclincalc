-- ═══════════════════════════════════════════════════════════
-- ClinCalc Pro — 臨床參考資料庫種子資料
-- 在 Supabase SQL Editor 執行（繞過 RLS，以 service role 寫入）
-- 所有資料 is_public = true，created_by = null（系統預載）
--
-- ⚠️ 安全可重複執行：先刪除所有系統預載資料再重新插入
--    （created_by IS NULL = 系統預載，非用戶自行新增的資料不受影響）
-- ═══════════════════════════════════════════════════════════

-- 清除舊有系統預載資料（避免重複執行時堆疊）
DELETE FROM pro_resources WHERE created_by IS NULL;

INSERT INTO pro_resources (title, author, year, category, url, cover_url, description, source, tags, is_public, created_by)
VALUES

-- ══════════════════════════════
-- 糖尿病指引
-- ══════════════════════════════

(
  'Standards of Care in Diabetes — 2026',
  'American Diabetes Association Professional Practice Committee',
  '2026',
  '指引',
  'https://diabetesjournals.org/care/issue/49/Supplement_1',
  NULL,
  '每年更新的糖尿病臨床照護標準，涵蓋篩檢、診斷、個體化治療目標、血糖監測、藥物治療（含 GLP-1 RA、SGLT-2i、tirzepatide）、心血管與腎臟保護、低血糖處理等完整指引。台灣糖尿病管理最重要的國際參考文獻。',
  'American Diabetes Association (ADA), Diabetes Care 2026;49(Suppl.1)',
  ARRAY['糖尿病','血糖','ADA','指引','第一型','第二型','GLP-1','SGLT-2','tirzepatide'],
  true,
  NULL
),

(
  '台灣糖尿病臨床照護指引 2022',
  '台灣糖尿病學會 (Taiwan Diabetes Society)',
  '2022',
  '指引',
  'https://www.endo-dm.org.tw/dia/DMCARE/2022/index.htm',
  NULL,
  '結合台灣本地流行病學數據與國際指引，針對台灣患者特性制定的糖尿病照護指引，包含健保藥物給付規定、台灣特有的族群風險、門診照護流程。',
  '台灣糖尿病學會 (TDS)',
  ARRAY['糖尿病','台灣','健保','指引','中文'],
  true,
  NULL
),

-- ══════════════════════════════
-- 高血壓指引
-- ══════════════════════════════

(
  '2022 台灣高血壓治療指引',
  '台灣高血壓學會・台灣心臟學會',
  '2022',
  '指引',
  'https://www.tsh.org.tw',
  NULL,
  '依據台灣本地數據更新的高血壓診治指引，包含診斷標準（≥130/80 mmHg）、危險分層、生活型態介入、藥物選擇優先順序（ACEi/ARB、CCB、利尿劑、β-blocker）及特殊族群（糖尿病、慢性腎病、孕婦）建議。',
  '台灣高血壓學會 (TSH) / 台灣心臟學會 (TSOC)',
  ARRAY['高血壓','血壓','台灣','指引','中文','心臟'],
  true,
  NULL
),

(
  '2023 ESH Guidelines for the Management of Arterial Hypertension',
  'Mancia G, Kreutz R, Brunström M, et al.',
  '2023',
  '指引',
  'https://doi.org/10.1097/HJH.0000000000003480',
  NULL,
  '歐洲高血壓學會最新指引，更新了血壓分類、心血管風險評估工具（SCORE2）、血壓測量標準化、聯合用藥策略（SPC 單片複合藥），以及難治性高血壓定義與處置。',
  'European Society of Hypertension (ESH), J Hypertension 2023;41(12)',
  ARRAY['高血壓','ESH','歐洲','指引','SCORE2'],
  true,
  NULL
),

(
  '2017 ACC/AHA High Blood Pressure Guideline',
  'Whelton PK, Carey RM, Aronow WS, et al.',
  '2017',
  '指引',
  'https://doi.org/10.1161/HYP.0000000000000065',
  NULL,
  '美國心臟病學院/美國心臟學會高血壓指引，將高血壓定義調整為 ≥130/80 mmHg，引入血壓分期新標準，強調生活型態介入的重要性，並對不同心血管風險族群提供差異化藥物治療建議。',
  'ACC/AHA, Hypertension 2018;71(6)',
  ARRAY['高血壓','ACC','AHA','美國','指引'],
  true,
  NULL
),

-- ══════════════════════════════
-- 血脂異常指引
-- ══════════════════════════════

(
  '台灣血脂異常臨床治療指引 2023',
  '台灣動脈硬化暨血管疾病學會',
  '2023',
  '指引',
  'https://www.ths.org.tw',
  NULL,
  '台灣血脂指引，包含 LDL-C 治療目標（極高風險 <55 mg/dL、高風險 <70 mg/dL）、他汀類藥物劑量換算、非他汀類治療（Ezetimibe、PCSK9 抑制劑）及台灣健保給付規定。',
  '台灣動脈硬化暨血管疾病學會 (TAS)',
  ARRAY['血脂','LDL','膽固醇','他汀','台灣','指引','心血管'],
  true,
  NULL
),

(
  '2019 ESC/EAS Guidelines for the Management of Dyslipidaemias',
  'Mach F, Baigent C, Catapano AL, et al.',
  '2019',
  '指引',
  'https://doi.org/10.1093/eurheartj/ehz455',
  NULL,
  '更新血脂管理國際指引，引入極高風險族群 LDL-C 目標 <55 mg/dL 與降幅 ≥50%，確立 PCSK9 抑制劑在心血管二級預防的地位，提供完整他汀治療強度分類表。',
  'ESC/EAS, European Heart Journal 2020;41(1):111-188',
  ARRAY['血脂','LDL','ESC','EAS','PCSK9','指引','心血管'],
  true,
  NULL
),

-- ══════════════════════════════
-- 心臟病 / 心血管
-- ══════════════════════════════

(
  '2023 ACC/AHA Guideline for Diagnosis and Management of Heart Failure',
  'Heidenreich PA, Bozkurt B, Aguilar D, et al.',
  '2023',
  '指引',
  'https://doi.org/10.1016/j.jacc.2021.12.012',
  NULL,
  '心臟衰竭完整診治指引，涵蓋 HFrEF（射出分數降低）/HFmrEF/HFpEF 分類、四大基礎藥物（ACEI/ARNI、β-blocker、MRA、SGLT2i）、設備治療適應症（ICD、CRT）、急性心衰治療流程。',
  'ACC/AHA, Journal of the American College of Cardiology 2022;79(17)',
  ARRAY['心臟衰竭','HFrEF','HFpEF','SGLT2','ACC','AHA','指引'],
  true,
  NULL
),

-- ══════════════════════════════
-- 慢性腎病
-- ══════════════════════════════

(
  'KDIGO 2024 CKD Guideline',
  'Kidney Disease: Improving Global Outcomes (KDIGO)',
  '2024',
  '指引',
  'https://kdigo.org/guidelines/ckd-evaluation-management/',
  NULL,
  '慢性腎病評估與管理國際指引，包含 GFR 與白蛋白尿分期（G1-G5/A1-A3）、心血管風險評估、SGLT-2 抑制劑腎保護新建議、蛋白尿目標、腎性貧血及礦物代謝管理。',
  'KDIGO, Kidney International Supplements 2024',
  ARRAY['慢性腎病','CKD','GFR','腎功能','KDIGO','SGLT-2','蛋白尿'],
  true,
  NULL
),

-- ══════════════════════════════
-- 預防醫學
-- ══════════════════════════════

(
  'USPSTF Clinical Preventive Services Recommendations',
  'US Preventive Services Task Force',
  '2024',
  '網站',
  'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics',
  NULL,
  '美國預防醫學工作組建議整理，含各年齡層與危險因子的篩檢建議等級（A/B/C/D/I），涵蓋大腸直腸癌、子宮頸癌、乳癌、骨質疏鬆、糖尿病、高血壓篩檢，以及成人預防性用藥建議。',
  'US Preventive Services Task Force (USPSTF)',
  ARRAY['預防醫學','篩檢','癌症','USPSTF','公共衛生'],
  true,
  NULL
),

(
  '台灣成人預防保健服務',
  '衛生福利部國民健康署',
  '2024',
  '網站',
  'https://www.hpa.gov.tw/Pages/Detail.aspx?nodeid=189',
  NULL,
  '台灣全民健保成人預防保健服務規範，包含 40 歲以上每三年一次體檢項目（血糖、血脂、腎功能、BMI、血壓、視力、聽力）、65 歲以上每年一次、慢性病高危族群加強篩檢規定。',
  '衛生福利部國民健康署 (HPA)',
  ARRAY['預防醫學','健保','台灣','健檢','篩檢','中文'],
  true,
  NULL
),

-- ══════════════════════════════
-- 教科書
-- ══════════════════════════════

(
  'Harrison''s Principles of Internal Medicine, 21st Edition',
  'Loscalzo J, Fauci A, Kasper D, et al.',
  '2022',
  '書籍',
  'https://accessmedicine.mhmedical.com/book.aspx?bookid=3095',
  'https://covers.openlibrary.org/b/isbn/9781264268504-M.jpg',
  '內科學聖經，第 21 版全面更新，涵蓋免疫學、腫瘤、感染、代謝、心血管、神經等所有內科領域。每章均有最新診斷標準、臨床路徑與治療流程，是住院醫師與主治醫師必備參考書。',
  'McGraw-Hill / AccessMedicine, ISBN: 978-1-264-26850-4',
  ARRAY['內科學','教科書','Harrison''s','住院醫師','英文'],
  true,
  NULL
),

(
  'Current Medical Diagnosis & Treatment (CMDT) 2025',
  'Tierney LM, Henderson MC (Eds.)',
  '2025',
  '書籍',
  'https://accessmedicine.mhmedical.com/book.aspx?bookid=3612',
  'https://covers.openlibrary.org/b/isbn/9781265423278-M.jpg',
  '每年更新的臨床工具書，以條列格式快速查閱診斷標準與治療建議，家醫科門診最實用的床邊參考書之一。各疾病包含定義、症狀、檢查、治療藥物劑量，格式簡潔易查。',
  'McGraw-Hill / Lange, ISBN: 978-1-265-42327-8',
  ARRAY['家醫科','診斷','治療','CMDT','教科書','英文'],
  true,
  NULL
),

(
  'Pocket Medicine: The Massachusetts General Hospital Handbook, 8th Edition',
  'Sabatine MS (Ed.)',
  '2022',
  '書籍',
  'https://www.wolterskluwer.com/en/solutions/ovid/pocket-medicine-6-209',
  'https://covers.openlibrary.org/b/isbn/9781975179960-M.jpg',
  '麻省總醫院口袋手冊，住院醫師值班必備，極度精煉的臨床指引格式，涵蓋內科所有次專科的診斷流程、劑量速查、常用計算公式，適合快速決策。',
  'Wolters Kluwer / Lippincott, ISBN: 978-1-975179-96-0',
  ARRAY['內科學','口袋書','MGH','住院醫師','速查','英文'],
  true,
  NULL
),

-- ══════════════════════════════
-- 台灣家庭醫學科
-- ══════════════════════════════

(
  '台灣家庭醫學科住院醫師訓練核心教材（第四版）',
  '台灣家庭醫學醫學會',
  '2022',
  '書籍',
  'https://www.tafm.org.tw',
  NULL,
  '台灣家醫科住院醫師訓練官方教材，涵蓋以病人為中心的醫療、全家照護、社區醫學、老人醫學、慢性病管理、預防保健、台灣本土流行病數據及健保制度解說。',
  '台灣家庭醫學醫學會 (TAFM)',
  ARRAY['家庭醫學','台灣','住院醫師','訓練','中文','以病人為中心'],
  true,
  NULL
),

(
  '全民健康保險藥品給付規定',
  '衛生福利部中央健康保險署',
  '2024',
  '網站',
  'https://www.nhi.gov.tw/Content_List.aspx?n=238533FCBA5B1A95',
  NULL,
  '台灣健保藥品給付條件查詢，包含各藥物申請條件、需附文件、給付限制（特定條件/事前審查）。開立慢性病藥物前確認給付資格的必查來源。',
  '衛生福利部中央健康保險署 (NHIA)',
  ARRAY['健保','藥品','給付','台灣','法規','中文'],
  true,
  NULL
),

-- ══════════════════════════════
-- 感染症 / 抗生素
-- ══════════════════════════════

(
  'Sanford Guide to Antimicrobial Therapy 2024',
  'Gilbert DN, Chambers HF, Saag MS, et al.',
  '2024',
  '書籍',
  'https://www.sanfordguide.com',
  NULL,
  '抗微生物治療速查指南，涵蓋各種感染症（細菌、黴菌、寄生蟲、病毒）的首選與替代抗生素、劑量（含腎功能調整劑量）、療程，並標示抗藥性監測資訊。台灣也廣泛使用。',
  'Antimicrobial Therapy, Inc. / Sanford Guide',
  ARRAY['抗生素','感染症','antimicrobial','抗藥性','速查','英文'],
  true,
  NULL
),

-- ══════════════════════════════
-- WHO
-- ══════════════════════════════

(
  'WHO Model List of Essential Medicines, 23rd Edition',
  'World Health Organization',
  '2023',
  '指引',
  'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02',
  NULL,
  'WHO 基本藥物清單第 23 版，列出全球基礎醫療必需藥物，包含核心清單與補充清單，依照疾病分類整理，是了解國際藥物政策與評估新藥重要性的基準。',
  'World Health Organization (WHO)',
  ARRAY['WHO','基本藥物','藥品政策','公共衛生','英文'],
  true,
  NULL
),

-- ══════════════════════════════
-- 呼吸系統
-- ══════════════════════════════

(
  'GOLD 2024: Global Strategy for Asthma Management and Prevention (GINA)',
  'Global Initiative for Asthma',
  '2024',
  '指引',
  'https://ginasthma.org/2024-gina-main-report/',
  NULL,
  '全球哮喘倡議年度更新報告，包含氣喘診斷標準（PFT 可逆性測試）、嚴重度分級、階梯治療（ICS 為基礎）、急性惡化處理、特殊族群（兒童、孕婦、運動型氣喘）處置。',
  'Global Initiative for Asthma (GINA)',
  ARRAY['氣喘','哮喘','GINA','ICS','吸入劑','呼吸','指引'],
  true,
  NULL
),

(
  'GOLD 2024: Global Strategy for Prevention, Diagnosis and Management of COPD',
  'Global Initiative for Chronic Obstructive Lung Disease',
  '2024',
  '指引',
  'https://goldcopd.org/2024-gold-report/',
  NULL,
  '慢性阻塞性肺疾病（COPD）全球策略年度報告，包含 COPD 診斷（肺功能 FEV1/FVC < 0.7）、ABCD 分組更新為 ABE、吸入藥物選擇策略（LAMA/LABA/ICS）、急性惡化預防與治療。',
  'Global Initiative for Chronic Obstructive Lung Disease (GOLD)',
  ARRAY['COPD','慢性阻塞','肺病','GOLD','LAMA','LABA','吸入劑','指引'],
  true,
  NULL
),

-- ══════════════════════════════
-- 骨骼肌肉
-- ══════════════════════════════

(
  '2020 ACR Guideline for the Management of Gout',
  'FitzGerald JD, Dalbeth N, Mikuls T, et al.',
  '2020',
  '指引',
  'https://doi.org/10.1002/acr.24180',
  NULL,
  '美國風濕病學會痛風指引，更新了急性痛風發作處置（秋水仙素/NSAIDs/類固醇）、降尿酸治療起始時機、治療目標（血清尿酸 < 6 mg/dL）及 Allopurinol/Febuxostat 劑量調整。',
  'American College of Rheumatology (ACR), Arthritis & Rheumatology 2020;72(6)',
  ARRAY['痛風','尿酸','ACR','風濕','Allopurinol','Febuxostat','指引'],
  true,
  NULL
);

-- 確認資料筆數
SELECT COUNT(*) AS total_seeded FROM pro_resources WHERE is_public = true AND created_by IS NULL;
