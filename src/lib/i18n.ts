export type Locale = "zh" | "en";

export const translations = {
  zh: {
    nav: {
      home: "首頁",
      analyze: "AI 分析",
      translate: "醫療翻譯",
      scan: "圖片掃描",
      login: "登入",
    },
    disclaimer: {
      banner:
        "⚠️ 本平台僅供參考，不構成醫療診斷。如有不適，請立即就醫。",
      modalTitle: "使用前請閱讀",
      modalBody:
        "本平台（ClinCalc）提供之所有資訊及 AI 分析結果，僅供一般健康參考之用，不得作為專業醫療建議、診斷或治療依據。\n\n使用本平台不能取代專業醫療人員的意見。若您有任何健康疑慮，請諮詢合格醫師或醫療機構。\n\n緊急狀況請撥打 119 或前往最近急診室。",
      agree: "我已了解，繼續使用",
    },
    home: {
      tagline: "臨床決策輔助平台・完全免費・無需安裝",
      headline1: "精準分析",
      headline2: "健康決策",
      sub: "結合 Gemini AI，支援圖片辨識、數據分析、醫療翻譯，幫助您更清楚了解自身健康狀況。",
      cta_analyze: "AI 分析",
      cta_translate: "醫療翻譯",
      cta_scan: "圖片掃描",
      features: {
        f1: { title: "完全免費", desc: "永久免費" },
        f2: { title: "AI 驅動", desc: "Gemini 支援" },
        f3: { title: "圖片辨識", desc: "自動填入數據" },
        f4: { title: "中英雙語", desc: "無縫切換" },
        f5: { title: "深色模式", desc: "護眼設計" },
      },
      sections: {
        analyze: {
          title: "AI 健康分析",
          desc: "描述症狀或輸入健康數值，Gemini AI 幫您解讀並提供建議方向。",
        },
        translate: {
          title: "醫療文件翻譯",
          desc: "中英互譯醫療報告、病歷、藥品說明，並附專業術語解釋。",
        },
        scan: {
          title: "報告圖片掃描",
          desc: "拍照上傳體檢報告，AI 自動辨識數值、標示異常、提供解讀。",
        },
      },
    },
    analyze: {
      title: "AI 健康分析",
      subtitle: "描述您的症狀或輸入健康數值，AI 將提供分析參考",
      placeholder:
        "請描述您的症狀、不適情況，或貼上健康數值...\n\n例如：最近血壓收縮壓 145，舒張壓 92，頭痛、容易疲勞，請幫我分析。",
      submit: "開始分析",
      submitting: "分析中...",
      result: "AI 分析結果",
      error: "分析失敗，請稍後再試",
      noKey: "尚未設定 Gemini API Key，請聯絡管理員",
    },
    translate: {
      title: "醫療文件翻譯",
      subtitle: "貼上醫療文字，AI 提供精確翻譯及術語解釋",
      placeholder: "請貼上需要翻譯的醫療文字...",
      direction: "翻譯方向",
      zh2en: "繁中 → 英文",
      en2zh: "英文 → 繁中",
      submit: "開始翻譯",
      submitting: "翻譯中...",
      result: "翻譯結果",
      error: "翻譯失敗，請稍後再試",
    },
    scan: {
      title: "報告圖片掃描",
      subtitle: "上傳體檢報告或藥品照片，AI 自動辨識內容並提供解讀",
      upload: "點擊或拖曳上傳圖片",
      uploadSub: "支援 JPG、PNG、WEBP（最大 10MB）",
      question: "您想了解什麼？（選填）",
      questionPlaceholder: "例如：這份報告哪些數值異常？這個藥有什麼副作用？",
      submit: "開始分析",
      submitting: "辨識中...",
      result: "AI 分析結果",
      error: "辨識失敗，請稍後再試",
    },
    common: {
      aiDisclaimer: "以上為 AI 參考資訊，不構成醫療診斷，如有疑慮請就醫。",
      copy: "複製",
      copied: "已複製",
      clear: "清除",
    },
  },
  en: {
    nav: {
      home: "Home",
      analyze: "AI Analysis",
      translate: "Medical Translation",
      scan: "Image Scan",
      login: "Login",
    },
    disclaimer: {
      banner:
        "⚠️ This platform is for reference only and does not constitute medical diagnosis. Consult a doctor if unwell.",
      modalTitle: "Please Read Before Use",
      modalBody:
        "All information and AI analysis provided by ClinCalc is for general health reference only and must not be used as professional medical advice, diagnosis, or treatment.\n\nUsing this platform is not a substitute for professional medical consultation. If you have any health concerns, please consult a qualified physician.\n\nFor emergencies, call 119 or visit the nearest emergency room.",
      agree: "I understand, continue",
    },
    home: {
      tagline: "Clinical Decision Support · Completely Free · No Installation",
      headline1: "Precise Analysis",
      headline2: "Health Decisions",
      sub: "Powered by Gemini AI — image recognition, data analysis, and medical translation to help you better understand your health.",
      cta_analyze: "AI Analysis",
      cta_translate: "Medical Translation",
      cta_scan: "Image Scan",
      features: {
        f1: { title: "Free Forever", desc: "No cost" },
        f2: { title: "AI Powered", desc: "Gemini AI" },
        f3: { title: "Image OCR", desc: "Auto-fill data" },
        f4: { title: "Bilingual", desc: "ZH / EN" },
        f5: { title: "Dark Mode", desc: "Eye-friendly" },
      },
      sections: {
        analyze: {
          title: "AI Health Analysis",
          desc: "Describe symptoms or input health values. Gemini AI interprets and provides directional suggestions.",
        },
        translate: {
          title: "Medical Translation",
          desc: "Translate medical reports, records, and drug info between Chinese and English with term explanations.",
        },
        scan: {
          title: "Report Image Scan",
          desc: "Upload a photo of your health report. AI extracts values, flags anomalies, and provides interpretation.",
        },
      },
    },
    analyze: {
      title: "AI Health Analysis",
      subtitle: "Describe your symptoms or input health values for AI analysis",
      placeholder:
        "Describe your symptoms or paste health values...\n\nExample: My blood pressure is 145/92, I have headaches and fatigue. Please analyze.",
      submit: "Analyze",
      submitting: "Analyzing...",
      result: "AI Analysis Result",
      error: "Analysis failed, please try again",
      noKey: "Gemini API Key not configured, please contact admin",
    },
    translate: {
      title: "Medical Translation",
      subtitle: "Paste medical text for accurate translation and term explanations",
      placeholder: "Paste the medical text to translate...",
      direction: "Direction",
      zh2en: "Chinese → English",
      en2zh: "English → Chinese",
      submit: "Translate",
      submitting: "Translating...",
      result: "Translation Result",
      error: "Translation failed, please try again",
    },
    scan: {
      title: "Report Image Scan",
      subtitle: "Upload a health report or medication photo for AI analysis",
      upload: "Click or drag to upload image",
      uploadSub: "JPG, PNG, WEBP supported (max 10MB)",
      question: "What would you like to know? (optional)",
      questionPlaceholder:
        "E.g. Which values are abnormal? What are the side effects of this medication?",
      submit: "Analyze",
      submitting: "Scanning...",
      result: "AI Analysis Result",
      error: "Scan failed, please try again",
    },
    common: {
      aiDisclaimer:
        "The above is AI-generated reference information. It does not constitute medical diagnosis. Consult a doctor if concerned.",
      copy: "Copy",
      copied: "Copied",
      clear: "Clear",
    },
  },
};

export type Translations = typeof translations.zh;
