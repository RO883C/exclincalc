-- ============================================================
-- seed_50_patients.sql
-- 50 diverse patients for ExClinCalc dev/demo
-- Run as the doctor user (replace DOCTOR_ID with actual UUID)
-- ============================================================

-- Usage: set doctor_id variable before running
-- \set doctor_id 'YOUR-DOCTOR-UUID-HERE'

DO $$
DECLARE
  doc_id UUID;
  today  DATE := CURRENT_DATE;
  p      UUID;
BEGIN
  -- Resolve doctor by email
  SELECT id INTO doc_id FROM auth.users WHERE email = 'yuyulsc881209@icloud.com' LIMIT 1;
  IF doc_id IS NULL THEN
    RAISE EXCEPTION 'Doctor account yuyulsc881209@icloud.com not found';
  END IF;

  -- ── Helper: insert patient + appointment + optional vitals ──
  -- Pattern: INSERT patient → INSERT appointment → optional triage_vitals

  -- ── Group 1: 感冒 / 上呼吸道 (10) ──────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,nhi_number,phone)
  VALUES (doc_id,'林小明','1995-03-12','M','A123456789','0912345601') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,nhi_number,checked_in_at)
  VALUES (doc_id,p,1,today,'completed','發燒、喉嚨痛','A123456789',(today||' 08:10:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,118,76,92,18,38.3,98,68,172,(today||' 08:05:00')::timestamptz,(today||' 08:12:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,nhi_number,phone)
  VALUES (doc_id,'張雅婷','2001-07-22','F','B234567890','0912345602') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,2,today,'completed','流鼻水、頭痛',(today||' 08:25:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,nhi_number,phone)
  VALUES (doc_id,'王大偉','1988-11-05','M','C345678901','0912345603') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,3,today,'completed','咳嗽、倦怠',(today||' 08:40:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,nhi_number,phone)
  VALUES (doc_id,'陳美玲','1979-06-18','F','D456789012','0912345604') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,4,today,'completed','喉嚨痛、聲音沙啞',(today||' 08:55:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,nhi_number,phone)
  VALUES (doc_id,'李建宏','2008-02-28','M','E567890123','0912345605') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,5,today,'waiting','發燒38.5、全身痠痛',(today||' 09:10:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,110,70,98,20,38.5,97,55,165,(today||' 09:05:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'黃淑芬','1993-09-14','F','0912345606') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,6,today,'waiting','鼻塞、打噴嚏',(today||' 09:20:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'吳俊賢','1985-04-03','M','0912345607') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,7,today,'waiting','頭痛、全身發冷',(today||' 09:35:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'蔡佩珊','1999-12-01','F','0912345608') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,8,today,'cancelled','喉嚨不舒服',(today||' 09:50:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'許文昌','1972-08-09','M','0912345609') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,9,today,'completed','咳嗽超過一週',(today||' 09:00:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'劉靜怡','2003-05-17','F','0912345610') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,10,today,'waiting','低燒、疲倦',(today||' 10:00:00')::timestamptz);

  -- ── Group 2: 高血壓 (8) ─────────────────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'鄭志明','1960-03-22','M','0912345611') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,11,today,'completed','高血壓追蹤、頭暈',(today||' 08:00:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,158,96,74,16,36.8,98,82,170,(today||' 07:55:00')::timestamptz,(today||' 08:02:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'謝淑華','1955-11-30','F','0912345612') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,12,today,'completed','血壓控制不佳',(today||' 08:15:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,165,100,80,16,36.6,97,68,158,(today||' 08:10:00')::timestamptz,(today||' 08:18:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'洪仁傑','1963-07-14','M','0912345613') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,13,today,'waiting','高血壓、後頸僵硬',(today||' 10:10:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,172,104,78,16,36.7,98,88,174,(today||' 10:05:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'葉秀蘭','1958-09-03','F','0912345614') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,14,today,'completed','長期高血壓回診',(today||' 09:30:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'蘇柏翰','1967-01-25','M','0912345615') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,15,today,'waiting','高血壓、胸悶',(today||' 10:25:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,180,108,86,18,36.9,96,95,178,(today||' 10:20:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'方雅欣','1970-06-08','F','0912345616') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,16,today,'completed','高血壓追蹤',(today||' 09:00:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'廖國棟','1962-04-19','M','0912345617') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,17,today,'completed','頭痛、高血壓',(today||' 09:45:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'余淑貞','1953-12-12','F','0912345618') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,18,today,'cancelled','高血壓藥物調整',(today||' 10:00:00')::timestamptz);

  -- ── Group 3: 糖尿病 (8) ─────────────────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'林建國','1958-02-14','M','0912345619') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,19,today,'completed','糖尿病追蹤、血糖偏高',(today||' 08:20:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,136,84,76,16,36.8,97,90,172,(today||' 08:15:00')::timestamptz,(today||' 08:22:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'陳翠玲','1961-08-07','F','0912345620') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,20,today,'completed','第二型糖尿病回診',(today||' 08:35:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'周文宏','1955-05-23','M','0912345621') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,21,today,'waiting','血糖控制不穩、多尿',(today||' 10:40:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,142,88,80,16,36.9,97,85,168,(today||' 10:35:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'楊淑芳','1964-10-31','F','0912345622') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,22,today,'completed','糖尿病＋高血壓共病',(today||' 09:15:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,148,92,78,16,36.7,97,72,160,(today||' 09:10:00')::timestamptz,(today||' 09:18:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'賴明哲','1950-03-05','M','0912345623') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,23,today,'waiting','糖尿病足部麻木感',(today||' 10:55:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'施麗娟','1968-12-20','F','0912345624') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,24,today,'completed','HbA1c追蹤',(today||' 09:00:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'曾建平','1957-07-17','M','0912345625') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,25,today,'completed','糖尿病、視力模糊',(today||' 09:30:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'戴美惠','1960-01-09','F','0912345626') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,26,today,'waiting','血糖高、口乾舌燥',(today||' 11:05:00')::timestamptz);

  -- ── Group 4: 慢性腎臟病 CKD (6) ────────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'吳金土','1948-06-11','M','0912345627') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,27,today,'completed','CKD G3a追蹤、水腫',(today||' 08:00:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,152,94,72,16,36.6,96,78,166,(today||' 07:55:00')::timestamptz,(today||' 08:03:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'許桂香','1952-09-28','F','0912345628') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,28,today,'completed','腎臟病回診、倦怠感',(today||' 08:45:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'蔡坤木','1945-02-03','M','0912345629') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,29,today,'waiting','CKD G4、噁心感',(today||' 11:20:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,160,98,68,18,36.5,95,70,162,(today||' 11:15:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'林素娥','1955-04-16','F','0912345630') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,30,today,'completed','腎功能追蹤、蛋白尿',(today||' 09:15:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,145,90,74,16,36.7,97,62,156,(today||' 09:10:00')::timestamptz,(today||' 09:18:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'鄭仁和','1950-11-22','M','0912345631') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,31,today,'waiting','CKD＋糖尿病共病追蹤',(today||' 11:35:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'謝翠花','1958-08-30','F','0912345632') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,32,today,'completed','腎病第三期、貧血',(today||' 10:00:00')::timestamptz);

  -- ── Group 5: COVID-19 / 呼吸道感染 (5) ─────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'陳家豪','1990-05-04','M','0912345633') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,33,today,'completed','COVID-19快篩陽性、發燒',(today||' 08:00:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,116,74,102,22,39.1,94,75,178,(today||' 07:55:00')::timestamptz,(today||' 08:03:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'王宜芳','1985-10-19','F','0912345634') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,34,today,'waiting','COVID後遺症、持續咳嗽',(today||' 11:50:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,112,72,88,20,37.2,96,58,163,(today||' 11:45:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'黃世傑','1978-03-28','M','0912345635') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,35,today,'completed','確診COVID、呼吸喘',(today||' 09:00:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,122,78,110,24,38.8,93,80,175,(today||' 08:55:00')::timestamptz,(today||' 09:03:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'李春梅','2000-01-15','F','0912345636') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,36,today,'waiting','COVID快篩陽、頭痛',(today||' 12:00:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'吳正義','1972-07-07','M','0912345637') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,37,today,'cancelled','疑似COVID、接觸史',(today||' 10:30:00')::timestamptz);

  -- ── Group 6: 心血管 (5) ─────────────────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'劉明雄','1952-04-14','M','0912345638') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,38,today,'completed','胸悶、心悸',(today||' 08:30:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,148,92,96,18,36.8,96,82,170,(today||' 08:25:00')::timestamptz,(today||' 08:32:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'趙麗芬','1956-12-03','F','0912345639') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,39,today,'waiting','心房顫動追蹤、喘',(today||' 12:10:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,138,86,112,20,36.7,95,65,158,(today||' 12:05:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'許國誠','1948-08-22','M','0912345640') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,40,today,'completed','冠狀動脈疾病回診',(today||' 09:45:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'林秀蘭','1961-03-17','F','0912345641') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,41,today,'completed','心臟瓣膜追蹤、下肢水腫',(today||' 10:00:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'邱文彬','1955-06-29','M','0912345642') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,42,today,'waiting','心悸、頭暈',(today||' 12:20:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,132,82,108,18,36.9,96,75,168,(today||' 12:15:00')::timestamptz);

  -- ── Group 7: 腸胃炎 / 消化道 (5) ───────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'蔡明珠','1982-11-11','F','0912345643') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,43,today,'completed','腹瀉、噁心嘔吐',(today||' 09:00:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,106,68,94,18,37.8,98,54,162,(today||' 08:55:00')::timestamptz,(today||' 09:03:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'謝光明','1975-09-06','M','0912345644') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,44,today,'waiting','腹痛、食慾不振',(today||' 12:30:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'鄧淑惠','1988-02-22','F','0912345645') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,45,today,'completed','急性腸胃炎',(today||' 10:15:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'盧建文','1991-07-14','M','0912345646') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,46,today,'completed','腹瀉超過三天',(today||' 10:30:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'高玉鳳','1966-05-08','F','0912345647') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,47,today,'waiting','胃痛、反酸',(today||' 12:45:00')::timestamptz);

  -- ── Group 8: 骨骼肌肉 (3) ──────────────────────────────────

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'江文龍','1970-04-25','M','0912345648') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,48,today,'completed','下背痛、脊椎退化',(today||' 11:00:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at,used_at)
  VALUES (p,124,80,70,16,36.6,99,88,176,(today||' 10:55:00')::timestamptz,(today||' 11:02:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'徐淑惠','1965-10-12','F','0912345649') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,49,today,'waiting','膝關節痛、骨質疏鬆',(today||' 12:55:00')::timestamptz);
  INSERT INTO triage_vitals (patient_id,bp_sys,bp_dia,hr,rr,temp,spo2,weight,height,created_at)
  VALUES (p,128,82,72,16,36.5,99,60,155,(today||' 12:50:00')::timestamptz);

  INSERT INTO doctor_patients (doctor_id,full_name,date_of_birth,sex,phone)
  VALUES (doc_id,'柯明仁','1958-01-30','M','0912345650') RETURNING id INTO p;
  INSERT INTO appointments (doctor_id,patient_id,queue_number,visit_date,status,chief_complaint,checked_in_at)
  VALUES (doc_id,p,50,today,'waiting','肩頸疼痛、肌腱炎',(today||' 13:05:00')::timestamptz);

  RAISE NOTICE '✓ 50 patients seeded for doctor %', doc_id;
END $$;

