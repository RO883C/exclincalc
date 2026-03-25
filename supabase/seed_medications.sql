-- 常見藥物資料（種子資料）
-- 來源：台灣仿單、衛福部食藥署、ADA/ACC/AHA 指引

insert into medications (name_zh, name_en, generic_name, category, uses_zh, side_effects_zh, common_dosage, warnings_zh, interactions, prescription_required) values

-- ── 降血壓藥 ──
('脈優錠', 'Norvasc', 'Amlodipine', '鈣離子阻斷劑', '治療高血壓、心絞痛，放鬆血管使血壓下降', '腳踝水腫、臉部潮紅、頭痛、心跳加快', '每日 5-10mg', '低血壓患者慎用；與葡萄柚汁交互作用', ARRAY['葡萄柚汁', 'Simvastatin（增加橫紋肌溶解風險）'], true),
('脈泰寧', 'Diovan', 'Valsartan', 'ARB（血管張力素受體阻斷劑）', '降血壓、保護腎臟、心衰竭', '頭暈、高血鉀、腎功能下降', '每日 80-320mg', '懷孕禁用（致畸胎）；腎動脈狹窄禁用', ARRAY['ACE抑制劑（增加低血壓風險）', '鉀補充劑', 'NSAIDs'], true),
('卡普立', 'Capoten', 'Captopril', 'ACE 抑制劑', '降血壓、心衰竭、糖尿病腎病保護', '乾咳（最常見）、高血鉀、頭暈', '每日 25-150mg，分次服用', '懷孕禁用；腎動脈狹窄禁用', ARRAY['鉀鹽', 'NSAIDs', 'ARB（避免合用）'], true),
('天諾明', 'Tenormin', 'Atenolol', '乙型阻斷劑', '高血壓、心絞痛、心律不整', '疲倦、手腳冰冷、心跳變慢、性功能障礙', '每日 25-100mg', '氣喘患者禁用；糖尿病患者需注意低血糖症狀被掩蓋', ARRAY['胰島素', '鈣離子阻斷劑', 'NSAIDs'], true),
('可悅您', 'Cozaar', 'Losartan', 'ARB', '高血壓、糖尿病腎病、心衰竭', '頭暈、疲倦、高血鉀', '每日 25-100mg', '懷孕禁用', ARRAY['ACE抑制劑', '鉀補充劑', 'NSAIDs'], true),

-- ── 降血糖藥 ──
('庫魯化錠', 'Glucophage', 'Metformin', '雙胍類降血糖藥', '第 2 型糖尿病一線用藥，降低肝臟葡萄糖產生', '噁心、腹瀉、腸胃不適（初期）；乳酸中毒（罕見）', '每日 500-2000mg，隨餐服用', 'eGFR <30 禁用；碘造影劑檢查前需停藥', ARRAY['碘造影劑', '酒精', 'Cimetidine'], true),
('糖化錠', 'Amaryl', 'Glimepiride', '磺醯脲類', '刺激胰島素分泌，降低血糖', '低血糖（最常見）、體重增加', '每日 1-8mg，早餐前服用', '低血糖風險高；腎功能不全慎用', ARRAY['NSAIDs', '磺胺類抗生素', 'Warfarin'], true),
('佳糖維', 'Jardiance', 'Empagliflozin', 'SGLT-2 抑制劑', '降低血糖、保護心臟和腎臟（ADA 2026 推薦）', '泌尿道感染、生殖器黴菌感染、脫水', '每日 10-25mg', '尿道感染病史需注意；酮酸中毒風險', ARRAY['利尿劑（脫水風險）', '胰島素（低血糖）'], true),
('勝糖', 'Januvia', 'Sitagliptin', 'DPP-4 抑制劑', '降低血糖，體重中性，低血糖風險低', '鼻咽炎、關節痛', '每日 100mg（腎功能不全需調整劑量）', '胰臟炎病史慎用', ARRAY['Digoxin（輕微增加濃度）'], true),
('胰速達', 'NovoRapid', 'Insulin Aspart', '速效胰島素', '餐前注射控制血糖，作用時間 15-30 分鐘', '低血糖、注射部位脂肪萎縮', '皮下注射 0.1-0.2 U/kg/餐', '隨餐服用，注射後需在 15 分鐘內進食', ARRAY['口服降血糖藥', '酒精', '乙型阻斷劑（掩蓋低血糖症狀）'], true),

-- ── 降血脂藥 ──
('脂立清', 'Lipitor', 'Atorvastatin', 'Statin（他汀類）', '降低 LDL 膽固醇，預防心臟病和中風', '肌肉痠痛（需注意橫紋肌溶解）、肝功能異常', '每日 10-80mg，睡前服用', 'ALT > 3倍正常值需停藥；懷孕禁用', ARRAY['葡萄柚汁（增加濃度）', 'Amiodarone', 'Niacin（增加橫紋肌溶解風險）'], true),
('素果', 'Zocor', 'Simvastatin', 'Statin', '降低 LDL，預防心血管疾病', '肌肉痠痛、肝功能異常', '每日 10-40mg，睡前服用', '橫紋肌溶解風險；最大劑量 20mg（與 Amlodipine 合用時）', ARRAY['葡萄柚汁', 'Amlodipine', 'Amiodarone', 'Cyclosporine'], true),
('冠脂妥', 'Crestor', 'Rosuvastatin', 'Statin', '強效降低 LDL，適合需要大幅降脂的患者', '肌肉痠痛、蛋白尿', '每日 5-40mg', '亞裔族群起始劑量建議較低（5mg）', ARRAY['Antacids', 'Warfarin（增加出血風險）', 'Cyclosporine'], true),
('益脂可', 'Zetia', 'Ezetimibe', '膽固醇吸收抑制劑', '抑制腸道膽固醇吸收，常與 Statin 合用', '腹痛、腸胃不適、頭痛', '每日 10mg', '可單獨使用或與 Statin 合用', ARRAY['Cyclosporine', 'Cholestyramine（降低吸收）'], true),

-- ── 抗血栓藥 ──
('保栓通', 'Plavix', 'Clopidogrel', '抗血小板藥', '預防心臟病發作和中風，放置冠狀動脈支架後使用', '出血風險增加、瘀青', '每日 75mg', '手術前需停藥 5-7 天；CYP2C19 代謝差者效果差', ARRAY['Aspirin', 'Omeprazole（降低效果）', 'Warfarin'], true),
('阿斯匹靈', 'Aspirin', 'Acetylsalicylic Acid', '非類固醇消炎藥/抗血小板', '低劑量預防心臟病；高劑量退燒、止痛、消炎', '胃腸不適、出血風險、耳鳴（大劑量）', '心血管預防：每日 75-100mg', '胃潰瘍病史慎用；兒童禁用（雷氏症候群風險）', ARRAY['Warfarin', 'NSAIDs', 'Clopidogrel'], false),
('可邁丁', 'Coumadin', 'Warfarin', '抗凝血藥', '預防深層靜脈栓塞、肺栓塞、心房顫動引起的中風', '出血（最主要副作用）', '依 INR 調整，通常 2-10mg/天', '需定期監測 INR（目標 2-3）；食物影響大', ARRAY['維他命 K 食物（大幅影響）', '抗生素', 'NSAIDs', 'Aspirin', '幾乎所有藥物'], true),

-- ── 胃腸藥 ──
('耐適恩', 'Nexium', 'Esomeprazole', '質子幫浦抑制劑（PPI）', '胃食道逆流、胃潰瘍、預防 NSAIDs 引起的胃損傷', '頭痛、腹瀉、長期使用可能缺乏鎂和維 B12', '每日 20-40mg，飯前服用', '長期使用增加骨質疏鬆和感染風險', ARRAY['Clopidogrel（降低其效果）', 'Methotrexate'], false),
('善胃得', 'Zantac', 'Ranitidine', 'H2 受體阻斷劑', '胃潰瘍、十二指腸潰瘍、胃食道逆流', '頭痛、便秘', '每日 150-300mg', '功效較 PPI 弱，適合輕症', ARRAY['Antacids（降低吸收）', 'Ketoconazole'], false),

-- ── 抗生素 ──
('安莫西林', 'Amoxicillin', 'Amoxicillin', '青黴素類抗生素', '細菌感染（肺炎、泌尿道感染、耳炎）', '腸胃不適、皮疹、過敏（嚴重者過敏性休克）', '每日 500-1000mg，分 3 次服用', '青黴素過敏者禁用', ARRAY['Warfarin（增加出血風險）', '口服避孕藥（可能降低效果）'], true),
('日舒', 'Zithromax', 'Azithromycin', '大環內酯類抗生素', '呼吸道感染、非典型肺炎、皮膚感染', '腸胃不適、心律不整（QT 延長）', '500mg 第一天，250mg 後 4 天', '心臟病患者慎用（QT 延長）', ARRAY['Antacids（降低吸收）', 'Warfarin', 'QT 延長藥物'], true),

-- ── 止痛/消炎藥 ──
('伏他寧', 'Voltaren', 'Diclofenac', 'NSAIDs（非類固醇消炎藥）', '關節炎、肌肉疼痛、月經痛', '胃腸不適（胃潰瘍風險）、腎功能影響、心血管風險', '每日 75-150mg，隨餐服用', '有胃潰瘍、腎功能不全、心臟病者慎用', ARRAY['Warfarin', 'ACE抑制劑', 'Aspirin', 'Corticosteroids'], false),
('普拿疼', 'Tylenol', 'Acetaminophen', '退燒止痛藥', '退燒、輕中度疼痛', '肝毒性（過量）', '每次 500-1000mg，每日不超過 4000mg', '肝病患者每日不超過 2000mg；勿與酒精同服', ARRAY['Warfarin（增加出血風險）', '酒精（增加肝毒性）'], false),

-- ── 氣喘/肺部 ──
('服喘靈', 'Ventolin', 'Salbutamol/Albuterol', '短效乙二型支氣管擴張劑', '急性氣喘發作緩解、運動誘發支氣管痙攣', '心跳加快、手抖、低血鉀', '視需要吸入 100-200mcg', '使用超過每週 2 次需重新評估控制', ARRAY['乙型阻斷劑（拮抗）', 'Theophylline'], true),
('輔助樂', 'Symbicort', 'Budesonide/Formoterol', '吸入型類固醇 + 長效支氣管擴張劑', '氣喘和 COPD 的長期控制', '聲音沙啞、口腔黴菌感染（需漱口）', '每天 2 次吸入', '使用後需漱口預防口腔感染', ARRAY['Beta-blockers', 'CYP3A4 抑制劑'], true),

-- ── 精神科 ──
('立普能', 'Lexapro', 'Escitalopram', 'SSRI（選擇性血清素回收抑制劑）', '憂鬱症、焦慮症', '噁心、失眠、性功能障礙、QT 延長', '每日 10-20mg', '停藥需緩慢減量；18 歲以下自殺風險警告', ARRAY['MAO 抑制劑（禁用）', 'Tramadol', 'QT 延長藥物'], true),
('克憂果', 'Paxil', 'Paroxetine', 'SSRI', '憂鬱症、恐慌症、社交焦慮', '體重增加、停藥症候群（停藥反應強）', '每日 20-40mg', '停藥需非常緩慢；懷孕慎用', ARRAY['MAO 抑制劑（禁用）', 'Tamoxifen（降低效果）'], true),

-- ── 甲狀腺 ──
('昂特信', 'Eltroxin', 'Levothyroxine', '甲狀腺素補充劑', '甲狀腺功能低下症', '過量：心跳加快、手抖、體重減輕', '依 TSH 調整，通常 25-200mcg/天', '空腹服用；與鐵劑、鈣片間隔 4 小時', ARRAY['鈣片', '鐵劑', 'Antacids（降低吸收）'], true),

-- ── 痛風 ──
('落得清', 'Zyloric', 'Allopurinol', '黃嘌呤氧化酶抑制劑', '慢性痛風、預防尿酸結石', '皮疹（嚴重者 Stevens-Johnson 症候群）、腸胃不適', '每日 100-300mg', 'HLA-B*5801 基因型台灣人嚴重皮膚反應風險高', ARRAY['Azathioprine（增加骨髓抑制）', 'Warfarin', 'ACE抑制劑'], true),
('秋水仙素', 'Colcrys', 'Colchicine', '抗炎藥', '急性痛風發作治療和預防', '腹瀉、噁心、肌肉無力', '急性發作：0.5-1mg，之後每 1-2 小時 0.5mg', '腎功能不全需調整劑量；小劑量比大劑量更安全', ARRAY['CYP3A4 抑制劑（增加毒性）', 'Statin（肌肉病變）'], true);
