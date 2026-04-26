-- ============================================================
-- seed_today_workload.sql
-- 補今日工作流程的模擬資料：今日候診掛號、SOAP 病歷、藥物交互查詢
-- 適用條件：seed_50_patients.sql 已跑過、doctor 帳號 YOUR_DOCTOR_EMAIL@example.com
-- ============================================================

DO $$
DECLARE
  doc_id    UUID;
  pat_id    UUID;
  pat_ids   UUID[];
  today     DATE := CURRENT_DATE;
BEGIN
  -- 取得醫師
  SELECT id INTO doc_id FROM auth.users WHERE email = 'YOUR_DOCTOR_EMAIL@example.com' LIMIT 1;
  IF doc_id IS NULL THEN
    RAISE EXCEPTION 'doctor not found';
  END IF;

  -- 撈出 8 名病患做為今日場景
  SELECT array_agg(id) INTO pat_ids FROM (
    SELECT id FROM doctor_patients WHERE doctor_id = doc_id ORDER BY created_at LIMIT 8
  ) t;
  IF array_length(pat_ids, 1) < 8 THEN
    RAISE EXCEPTION 'need at least 8 seeded patients';
  END IF;

  -- 清掉之前可能的 today 重複資料
  DELETE FROM appointments WHERE doctor_id = doc_id AND visit_date = today AND queue_number BETWEEN 1001 AND 1010;
  DELETE FROM soap_notes  WHERE doctor_id = doc_id AND title LIKE '[seed]%';
  DELETE FROM drug_interaction_checks WHERE doctor_id = doc_id AND result LIKE '[seed]%';

  -- ── 今日候診 8 筆（混合 waiting / in_progress / completed） ─────────
  INSERT INTO appointments (doctor_id, patient_id, queue_number, visit_date, status, chief_complaint, checked_in_at) VALUES
    (doc_id, pat_ids[1], 1001, today, 'completed',   '高血壓追蹤、頭暈',       (today || ' 08:05:00')::timestamptz),
    (doc_id, pat_ids[2], 1002, today, 'completed',   '糖尿病回診、HbA1c 偏高', (today || ' 08:25:00')::timestamptz),
    (doc_id, pat_ids[3], 1003, today, 'in_progress', '咳嗽兩週、夜咳明顯',     (today || ' 08:50:00')::timestamptz),
    (doc_id, pat_ids[4], 1004, today, 'waiting',     '頭痛、視力模糊',         (today || ' 09:10:00')::timestamptz),
    (doc_id, pat_ids[5], 1005, today, 'waiting',     '腹瀉、噁心',              (today || ' 09:25:00')::timestamptz),
    (doc_id, pat_ids[6], 1006, today, 'waiting',     'CKD 追蹤、腳踝水腫',     (today || ' 09:40:00')::timestamptz),
    (doc_id, pat_ids[7], 1007, today, 'waiting',     '感冒、喉嚨痛',           (today || ' 09:55:00')::timestamptz),
    (doc_id, pat_ids[8], 1008, today, 'cancelled',   '預約取消',                (today || ' 10:10:00')::timestamptz);

  -- ── 對應的 triage_vitals（前 6 筆有分診） ─────────────────────
  INSERT INTO triage_vitals (patient_id, bp_sys, bp_dia, hr, rr, temp, spo2, weight, height, created_at, used_at) VALUES
    (pat_ids[1], 152, 94, 76, 16, 36.6, 98, 78, 168, (today || ' 07:58:00')::timestamptz, (today || ' 08:08:00')::timestamptz),
    (pat_ids[2], 138, 84, 80, 16, 36.7, 97, 84, 170, (today || ' 08:18:00')::timestamptz, (today || ' 08:28:00')::timestamptz),
    (pat_ids[3], 122, 78, 92, 18, 37.4, 96, 65, 172, (today || ' 08:42:00')::timestamptz, NULL),
    (pat_ids[4], 130, 82, 88, 16, 36.8, 98, 72, 165, (today || ' 09:02:00')::timestamptz, NULL),
    (pat_ids[5], 110, 70, 96, 18, 37.6, 97, 58, 162, (today || ' 09:18:00')::timestamptz, NULL),
    (pat_ids[6], 158, 96, 72, 16, 36.5, 96, 68, 158, (today || ' 09:32:00')::timestamptz, NULL);

  -- ── SOAP 病歷 5 筆（涵蓋常見主訴） ────────────────────────────
  INSERT INTO soap_notes (doctor_id, patient_id, title, subjective, objective, assessment, plan, draft, created_at, updated_at) VALUES
    (doc_id, pat_ids[1], '[seed] 高血壓追蹤門診',
     '主訴頭暈、後頸僵硬約三天，無胸悶、無視力異常。已服用 Norvasc 5mg QD 半年。家中自測血壓近期常 150/95 上下。',
     'BP 152/94 mmHg, HR 76, T 36.6℃, SpO2 98%。BMI 27.6。Heart RRR no murmur. Lungs clear. 下肢無水腫。',
     '原發性高血壓控制不佳（I10）。考慮加上 Diovan 80mg QD 觀察兩週。',
     '加 Diovan 80mg QD；持續 Norvasc 5mg QD。每日早晚各量一次血壓並記錄。兩週後回診評估，若仍 ≥140/90 mmHg 再加量。', false,
     (today || ' 08:30:00')::timestamptz, (today || ' 08:30:00')::timestamptz),

    (doc_id, pat_ids[2], '[seed] 糖尿病回診',
     '糖尿病已 8 年，近 3 個月飯後血糖常超過 200 mg/dL。HbA1c 由半年前 7.2% 上升至 8.4%。否認多尿多飲，體重穩定。',
     'BP 138/84, HR 80, BMI 29.1。眼底檢查未見明顯出血。下肢觸覺感正常。',
     '第 2 型糖尿病控制不佳（E11.9）。',
     '原 Metformin 1000mg BID 維持；新增 Jardiance 10mg QD（注意 eGFR）；衛教飲食控制。3 個月後追蹤 HbA1c。',
     false, (today || ' 09:00:00')::timestamptz, (today || ' 09:00:00')::timestamptz),

    (doc_id, pat_ids[3], '[seed] 慢性咳嗽',
     '咳嗽兩週、夜咳明顯，無發燒、無喘鳴。否認體重減輕。COVID 快篩陰性。最近季節變化明顯。',
     'BP 122/78, HR 92, T 37.4℃, SpO2 96%。Lungs scattered rhonchi bilaterally。喉嚨輕微紅腫。',
     '上呼吸道感染後咳嗽（J20.9）；考慮咳嗽變異型氣喘須再觀察。',
     'Augmentin 625mg TID × 5 days；Mucosolvan 30mg TID。若一週後仍咳，安排胸部 X 光。', true,
     (today || ' 09:30:00')::timestamptz, (today || ' 09:30:00')::timestamptz),

    (doc_id, pat_ids[6], '[seed] CKD G3a 追蹤',
     'CKD G3a 已 2 年，主訴近一週腳踝水腫、夜尿增加。否認呼吸喘、無胸痛。已戒酒戒菸。',
     'BP 158/96, HR 72。下肢凹陷性水腫 2+。Bilateral lung bases clear。',
     'CKD G3a (N18.30) with worsening volume status；需評估是否進展至 G3b。',
     '抽血追 Cr/eGFR/UACR/electrolytes；加 Lasix 20mg QD 兩週；嚴格限鹽（<5g/day）。3 週後回診。', false,
     (today || ' 10:00:00')::timestamptz, (today || ' 10:00:00')::timestamptz),

    (doc_id, pat_ids[5], '[seed] 急性腸胃炎',
     '腹瀉約 8 次/日 共 2 天，伴噁心。否認血便。全家三人前晚一同外食。',
     'BP 110/70, HR 96, T 37.6℃。腹軟、輕度壓痛無反彈痛。皮膚彈性稍差，黏膜微乾。',
     '急性腸胃炎（A09），疑似食物中毒。輕度脫水。',
     'Smecta 3g TID；BHB 益生菌；補水並少量多餐。若血便、發燒 >38.5℃ 或腹痛加劇返診。', false,
     (today || ' 10:30:00')::timestamptz, (today || ' 10:30:00')::timestamptz);

  -- ── 藥物交互作用查詢稽核 6 筆（讓 /pro/drugs 有歷史可看） ────────
  INSERT INTO drug_interaction_checks (doctor_id, patient_id, drug_list, result, severity, created_at) VALUES
    (doc_id, pat_ids[1], ARRAY['Norvasc','Diovan'],          '[seed] 安全合併使用，可同服。',                                     'none',     (today || ' 08:32:00')::timestamptz),
    (doc_id, pat_ids[2], ARRAY['Metformin','Jardiance'],     '[seed] 安全合併；注意脫水與低血糖風險。',                              'minor',    (today || ' 09:05:00')::timestamptz),
    (doc_id, pat_ids[6], ARRAY['Lasix','Norvasc'],           '[seed] 合併用注意低血壓與電解質失衡。',                                'moderate', (today || ' 10:02:00')::timestamptz),
    (doc_id, NULL,       ARRAY['Warfarin','Aspirin'],        '[seed] major：合併顯著增加出血風險，需密切監測 INR。',                  'major',    (today || ' 11:00:00')::timestamptz),
    (doc_id, NULL,       ARRAY['Sildenafil','Nitroglycerin'],'[seed] contraindicated：嚴重低血壓風險，絕對禁用。',                    'contraindicated', (today || ' 11:05:00')::timestamptz),
    (doc_id, NULL,       ARRAY['Simvastatin','Amiodarone'],  '[seed] major：CYP3A4 抑制致橫紋肌溶解，限 Simvastatin 20mg/day。',     'major',    (today || ' 11:10:00')::timestamptz);

  RAISE NOTICE '✓ today workload seeded: 8 appointments, 5 SOAP notes, 6 drug-interaction checks';
END $$;
