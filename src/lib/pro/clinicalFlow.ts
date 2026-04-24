/**
 * 台灣家醫科診療流程資料庫
 * 依主訴提供問診引導、身體檢查重點、常見處方
 */

// ── 問診結構 (OPQRST) ─────────────────────────────────────────

export interface HistoryQuestion {
  id: string;
  question: string;           // question text
  type: "select" | "text" | "scale" | "multiselect";
  options?: string[];
  placeholder?: string;
}

export interface ComplaintTemplate {
  complaint: string;
  icon: string;
  hpiQuestions: HistoryQuestion[];  // OPQRST style
  rosPositives: string[];           // 相關系統症狀 to ask
  pePoints: string[];               // 重點身體檢查項目
  labPackages: string[];            // 建議套組 ID
  commonDx: Array<{ name_zh: string; icd10: string }>;
  redFlags: string[];               // 需立即轉介的警示
}

export const COMPLAINT_TEMPLATES: ComplaintTemplate[] = [
  {
    complaint: "頭暈/頭痛",
    icon: "🤕",
    hpiQuestions: [
      { id: "onset", question: "何時開始？", type: "select", options: ["今天", "1-3天", "1週", "1-4週", "1個月以上"] },
      { id: "type", question: "頭暈的性質？", type: "select", options: ["天旋地轉（眩暈）", "頭重腳輕/飄浮感", "快要暈倒感", "頭痛為主"] },
      { id: "frequency", question: "發作頻率？", type: "select", options: ["持續性", "間歇性，每天發作", "偶爾發作"] },
      { id: "duration", question: "每次持續多久？", type: "select", options: ["數秒", "數分鐘", "數小時", "持續一整天以上"] },
      { id: "trigger", question: "有誘發因素嗎？", type: "multiselect", options: ["起身時", "特定頭部動作", "壓力/疲勞", "無明顯誘因", "進食後"] },
      { id: "associated", question: "合併哪些症狀？", type: "multiselect", options: ["噁心/嘔吐", "耳鳴", "聽力下降", "視力模糊", "肢體無力", "言語困難", "胸悶/心悸", "無合併症狀"] },
      { id: "severity", question: "嚴重程度？", type: "scale" },
    ],
    rosPositives: ["心悸/心跳不整", "視力改變", "肢體麻木無力", "耳鳴/聽力改變", "噁心嘔吐", "頸部僵硬"],
    pePoints: ["血壓（兩手對比）", "心跳/心律", "眼球運動", "Romberg test", "步態評估", "頸部血管雜音", "直立性血壓變化"],
    labPackages: ["vitals", "cbc", "glucose", "thyroid"],
    commonDx: [
      { name_zh: "良性陣發性位置性眩暈 BPPV", icd10: "H81.1" },
      { name_zh: "原發性高血壓", icd10: "I10" },
      { name_zh: "貧血", icd10: "D64.9" },
      { name_zh: "甲狀腺功能低下", icd10: "E03.9" },
      { name_zh: "偏頭痛", icd10: "G43.909" },
    ],
    redFlags: ["突發劇烈頭痛（雷擊樣）", "合併肢體無力/言語困難", "意識改變", "頸部僵硬＋發燒（腦膜炎）"],
  },
  {
    complaint: "疲勞/倦怠",
    icon: "😴",
    hpiQuestions: [
      { id: "onset", question: "何時開始？", type: "select", options: ["急性（1週內）", "亞急性（1-4週）", "慢性（1個月以上）"] },
      { id: "pattern", question: "疲勞型態？", type: "select", options: ["整天都累", "早上起床很累", "下午特別累", "活動後加重"] },
      { id: "sleep", question: "睡眠狀況？", type: "select", options: ["睡眠正常", "難以入睡", "易醒/早醒", "睡很多但不解勞"] },
      { id: "weight", question: "近期體重變化？", type: "select", options: ["無明顯變化", "體重下降", "體重增加"] },
      { id: "mood", question: "情緒/心情？", type: "select", options: ["正常", "情緒低落/憂鬱傾向", "焦慮緊張"] },
      { id: "associated", question: "合併症狀？", type: "multiselect", options: ["怕冷/怕熱", "便秘/腹瀉", "肌肉關節痠痛", "頭髮掉落", "食慾不振", "口乾口渴", "呼吸喘"] },
      { id: "severity", question: "影響日常生活程度？", type: "scale" },
    ],
    rosPositives: ["體重變化", "食慾改變", "排便習慣改變", "皮膚變化", "月經不規則（女性）"],
    pePoints: ["甲狀腺觸診", "淋巴結觸診", "結膜顏色（貧血）", "肝脾腫大", "下肢水腫"],
    labPackages: ["cbc", "thyroid", "glucose", "liver", "renal"],
    commonDx: [
      { name_zh: "缺鐵性貧血", icd10: "D50.9" },
      { name_zh: "甲狀腺功能低下", icd10: "E03.9" },
      { name_zh: "憂鬱症", icd10: "F32.9" },
      { name_zh: "糖尿病", icd10: "E11.9" },
      { name_zh: "慢性疲勞", icd10: "R53.82" },
    ],
    redFlags: ["不明原因體重快速下降（>5% /月）", "夜間盜汗＋發燒", "合併出血症狀"],
  },
  {
    complaint: "多尿/口渴",
    icon: "💧",
    hpiQuestions: [
      { id: "onset", question: "何時開始注意到？", type: "select", options: ["最近幾天", "1-2週", "1個月", "數個月"] },
      { id: "polyuria", question: "每天排尿次數大約？", type: "select", options: ["7-8次（正常）", "10-15次", "15次以上", "夜尿為主"] },
      { id: "polydipsia", question: "喝水量增加明顯嗎？", type: "select", options: ["有，每天超過3L", "有，明顯增加", "輕微增加", "無明顯增加"] },
      { id: "weight", question: "近期體重？", type: "select", options: ["減輕（明顯）", "減輕（輕微）", "不變", "增加"] },
      { id: "appetite", question: "食慾？", type: "select", options: ["增加（多食）", "正常", "減少"] },
      { id: "family", question: "家族糖尿病史？", type: "select", options: ["有（父/母）", "有（兄弟姊妹）", "有（祖父母）", "無"] },
    ],
    rosPositives: ["視力模糊", "傷口癒合慢", "肢體麻木/刺痛", "反覆感染（泌尿道/皮膚）"],
    pePoints: ["BMI/腰圍", "足部感覺檢查", "眼底（視網膜病變）", "傷口/皮膚評估"],
    labPackages: ["glucose", "renal", "uric_acid", "vitals"],
    commonDx: [
      { name_zh: "第2型糖尿病", icd10: "E11.9" },
      { name_zh: "糖尿病前期", icd10: "R73.09" },
      { name_zh: "泌尿道感染", icd10: "N39.0" },
      { name_zh: "尿崩症", icd10: "E23.2" },
    ],
    redFlags: ["血糖極高（>500 mg/dL）", "意識改變", "呼吸有爛水果味（DKA）"],
  },
  {
    complaint: "關節腫痛",
    icon: "🦴",
    hpiQuestions: [
      { id: "onset", question: "何時開始？", type: "select", options: ["急性（24h內）", "1-3天", "1週", "慢性（>6週）"] },
      { id: "location", question: "哪個關節？", type: "multiselect", options: ["大拇趾（第一蹠趾關節）", "踝關節", "膝關節", "手指小關節（多發）", "手腕", "肩膀", "髖關節"] },
      { id: "character", question: "疼痛性質？", type: "select", options: ["急性劇痛＋腫脹＋發紅（急性痛風）", "晨僵明顯（>1小時）", "活動後加重/休息緩解", "持續鈍痛"] },
      { id: "diet", question: "近期飲食/飲酒？", type: "select", options: ["有飲酒", "大量進食海鮮/內臟", "正常飲食", "脫水（喝水不足）"] },
      { id: "history", question: "過去是否發作過？", type: "select", options: ["是，反覆發作", "是，第一次", "否"] },
      { id: "severity", question: "疼痛程度？", type: "scale" },
    ],
    rosPositives: ["腎結石病史", "痛風家族史", "高血壓/糖尿病", "服用利尿劑"],
    pePoints: ["關節視診（紅腫）", "觸診（壓痛/皮溫）", "活動範圍", "皮下痛風石"],
    labPackages: ["uric_acid", "cbc", "renal"],
    commonDx: [
      { name_zh: "痛風性關節炎", icd10: "M10.00" },
      { name_zh: "高尿酸血症", icd10: "E79.0" },
      { name_zh: "退化性關節炎", icd10: "M19.90" },
      { name_zh: "類風濕性關節炎（疑似）", icd10: "M06.9" },
      { name_zh: "蜂窩性組織炎", icd10: "L03.90" },
    ],
    redFlags: ["發燒＋關節劇痛（化膿性關節炎）", "多關節＋皮疹（SLE）", "脊椎受累"],
  },
  {
    complaint: "胸悶/心悸",
    icon: "🫀",
    hpiQuestions: [
      { id: "onset", question: "何時開始？", type: "select", options: ["今天急性發作", "1-3天", "1-4週", "慢性間歇性"] },
      { id: "character", question: "胸悶性質？", type: "select", options: ["壓迫感/胸口沉重", "刺痛/尖銳痛", "心跳加速為主", "悶悶的難以描述"] },
      { id: "exertion", question: "與活動的關係？", type: "select", options: ["活動時加重，休息緩解（心絞痛）", "與活動無關", "休息時發作"] },
      { id: "radiation", question: "有放射至其他部位嗎？", type: "multiselect", options: ["左肩/左臂", "下顎/頸部", "背部", "上腹（胃部）", "無放射"] },
      { id: "duration", question: "每次持續多久？", type: "select", options: ["<5分鐘自行緩解", "5-30分鐘", ">30分鐘持續", "數秒後消失"] },
      { id: "associated", question: "合併症狀？", type: "multiselect", options: ["出汗/冷汗", "呼吸困難", "噁心/嘔吐", "暈厥/將近暈倒", "焦慮/恐慌感", "無"] },
    ],
    rosPositives: ["呼吸喘（尤其平躺加重）", "下肢水腫", "夜間咳嗽", "心跳不規則"],
    pePoints: ["心跳（節律）", "血壓（兩手）", "心音（雜音）", "呼吸音", "頸靜脈擴張", "下肢水腫"],
    labPackages: ["vitals", "cbc", "lipids", "thyroid"],
    commonDx: [
      { name_zh: "心律不整", icd10: "I49.9" },
      { name_zh: "穩定性心絞痛", icd10: "I20.9" },
      { name_zh: "胃食道逆流", icd10: "K21.0" },
      { name_zh: "焦慮/恐慌症", icd10: "F41.0" },
      { name_zh: "貧血", icd10: "D64.9" },
    ],
    redFlags: ["持續>30分鐘胸痛＋出汗（急性心肌梗塞）", "呼吸困難＋端坐呼吸", "暈厥發作"],
  },
  {
    complaint: "腹部不適",
    icon: "🫃",
    hpiQuestions: [
      { id: "location", question: "主要在哪裡不適？", type: "select", options: ["右上腹（肝膽）", "左上腹（胃）", "右下腹（闌尾）", "左下腹（大腸）", "肚臍周圍", "全腹部", "上腹（胃）"] },
      { id: "character", question: "不適性質？", type: "select", options: ["悶痛", "絞痛（陣發性）", "燒灼感（火燒心）", "脹氣感", "針刺痛"] },
      { id: "timing", question: "與進食關係？", type: "select", options: ["進食後加重", "空腹時加重（進食緩解）", "與進食無關", "特定食物誘發"] },
      { id: "bowel", question: "排便狀況？", type: "select", options: ["正常", "便秘", "腹瀉", "交替性便秘/腹瀉", "血便/黏液便"] },
      { id: "onset", question: "急慢性？", type: "select", options: ["急性（<24h）", "亞急性（1-7天）", "慢性（>1個月）"] },
      { id: "associated", question: "合併症狀？", type: "multiselect", options: ["噁心/嘔吐", "發燒", "食慾不振", "體重下降", "皮膚/眼白變黃", "無"] },
    ],
    rosPositives: ["黃疸/皮膚黃", "排便習慣改變", "血便/黑便", "飯後噯氣"],
    pePoints: ["腹部觸診（壓痛位置）", "Murphy sign（膽囊）", "肝脾腫大", "腸音", "肛診（必要時）"],
    labPackages: ["liver", "cbc", "tumor"],
    commonDx: [
      { name_zh: "胃炎/消化性潰瘍", icd10: "K29.70" },
      { name_zh: "胃食道逆流", icd10: "K21.0" },
      { name_zh: "腸躁症", icd10: "K58.9" },
      { name_zh: "膽結石/膽囊炎", icd10: "K80.20" },
      { name_zh: "B型肝炎", icd10: "B18.1" },
    ],
    redFlags: ["急性腹膜炎（板狀腹）", "大量血便", "持續發燒＋右下腹痛（闌尾炎）", "黃疸＋發燒＋腹痛（膽管炎）"],
  },
  {
    complaint: "定期健檢",
    icon: "📋",
    hpiQuestions: [
      { id: "last_check", question: "上次健檢？", type: "select", options: ["超過3年", "1-3年前", "1年內"] },
      { id: "chronic", question: "已知慢性病？", type: "multiselect", options: ["高血壓", "糖尿病", "高血脂", "痛風", "慢性腎病", "B/C型肝炎", "無"] },
      { id: "family_hx", question: "家族重要病史？", type: "multiselect", options: ["心臟病", "腦中風", "糖尿病", "高血壓", "癌症（大腸/肝/胃）", "腎臟病", "無"] },
      { id: "lifestyle_smoke", question: "抽菸？", type: "select", options: ["不抽菸", "已戒菸", "抽菸（<10支/天）", "抽菸（≥10支/天）"] },
      { id: "lifestyle_drink", question: "喝酒？", type: "select", options: ["不喝酒", "偶爾喝", "每週喝酒（適量）", "每天喝酒"] },
      { id: "exercise", question: "運動習慣？", type: "select", options: ["規律運動（每週≥150分鐘）", "偶爾運動", "幾乎不運動"] },
    ],
    rosPositives: [],
    pePoints: ["血壓/心跳", "BMI/腰圍", "視力/聽力（老年）", "口腔檢查", "乳房檢查（女性）"],
    labPackages: ["vitals", "cbc", "glucose", "lipids", "uric_acid", "renal", "liver"],
    commonDx: [
      { name_zh: "一般健康檢查", icd10: "Z00.00" },
      { name_zh: "代謝症候群", icd10: "E88.81" },
      { name_zh: "高血壓前期", icd10: "R03.0" },
      { name_zh: "糖尿病前期", icd10: "R73.09" },
    ],
    redFlags: [],
  },
  {
    complaint: "高血壓追蹤",
    icon: "📈",
    hpiQuestions: [
      { id: "bp_home", question: "在家自測血壓？", type: "select", options: ["有，控制良好（<130/80）", "有，控制不佳", "沒有在家測"] },
      { id: "compliance", question: "藥物服用狀況？", type: "select", options: ["規律服藥", "偶爾忘記", "不規律服藥", "自行停藥"] },
      { id: "side_effects", question: "藥物副作用？", type: "multiselect", options: ["咳嗽（ACEi）", "腳踝水腫（CCB）", "疲倦", "頭暈", "無不適"] },
      { id: "lifestyle", question: "生活型態改變？", type: "multiselect", options: ["減少鹽分攝取", "規律運動", "減重", "戒菸/限酒", "無改變"] },
      { id: "symptoms", question: "目前症狀？", type: "multiselect", options: ["頭痛/頭脹", "頭暈", "胸悶", "無不適"] },
    ],
    rosPositives: ["頭痛（尤其早晨）", "視力改變", "胸悶"],
    pePoints: ["血壓（兩手）", "眼底檢查（視網膜）", "心音（S3/S4）", "足背動脈"],
    labPackages: ["vitals", "renal", "electrolytes", "lipids"],
    commonDx: [
      { name_zh: "原發性高血壓（控制中）", icd10: "I10" },
      { name_zh: "高血壓性心臟病", icd10: "I11.9" },
      { name_zh: "高血壓腎病", icd10: "I12.9" },
    ],
    redFlags: ["血壓>180/120（高血壓危機）", "合併胸痛/視力改變/神經症狀"],
  },
  {
    complaint: "糖尿病追蹤",
    icon: "🍬",
    hpiQuestions: [
      { id: "control", question: "血糖控制如何？", type: "select", options: ["良好（空腹<130，HbA1c<7%）", "尚可", "控制不佳（常超標）"] },
      { id: "compliance", question: "藥物/胰島素服用狀況？", type: "select", options: ["規律使用", "偶爾忘記", "不規律", "自行調整劑量"] },
      { id: "hypoglycemia", question: "曾發生低血糖？", type: "select", options: ["無", "偶爾（輕微）", "有（需旁人協助）"] },
      { id: "complications", question: "已知糖尿病併發症？", type: "multiselect", options: ["視網膜病變", "腎病變（蛋白尿）", "神經病變（手腳麻木）", "足部潰瘍", "無"] },
      { id: "diet", question: "飲食控制？", type: "select", options: ["嚴格控制", "大致控制", "很難控制"] },
    ],
    rosPositives: ["視力模糊", "手腳麻木/刺痛", "足部傷口"],
    pePoints: ["足部觸診（足背動脈/感覺）", "眼底（選做）", "BMI", "注射部位（胰島素）"],
    labPackages: ["glucose", "renal", "lipids", "liver"],
    commonDx: [
      { name_zh: "第2型糖尿病", icd10: "E11.9" },
      { name_zh: "糖尿病性腎病", icd10: "E11.21" },
      { name_zh: "糖尿病性視網膜病變", icd10: "E11.319" },
    ],
    redFlags: ["HbA1c>10%（控制極差）", "足部潰瘍感染", "尿蛋白急速增加"],
  },
  {
    complaint: "感冒/上呼吸道感染",
    icon: "🤧",
    hpiQuestions: [
      { id: "onset", question: "何時開始？", type: "select", options: ["今天", "1-2天", "3-5天", "超過1週"] },
      { id: "symptoms", question: "主要症狀？", type: "multiselect", options: ["流鼻水", "鼻塞", "喉嚨痛", "咳嗽", "發燒", "全身痠痛", "頭痛", "聲音沙啞"] },
      { id: "fever", question: "有發燒嗎？", type: "select", options: ["無發燒", "低燒（37.5-38°C）", "中燒（38-39°C）", "高燒（>39°C）"] },
      { id: "cough", question: "咳嗽狀況？", type: "select", options: ["無咳嗽", "乾咳", "有痰（白色）", "有痰（黃/綠色）", "嚴重咳嗽影響睡眠"] },
      { id: "exposure", question: "接觸史？", type: "multiselect", options: ["家人有相同症狀", "職場/學校群聚", "近期旅遊史", "無特殊接觸史"] },
      { id: "vaccine", question: "流感疫苗？", type: "select", options: ["今年已接種", "未接種", "不清楚"] },
    ],
    rosPositives: ["呼吸困難/喘", "胸痛", "耳朵痛/分泌物", "脖子僵硬"],
    pePoints: ["咽喉（發紅/分泌物/扁桃腺）", "頸部淋巴結", "鼻腔", "呼吸音（排除肺炎）"],
    labPackages: ["vitals"],
    commonDx: [
      { name_zh: "急性上呼吸道感染（感冒）", icd10: "J06.9" },
      { name_zh: "急性咽炎", icd10: "J02.9" },
      { name_zh: "急性扁桃腺炎", icd10: "J03.90" },
      { name_zh: "流行性感冒", icd10: "J11.1" },
      { name_zh: "急性鼻竇炎", icd10: "J01.90" },
    ],
    redFlags: ["呼吸困難/喘鳴", "高燒持續>3天", "頸部僵硬（腦膜炎）", "嚴重喉嚨腫脹（會厭炎）"],
  },
  {
    complaint: "發燒",
    icon: "🌡️",
    hpiQuestions: [
      { id: "onset", question: "何時開始發燒？", type: "select", options: ["今天", "1-2天", "3-5天", "超過1週"] },
      { id: "temp", question: "最高體溫？", type: "select", options: ["37.5-38°C（低燒）", "38-39°C（中燒）", "39-40°C（高燒）", ">40°C（超高燒）"] },
      { id: "pattern", question: "發燒型態？", type: "select", options: ["持續性發燒", "間歇性（退燒後再燒）", "每天固定時間發燒", "早上低/下午高"] },
      { id: "chills", question: "合併畏寒/寒顫？", type: "select", options: ["有明顯寒顫", "輕微畏寒", "無"] },
      { id: "focus", question: "有無感染源？", type: "multiselect", options: ["咳嗽/喉嚨痛（上呼吸道）", "解尿灼熱/頻尿（泌尿道）", "腹痛/腹瀉（腸胃）", "皮膚紅腫傷口", "旅遊史（國外）", "無明顯感染源"] },
      { id: "contact", question: "接觸史？", type: "select", options: ["無特殊", "家人/同事相似症狀", "近期住院/醫療接觸", "蚊蟲叮咬"] },
    ],
    rosPositives: ["頸部僵硬", "皮疹", "咳嗽/呼吸困難", "解尿症狀", "腹痛"],
    pePoints: ["體溫（精確測量）", "皮膚（玫瑰疹/出血點）", "咽部/扁桃腺", "淋巴結", "腹部壓痛"],
    labPackages: ["vitals", "cbc"],
    commonDx: [
      { name_zh: "急性上呼吸道感染", icd10: "J06.9" },
      { name_zh: "泌尿道感染", icd10: "N39.0" },
      { name_zh: "流行性感冒", icd10: "J11.1" },
      { name_zh: "腸胃炎", icd10: "K59.1" },
      { name_zh: "發燒待查", icd10: "R50.9" },
    ],
    redFlags: ["持續高燒>39°C無退燒", "出血點/瘀斑（敗血症）", "頸部僵硬+發燒", "意識改變"],
  },
  {
    complaint: "咳嗽",
    icon: "😮‍💨",
    hpiQuestions: [
      { id: "duration", question: "咳嗽多久了？", type: "select", options: ["3週內（急性）", "3-8週（亞急性）", "超過8週（慢性）"] },
      { id: "character", question: "咳嗽性質？", type: "select", options: ["乾咳（無痰）", "濕咳（有痰）", "夜間咳嗽為主", "運動後加重", "飯後咳嗽"] },
      { id: "sputum", question: "痰液顏色？", type: "select", options: ["無痰", "白色/透明", "黃色/綠色（感染）", "粉紅色/帶血（需注意）"] },
      { id: "trigger", question: "誘發因素？", type: "multiselect", options: ["冷空氣", "灰塵/過敏原", "說話/運動", "躺下時加重", "吸菸環境", "無明顯誘因"] },
      { id: "medications", question: "目前服用的藥物？", type: "multiselect", options: ["ACEI（如perindopril）", "其他降壓藥", "不清楚", "無相關藥物"] },
      { id: "severity", question: "嚴重程度？", type: "scale" },
    ],
    rosPositives: ["發燒/畏寒", "體重下降（慢性）", "呼吸困難", "夜間盜汗（結核？）", "胃酸逆流症狀"],
    pePoints: ["呼吸音（喘鳴/濕囉音）", "咽部", "鼻腔（後鼻滴流）", "心音", "SpO2"],
    labPackages: ["vitals", "cbc"],
    commonDx: [
      { name_zh: "急性支氣管炎", icd10: "J20.9" },
      { name_zh: "氣喘", icd10: "J45.909" },
      { name_zh: "胃食道逆流引起咳嗽", icd10: "K21.0" },
      { name_zh: "後鼻滴流症候群", icd10: "J31.0" },
      { name_zh: "ACEi引起咳嗽", icd10: "T46.4X5A" },
    ],
    redFlags: ["咳血", "呼吸困難+低血氧", "體重下降+慢性咳嗽（肺癌/結核）", "發燒+黃痰+呼吸困難（肺炎）"],
  },
  {
    complaint: "腹瀉/腸胃炎",
    icon: "🚽",
    hpiQuestions: [
      { id: "onset", question: "何時開始？", type: "select", options: ["今天（<12小時）", "1-2天", "3-5天", "超過1週"] },
      { id: "frequency", question: "每天腹瀉幾次？", type: "select", options: ["2-3次", "4-6次", "7-10次", "10次以上"] },
      { id: "character", question: "糞便性狀？", type: "select", options: ["水便", "稀便", "帶黏液", "帶血（血便）", "油脂便/惡臭"] },
      { id: "associated", question: "合併症狀？", type: "multiselect", options: ["噁心/嘔吐", "腹痛（絞痛）", "發燒", "里急後重（腹瀉感卻排不出）", "無"] },
      { id: "food", question: "飲食史（近24-48小時）？", type: "multiselect", options: ["外食（可疑食物）", "生食/半生熟", "生水/飲料", "共餐者也腹瀉", "無可疑飲食"] },
      { id: "dehydration", question: "脫水症狀？", type: "multiselect", options: ["口乾舌燥", "尿量減少", "頭暈/虛弱", "無明顯脫水"] },
    ],
    rosPositives: ["發燒", "肛門疼痛", "里急後重", "近期抗生素使用（偽膜性腸炎）"],
    pePoints: ["腹部壓痛（位置）", "腸音（亢進）", "皮膚彈性（脫水）", "直立性低血壓"],
    labPackages: ["vitals", "electrolytes"],
    commonDx: [
      { name_zh: "急性腸胃炎（病毒性）", icd10: "K59.1" },
      { name_zh: "食物中毒", icd10: "A05.9" },
      { name_zh: "細菌性腸炎", icd10: "A04.9" },
      { name_zh: "腸躁症", icd10: "K58.9" },
    ],
    redFlags: ["血便+發燒（細菌性）", "嚴重脫水/意識改變", "持續>1週腹瀉", "黑便（上消化道出血）"],
  },
  {
    complaint: "皮膚問題/皮疹",
    icon: "🔴",
    hpiQuestions: [
      { id: "onset", question: "何時出現？", type: "select", options: ["今天", "1-3天", "1週", "1個月以上（慢性）"] },
      { id: "location", question: "位置？", type: "multiselect", options: ["臉部", "頸部/胸前", "背部", "四肢", "手/足", "腹部", "全身"] },
      { id: "character", question: "皮疹性質？", type: "select", options: ["紅疹（紅斑）", "丘疹（小突起）", "水泡/膿皰", "蕁麻疹（移動性紅腫）", "脫屑", "只有搔癢無皮疹"] },
      { id: "itch", question: "搔癢程度？", type: "scale" },
      { id: "trigger", question: "可能誘因？", type: "multiselect", options: ["新的食物", "新的藥物", "接觸物（洗劑/植物/金屬）", "壓力/睡眠不足", "日曬", "無明顯誘因"] },
      { id: "systemic", question: "全身症狀？", type: "multiselect", options: ["發燒", "喉嚨腫脹/呼吸困難（過敏反應！）", "關節痛", "無"] },
    ],
    rosPositives: ["過敏病史（食物/藥物/環境）", "家族過敏史", "近期新藥", "喉嚨腫脹/呼吸困難"],
    pePoints: ["皮疹分布與型態", "黏膜（口腔/結膜）", "淋巴結", "喉嚨水腫評估"],
    labPackages: ["vitals", "cbc"],
    commonDx: [
      { name_zh: "蕁麻疹", icd10: "L50.9" },
      { name_zh: "接觸性皮膚炎", icd10: "L23.9" },
      { name_zh: "異位性皮膚炎", icd10: "L20.9" },
      { name_zh: "帶狀疱疹", icd10: "B02.9" },
      { name_zh: "藥物疹", icd10: "L27.0" },
    ],
    redFlags: ["喉嚨腫脹/呼吸困難（過敏性休克）", "皮膚剝落/口腔潰瘍（SJS/TEN）", "高燒+皮疹+黏膜病變"],
  },
  {
    complaint: "腰背痛",
    icon: "🦴",
    hpiQuestions: [
      { id: "onset", question: "何時開始？如何發生？", type: "select", options: ["突然發作（搬重物/扭傷）", "逐漸開始（數天）", "慢性（>3個月）", "不清楚"] },
      { id: "location", question: "疼痛位置？", type: "multiselect", options: ["下腰部（腰椎）", "上背部（胸椎）", "單側（左）", "單側（右）", "中央", "放射至臀部/大腿/小腿"] },
      { id: "character", question: "疼痛性質？", type: "select", options: ["痠痛/鈍痛（肌肉）", "尖銳放電感（神經）", "持續壓痛", "陣發性絞痛（腎結石）"] },
      { id: "aggravate", question: "加重/緩解因素？", type: "multiselect", options: ["彎腰加重", "坐姿加重/站立緩解", "臥床休息緩解", "活動後緩解（早晨僵硬）", "咳嗽/打噴嚏加重"] },
      { id: "neuro", question: "下肢神經症狀？", type: "multiselect", options: ["腳麻/刺痛", "腳無力", "大小便控制困難（緊急！）", "無神經症狀"] },
      { id: "severity", question: "疼痛程度？", type: "scale" },
    ],
    rosPositives: ["發燒/體重下降（感染/腫瘤）", "晨僵>1小時（僵直性脊椎炎）", "大小便失禁"],
    pePoints: ["壓痛點", "SLR直腿抬高測試", "肌力測試（下肢）", "反射（膝/跟腱）", "感覺測試"],
    labPackages: ["vitals", "renal", "uric_acid"],
    commonDx: [
      { name_zh: "急性腰椎拉傷", icd10: "S39.012A" },
      { name_zh: "腰椎間盤突出", icd10: "M51.16" },
      { name_zh: "腰椎退化性關節炎", icd10: "M47.816" },
      { name_zh: "腎結石（腰側絞痛）", icd10: "N20.0" },
      { name_zh: "坐骨神經痛", icd10: "M54.4" },
    ],
    redFlags: ["大小便失控（馬尾症候群，急診！）", "發燒+脊椎壓痛（脊椎炎）", "不明原因體重下降+背痛（轉移性腫瘤）"],
  },
  {
    complaint: "泌尿道症狀",
    icon: "🫗",
    hpiQuestions: [
      { id: "symptoms", question: "主要症狀？", type: "multiselect", options: ["解尿灼熱/疼痛", "頻尿", "急尿（憋不住）", "血尿", "排尿困難（男性）", "夜尿增加"] },
      { id: "onset", question: "何時開始？", type: "select", options: ["今天", "1-3天", "超過1週"] },
      { id: "fever", question: "有發燒嗎？", type: "select", options: ["無發燒", "低燒", "高燒（可能腎盂腎炎！）"] },
      { id: "flank", question: "腰側疼痛？", type: "select", options: ["無", "輕微", "明顯（腰側叩擊痛）"] },
      { id: "sex", question: "性別特定問題", type: "select", options: ["分泌物異常（女性）", "前列腺症狀（男性）", "近期性行為", "不適用"] },
      { id: "recurrent", question: "是否反覆發作？", type: "select", options: ["第一次", "一年內超過2次（反覆性UTI）", "是慢性問題"] },
    ],
    rosPositives: ["發燒/畏寒（腎盂腎炎）", "腰側叩擊痛", "懷孕可能"],
    pePoints: ["恥骨上壓痛", "腰側叩擊痛（CVA tenderness）", "尿液外觀（混濁/血尿）"],
    labPackages: ["vitals", "renal"],
    commonDx: [
      { name_zh: "急性膀胱炎（UTI）", icd10: "N30.00" },
      { name_zh: "急性腎盂腎炎", icd10: "N10" },
      { name_zh: "尿道炎", icd10: "N34.1" },
      { name_zh: "良性前列腺增生", icd10: "N40.0" },
    ],
    redFlags: ["高燒+腰側叩擊痛（腎盂腎炎）", "懷孕婦女UTI", "男性UTI（需排除前列腺炎/結構異常）"],
  },
  {
    complaint: "失眠/睡眠障礙",
    icon: "😴",
    hpiQuestions: [
      { id: "pattern", question: "失眠型態？", type: "multiselect", options: ["難以入睡（>30分鐘）", "容易醒/無法再入睡", "早醒（比預定早2小時以上）", "睡多但仍疲勞"] },
      { id: "duration", question: "持續多久？", type: "select", options: ["1-2週（急性）", "1-3個月（亞急性）", "超過3個月（慢性）"] },
      { id: "frequency", question: "每週幾天失眠？", type: "select", options: ["1-2天", "3-4天", "幾乎每天"] },
      { id: "trigger", question: "誘發因素？", type: "multiselect", options: ["壓力/焦慮", "環境改變", "睡前使用手機/螢幕", "咖啡因/酒精", "慢性疼痛", "夜尿頻繁", "無明顯誘因"] },
      { id: "mood", question: "情緒狀況？", type: "select", options: ["情緒正常", "焦慮/緊張", "情緒低落/憂鬱傾向", "情緒波動大"] },
      { id: "daytime", question: "白天功能影響？", type: "multiselect", options: ["白天嗜睡", "注意力下降", "記憶力變差", "工作/學習表現受影響", "影響不大"] },
    ],
    rosPositives: ["打鼾/呼吸中止（睡眠呼吸中止症）", "腿部不適/想動腿（不寧腿）", "憂鬱/焦慮症狀"],
    pePoints: ["甲狀腺觸診（甲亢？）", "BMI（睡眠呼吸中止風險）", "咽部（扁桃腺/下咽結構）"],
    labPackages: ["thyroid", "cbc"],
    commonDx: [
      { name_zh: "失眠症", icd10: "G47.00" },
      { name_zh: "焦慮症相關失眠", icd10: "F41.9" },
      { name_zh: "憂鬱症相關睡眠障礙", icd10: "F32.9" },
      { name_zh: "睡眠呼吸中止症（疑似）", icd10: "G47.33" },
    ],
    redFlags: ["嚴重憂鬱+有自殺意念", "呼吸中止+白天嗜睡+工作事故風險", "猝倒/睡眠麻痺（猝睡症）"],
  },
  {
    complaint: "慢性腎臟病追蹤",
    icon: "🫘",
    hpiQuestions: [
      { id: "ckd_stage", question: "已知 CKD 分期？", type: "select", options: ["G1（eGFR≥90）", "G2（60-89）", "G3a（45-59）", "G3b（30-44）", "G4（15-29）", "G5（<15）", "尚未分期"] },
      { id: "symptoms", question: "近期症狀？", type: "multiselect", options: ["無明顯症狀", "下肢水腫", "夜尿增多", "倦怠/疲勞", "食慾不振/噁心", "呼吸喘", "皮膚搔癢"] },
      { id: "comorbid", question: "共病？", type: "multiselect", options: ["高血壓", "糖尿病", "高尿酸血症", "心臟病", "無共病"] },
      { id: "medication", question: "目前用藥？", type: "multiselect", options: ["降壓藥（ACEI/ARB）", "降血糖藥", "利尿劑", "磷酸鹽結合劑", "鐵劑/EPO", "目前無用藥"] },
      { id: "diet", question: "飲食控制？", type: "select", options: ["低鈉低磷飲食執行中", "部分執行", "尚未執行"] },
      { id: "labs", question: "上次追蹤 eGFR？", type: "text" },
    ],
    rosPositives: ["高血壓（CKD 主要病因）", "糖尿病（CKD 主要共病）", "貧血（促紅素缺乏）", "骨骼疼痛（腎性骨病）"],
    pePoints: ["血壓（RAS 阻斷劑治療目標 <130/80）", "下肢水腫程度（1+~4+）", "皮膚：尿毒素沉積/蒼白", "心肺：體液過載徵象"],
    labPackages: ["renal", "electrolytes", "cbc", "glucose"],
    commonDx: [
      { name_zh: "慢性腎臟病（需標明分期）", icd10: "N18.9" },
      { name_zh: "CKD G3a", icd10: "N18.3" },
      { name_zh: "CKD G4", icd10: "N18.4" },
      { name_zh: "CKD G5", icd10: "N18.5" },
      { name_zh: "糖尿病腎病變", icd10: "E11.65" },
    ],
    redFlags: ["eGFR 快速下降（>5 mL/min/年）", "高鉀血症（K+>6.0 mEq/L）", "尿毒症徵象（噁心/嘔吐/意識混亂）", "需緊急透析評估"],
  },
  {
    complaint: "COVID-19/呼吸道感染",
    icon: "🦠",
    hpiQuestions: [
      { id: "test", question: "快篩/PCR 結果？", type: "select", options: ["快篩陽性", "快篩陰性（症狀疑似）", "PCR 確認陽性", "未檢測"] },
      { id: "onset", question: "發病時間？", type: "select", options: ["今天", "1-2 天前", "3-5 天前", "超過 5 天"] },
      { id: "symptoms", question: "主要症狀？", type: "multiselect", options: ["發燒", "喉嚨痛", "咳嗽（乾）", "流鼻水/鼻塞", "全身痠痛", "頭痛", "倦怠", "腹瀉", "味覺/嗅覺喪失", "呼吸困難"] },
      { id: "spo2", question: "SpO₂（若有量測）？", type: "text" },
      { id: "vaccine", question: "COVID 疫苗接種史？", type: "select", options: ["3劑以上已接種", "2劑已接種", "1劑", "未接種", "不確定"] },
      { id: "risk", question: "高風險族群？", type: "multiselect", options: ["65 歲以上", "免疫低下", "慢性腎臟病", "糖尿病", "心血管疾病", "無高風險因素"] },
    ],
    rosPositives: ["SpO₂ <95%（需監測）", "胸悶/胸痛", "意識改變"],
    pePoints: ["SpO₂（血氧）", "呼吸音（有無濕囉音）", "喉部（紅腫/分泌物）", "頸部淋巴結"],
    labPackages: ["cbc", "liver"],
    commonDx: [
      { name_zh: "COVID-19 確診（輕症）", icd10: "U07.1" },
      { name_zh: "COVID-19（PCR 確認）", icd10: "U07.1" },
      { name_zh: "急性上呼吸道感染", icd10: "J06.9" },
      { name_zh: "COVID-19 後遺症", icd10: "U09.9" },
    ],
    redFlags: ["SpO₂ <94%（需住院評估）", "呼吸困難 + 胸痛", "意識改變/混亂", "高危族群症狀惡化（老年/免疫低下）"],
  },
];

// ── 身體檢查模板 ──────────────────────────────────────────────

export interface PESystem {
  id: string;
  label: string;
  icon: string;
  findings: string[];    // common normal findings
  abnormals: string[];   // common abnormal findings to look for
}

export const PE_SYSTEMS: PESystem[] = [
  {
    id: "general",
    label: "一般外觀",
    icon: "👤",
    findings: ["外觀良好", "神智清楚，合作", "無急性病容"],
    abnormals: ["倦怠/虛弱", "急性病容", "蒼白", "黃疸", "脫水貌"],
  },
  {
    id: "vitals",
    label: "生命徵象",
    icon: "🫀",
    findings: ["體溫正常", "血壓正常", "心跳規律正常", "SpO2 ≥96%"],
    abnormals: ["發燒", "高血壓", "低血壓", "心跳過速", "心跳過慢", "低血氧"],
  },
  {
    id: "heent",
    label: "頭眼耳鼻喉",
    icon: "👁️",
    findings: ["眼結膜無蒼白", "鞏膜無黃染", "咽部無紅腫", "無淋巴結腫大"],
    abnormals: ["結膜蒼白（貧血）", "鞏膜黃染（黃疸）", "扁桃腺腫大", "頸部淋巴結腫大", "甲狀腺腫大"],
  },
  {
    id: "chest",
    label: "胸部/心肺",
    icon: "🫁",
    findings: ["呼吸音清晰對稱", "心律整齊", "無異常心音/雜音"],
    abnormals: ["喘鳴音", "濕囉音（水泡音）", "心雜音", "心律不整", "頸靜脈擴張"],
  },
  {
    id: "abdomen",
    label: "腹部",
    icon: "🫃",
    findings: ["腹部柔軟", "無壓痛", "腸音正常", "無肝脾腫大"],
    abnormals: ["局部壓痛", "肌肉防禦", "肝腫大", "脾腫大", "腸音亢進/減弱", "Murphy sign (+)"],
  },
  {
    id: "extremities",
    label: "四肢/皮膚",
    icon: "🦵",
    findings: ["無水腫", "末梢循環良好", "皮膚無異常"],
    abnormals: ["下肢水腫", "足部潰瘍", "關節紅腫", "皮下痛風石", "杵狀指"],
  },
  {
    id: "neuro",
    label: "神經學",
    icon: "🧠",
    findings: ["步態正常", "四肢肌力正常", "感覺正常"],
    abnormals: ["步態不穩", "肢體無力", "感覺喪失/麻木", "深部腱反射異常", "巴賓斯基陽性"],
  },
];

// ── 常見處方模板（台灣家醫科）────────────────────────────────

export interface PrescriptionTemplate {
  indication: string;       // 適應症
  drug: string;
  generic: string;
  dose: string;
  frequency: string;
  route: string;
  note?: string;
  nhiCode?: string;         // 健保代碼
}

export const PRESCRIPTION_TEMPLATES: Record<string, PrescriptionTemplate[]> = {
  "高血壓": [
    { indication: "高血壓第一線", drug: "Amlodipine", generic: "氨氯地平", dose: "5mg", frequency: "QD", route: "PO", note: "可能腳踝水腫", nhiCode: "BA01" },
    { indication: "高血壓/心臟保護", drug: "Losartan", generic: "氯沙坦", dose: "50mg", frequency: "QD", route: "PO", note: "腎功能不佳時需調整", nhiCode: "BA02" },
    { indication: "高血壓/心跳過速", drug: "Metoprolol", generic: "美托洛爾", dose: "25-50mg", frequency: "BID", route: "PO", note: "氣喘禁用", nhiCode: "BA03" },
    { indication: "高血壓/利尿", drug: "Hydrochlorothiazide", generic: "氫氯噻嗪", dose: "12.5mg", frequency: "QD", route: "PO", note: "監測電解質", nhiCode: "BA04" },
  ],
  "糖尿病": [
    { indication: "DM 第一線", drug: "Metformin", generic: "二甲雙胍", dose: "500mg", frequency: "BID（隨餐）", route: "PO", note: "腎功能下降時需調整/停藥", nhiCode: "DD01" },
    { indication: "DM 控制不佳", drug: "Glipizide", generic: "格列吡嗪", dose: "5mg", frequency: "QD（早餐前）", route: "PO", note: "注意低血糖", nhiCode: "DD02" },
    { indication: "DM 心腎保護", drug: "Empagliflozin (Jardiance)", generic: "恩格列淨", dose: "10mg", frequency: "QD", route: "PO", note: "注意泌尿道感染", nhiCode: "DD03" },
  ],
  "高血脂": [
    { indication: "高血脂第一線", drug: "Atorvastatin", generic: "阿托伐他汀", dose: "20mg", frequency: "QN（睡前）", route: "PO", note: "監測肝功能/肌肉症狀", nhiCode: "DC01" },
    { indication: "TG偏高", drug: "Fenofibrate", generic: "非諾貝特", dose: "160mg", frequency: "QD（隨餐）", route: "PO", note: "腎功能下降時慎用", nhiCode: "DC02" },
  ],
  "痛風急性發作": [
    { indication: "急性痛風", drug: "Colchicine", generic: "秋水仙鹼", dose: "0.5mg", frequency: "Q1H x2次，後改TID", route: "PO", note: "腎功能不佳減量", nhiCode: "MM01" },
    { indication: "痛風止痛", drug: "Indomethacin", generic: "吲哚美辛", dose: "25-50mg", frequency: "TID（隨餐）", route: "PO", note: "消化性潰瘍禁用", nhiCode: "MM02" },
    { indication: "長期降尿酸", drug: "Allopurinol", generic: "別嘌醇", dose: "100mg（初始）", frequency: "QD", route: "PO", note: "急性發作期不調整劑量", nhiCode: "MM03" },
  ],
  "感冒/上呼吸道感染": [
    { indication: "退燒/止痛", drug: "Acetaminophen", generic: "乙醯氨酚", dose: "500-1000mg", frequency: "Q6-8H PRN", route: "PO", note: "肝病患者減量" },
    { indication: "止咳", drug: "Dextromethorphan", generic: "右美沙芬", dose: "15-30mg", frequency: "Q6-8H PRN", route: "PO" },
    { indication: "鼻塞/流鼻水", drug: "Chlorpheniramine", generic: "氯苯那敏", dose: "4mg", frequency: "Q8H PRN", route: "PO", note: "嗜睡，開車需注意" },
    { indication: "細菌性咽喉炎（A鏈球菌）", drug: "Amoxicillin", generic: "阿莫西林", dose: "500mg", frequency: "TID x 10天", route: "PO", note: "青黴素過敏者改用Azithromycin" },
  ],
  "發燒/感染": [
    { indication: "退燒", drug: "Acetaminophen", generic: "乙醯氨酚", dose: "500-1000mg", frequency: "Q6-8H PRN", route: "PO", note: "體溫>38.5°C 再用" },
    { indication: "退燒（備選）", drug: "Ibuprofen", generic: "布洛芬", dose: "400mg", frequency: "Q8H PRN", route: "PO", note: "空腹不宜，腎功能不佳禁用" },
    { indication: "泌尿道感染（簡單型）", drug: "Fosfomycin", generic: "磷黴素", dose: "3g", frequency: "單次", route: "PO", note: "女性非複雜型UTI首選" },
    { indication: "泌尿道感染（複雜型）", drug: "Levofloxacin", generic: "左氧氟沙星", dose: "500mg", frequency: "QD x 7天", route: "PO", note: "注意QT延長" },
  ],
  "咳嗽/支氣管炎": [
    { indication: "止咳（乾咳）", drug: "Dextromethorphan", generic: "右美沙芬", dose: "15-30mg", frequency: "Q6-8H PRN", route: "PO" },
    { indication: "袪痰", drug: "Ambroxol", generic: "氨溴索", dose: "30mg", frequency: "TID", route: "PO" },
    { indication: "支氣管擴張（氣喘發作）", drug: "Salbutamol MDI", generic: "沙丁胺醇", dose: "2puffs", frequency: "Q4-6H PRN", route: "吸入", note: "心跳過速需注意" },
    { indication: "氣喘控制（吸入類固醇）", drug: "Budesonide MDI", generic: "布地奈德", dose: "200mcg", frequency: "BID", route: "吸入", note: "使用後漱口" },
  ],
  "腹瀉/腸胃炎": [
    { indication: "急性腹瀉（止瀉）", drug: "Loperamide", generic: "洛哌丁胺", dose: "2mg", frequency: "每次腹瀉後，最多8mg/天", route: "PO", note: "血便/發燒時不用" },
    { indication: "電解質補充", drug: "Oral rehydration salts", generic: "口服電解質液", dose: "依脫水程度", frequency: "持續補充", route: "PO" },
    { indication: "腹絞痛", drug: "Buscopan", generic: "布斯可帕", dose: "10mg", frequency: "TID PRN", route: "PO" },
    { indication: "細菌性腸炎（旅行者腹瀉）", drug: "Azithromycin", generic: "阿奇黴素", dose: "500mg", frequency: "QD x 3天", route: "PO" },
  ],
  "皮膚/過敏": [
    { indication: "蕁麻疹/過敏（第二代抗組織胺）", drug: "Cetirizine", generic: "西替利嗪", dose: "10mg", frequency: "QD", route: "PO", note: "嗜睡較輕" },
    { indication: "蕁麻疹/過敏（較強效）", drug: "Hydroxyzine", generic: "羥嗪", dose: "25mg", frequency: "QHS", route: "PO", note: "嗜睡明顯" },
    { indication: "接觸性皮膚炎（輕中度）", drug: "Hydrocortisone cream 1%", generic: "氫化可體松乳膏", dose: "適量塗抹", frequency: "BID", route: "外用", note: "臉部不宜長期使用" },
    { indication: "嚴重過敏反應", drug: "Prednisolone", generic: "普賴松龍", dose: "20-40mg", frequency: "QD x 5-7天", route: "PO", note: "糖尿病患者血糖會升高" },
  ],
  "胃炎/消化性潰瘍": [
    { indication: "制酸/胃炎/GERD", drug: "Omeprazole", generic: "奧美拉唑", dose: "20mg", frequency: "QD（空腹）", route: "PO", note: "長期使用注意B12/鎂缺乏" },
    { indication: "制酸（H2 blocker）", drug: "Famotidine", generic: "法莫替丁", dose: "20mg", frequency: "BID", route: "PO" },
    { indication: "胃痙攣/脹氣", drug: "Buscopan", generic: "布斯可帕", dose: "10mg", frequency: "TID PRN", route: "PO" },
    { indication: "H. pylori三合療法（A）", drug: "Amoxicillin + Clarithromycin + PPI", generic: "", dose: "標準劑量", frequency: "BID x 14天", route: "PO", note: "需確認H.Pylori陽性" },
  ],
  "失眠": [
    { indication: "短期失眠（非苯二氮平類）", drug: "Zolpidem", generic: "唑吡坦", dose: "5-10mg", frequency: "QHS PRN", route: "PO", note: "不超過4週，老年人用5mg" },
    { indication: "失眠（褪黑激素受體促效劑）", drug: "Melatonin", generic: "褪黑激素", dose: "1-3mg", frequency: "睡前30分鐘", route: "PO", note: "較溫和，適合長期輕度失眠" },
    { indication: "焦慮相關失眠（短期）", drug: "Lorazepam", generic: "勞拉西泮", dose: "0.5-1mg", frequency: "QHS PRN", route: "PO", note: "有成癮性，謹慎使用" },
  ],
  "腰背痛": [
    { indication: "急性肌肉拉傷止痛", drug: "Ibuprofen", generic: "布洛芬", dose: "400mg", frequency: "TID（隨餐）", route: "PO", note: "有消化道病史慎用" },
    { indication: "肌肉鬆弛劑", drug: "Methocarbamol", generic: "美索巴莫", dose: "750mg", frequency: "TID", route: "PO", note: "嗜睡，避免開車" },
    { indication: "神經痛（坐骨神經）", drug: "Gabapentin", generic: "加巴噴丁", dose: "100-300mg", frequency: "TID", route: "PO", note: "從低劑量開始" },
  ],
};

// ── 衛教模板 ─────────────────────────────────────────────────

export const EDUCATION_TEMPLATES: Record<string, string[]> = {
  "高血壓": [
    "每日量血壓並記錄，建議早晨起床後安靜坐5分鐘再測量",
    "飲食減少鈉鹽攝取：每日<6公克（約1茶匙食鹽）",
    "避免高鹽食物：加工食品、醬菜、麵線、泡麵",
    "規律運動：每週150分鐘中等強度有氧運動（快走、游泳）",
    "戒菸限酒：男性每日<2個標準飲酒，女性<1個",
    "藥物切勿自行停藥，症狀改善不代表血壓正常",
  ],
  "糖尿病": [
    "建議每日記錄血糖（空腹＋飯後2小時）",
    "飲食採少量多餐，控制醣類攝取，優先選全穀類",
    "每日檢查足部：有無傷口、破皮、顏色異常",
    "規律運動：每週150分鐘，運動前後注意低血糖症狀",
    "定期追蹤：HbA1c每3個月、腎功能每6個月、眼底每年",
    "注射部位輪換，避免同一部位反覆注射",
  ],
  "痛風": [
    "急性發作期多喝水（每日>2000mL），幫助尿酸排泄",
    "避免高嘌呤食物：內臟（肝腎腦）、海鮮（蝦蟹貝蚵）、肉湯",
    "限制酒精，尤其是啤酒（嘌呤含量高）",
    "可適量食用豆腐（蔬菜蛋白，風險較低）",
    "目標尿酸：<6.0 mg/dL（有痛風石者<5.0 mg/dL）",
    "降尿酸藥物需長期服用，不可痛才吃",
  ],
  "高血脂": [
    "飲食減少飽和脂肪：少吃紅肉、全脂乳製品、油炸食物",
    "增加Omega-3攝取：深海魚（鮭魚、鯖魚）每週2-3次",
    "多吃高纖食物：燕麥、豆類、蔬菜水果",
    "規律有氧運動有助提升HDL（好的膽固醇）",
    "他汀類藥物服用期間若有肌肉痠痛無力，立即回診",
  ],
  "感冒": [
    "感冒為病毒感染，抗生素無效，以症狀治療為主",
    "多休息、多喝水（每日至少 2000mL）",
    "退燒建議：38.5°C以上再使用退燒藥，避免過度壓制發燒",
    "喉嚨痛：溫鹽水漱口可緩解，每天3-4次",
    "通常 7-10 天自然痊癒；若發燒超過 3 天或症狀加重請回診",
    "咳嗽超過 3 週請複診排除其他原因",
  ],
  "腹瀉": [
    "補充水分是最重要的：喝電解質飲料（運動飲料稀釋或ORS）",
    "飲食：BRAT原則（Banana香蕉、Rice白飯、Apple蘋果醬、Toast吐司）",
    "避免：乳製品、油膩食物、咖啡因、酒精",
    "洗手是預防傳播最有效的方法",
    "腹瀉期間避免準備他人食物",
    "若有血便、發燒超過39°C或嚴重脫水症狀，立即就醫",
  ],
  "失眠": [
    "固定睡眠時間：每天同一時間上床與起床，包括假日",
    "睡前 1 小時避免手機/電腦螢幕藍光",
    "臥室只用於睡眠，不在床上工作或看電視",
    "避免下午3點後喝咖啡因飲品",
    "睡前可做放鬆活動：溫水泡腳、深呼吸、伸展",
    "若擔心睡不著反而更難睡，可嘗試「矛盾意向法」：刻意讓自己保持清醒",
    "安眠藥僅短期輔助，CBT-I（認知行為治療）是慢性失眠首選",
  ],
  "腰背痛": [
    "急性期：前48小時可冰敷（每次15-20分鐘），之後改熱敷",
    "適度活動比臥床休息更有利恢復，避免長期臥床",
    "工作時注意姿勢：螢幕與眼睛同高，椅子有腰部支撐",
    "搬重物：彎膝蹲下再搬，不要彎腰直接搬",
    "核心肌群訓練（如橋式、鳥狗式）有助預防復發",
    "體重控制：每減少1kg，脊椎承受的力量減少4kg",
  ],
};

// ── 轉介建議 ─────────────────────────────────────────────────

export const REFERRAL_CRITERIA: Record<string, { specialty: string; criteria: string[] }> = {
  "腎臟科": {
    specialty: "腎臟科",
    criteria: ["eGFR <30 mL/min", "尿蛋白肌酸酐比 >300 mg/g", "急性腎損傷", "血尿合併蛋白尿"],
  },
  "心臟科": {
    specialty: "心臟科",
    criteria: ["不穩定型心絞痛", "心衰竭", "嚴重心律不整", "心雜音需進一步評估"],
  },
  "內分泌科": {
    specialty: "內分泌科",
    criteria: ["HbA1c>10%（控制極差）", "第1型糖尿病", "甲狀腺結節", "次發性高血壓"],
  },
  "腸胃科": {
    specialty: "腸胃科",
    criteria: ["血便/黑便", "不明原因體重下降", "吞嚥困難", "腹水"],
  },
  "神經科": {
    specialty: "神經科",
    criteria: ["新發生肢體無力/麻木", "突發性頭暈＋走路不穩", "癲癇發作", "失智症評估"],
  },
  "胸腔科": {
    specialty: "胸腔科",
    criteria: ["咳嗽>8週治療無效", "咳血（hemoptysis）", "不明原因呼吸困難", "疑似肺結核（夜間盜汗+慢性咳嗽）", "疑似肺癌（吸菸史+體重下降）"],
  },
  "骨科/復健科": {
    specialty: "骨科/復健科",
    criteria: ["保守治療>6週無效之腰背痛", "神經壓迫症狀（腳麻無力）", "疑似骨折", "嚴重退化性關節炎需評估置換"],
  },
  "泌尿科": {
    specialty: "泌尿科",
    criteria: ["反覆UTI（一年>3次）", "男性UTI（需排除前列腺炎）", "血尿（顯微/肉眼）持續", "腎結石>5mm或反覆發作"],
  },
  "皮膚科": {
    specialty: "皮膚科",
    criteria: ["慢性皮疹>4週治療無效", "疑似惡性皮膚病變（不對稱/邊界不規則/多色/>6mm）", "嚴重藥物疹（SJS/TEN）", "難治型異位性皮膚炎"],
  },
  "精神科/身心科": {
    specialty: "精神科",
    criteria: ["重度憂鬱（有自殺意念）", "慢性失眠（CBT-I評估）", "焦慮症影響日常功能", "疑似雙相情緒障礙"],
  },
};
