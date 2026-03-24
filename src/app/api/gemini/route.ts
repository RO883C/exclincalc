import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (per-IP, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;       // max requests per window
const RATE_WINDOW = 60_000;  // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const MAX_TEXT_LENGTH = 8000;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB in base64 chars ≈ 13.3M

const SYSTEM_PROMPT = `你是 ClinCalc 的 AI 健康助理，幫助一般民眾理解健康數據、翻譯醫療文件、分析體檢報告。

核心原則：
1. 所有分析僅供參考，不構成醫療診斷或處方建議
2. 如有異常數值或嚴重症狀，必須建議就醫
3. 用淺顯易懂的語言，避免過度術語
4. 每次回應結尾加上：「⚠️ 本回應為 AI 參考資訊，不構成醫療診斷，如有疑慮請諮詢醫師。」
5. 不得提供具體藥物劑量建議或診斷結論`;

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "RATE_LIMIT", message: "請求過於頻繁，請稍後再試" },
      { status: 429 }
    );
  }

  // Content-Type check
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "INVALID_CONTENT_TYPE" }, { status: 400 });
  }

  // API key check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NO_API_KEY", message: "Gemini API Key 尚未設定，請聯絡管理員" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { type, text, imageBase64, imageMimeType, question, direction } = body as {
    type?: string;
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    question?: string;
    direction?: string;
  };

  // Validate type
  if (!["analyze", "translate", "scan"].includes(type || "")) {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }

  // Validate input sizes
  if (text && text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "TEXT_TOO_LONG", message: "文字超過長度限制" }, { status: 400 });
  }
  if (imageBase64 && imageBase64.length > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE", message: "圖片超過 10MB 限制" }, { status: 400 });
  }

  // Validate allowed MIME types
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (imageMimeType && !allowedMimes.includes(imageMimeType)) {
    return NextResponse.json({ error: "INVALID_MIME_TYPE" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = "";

    if (type === "analyze") {
      if (!text?.trim()) return NextResponse.json({ error: "EMPTY_INPUT" }, { status: 400 });
      prompt = `${SYSTEM_PROMPT}\n\n用戶提供的健康資訊：\n${text}\n\n請分析並給出易懂的健康建議。`;
      const result = await model.generateContent(prompt);
      return NextResponse.json({ result: result.response.text() });

    } else if (type === "translate") {
      if (!text?.trim()) return NextResponse.json({ error: "EMPTY_INPUT" }, { status: 400 });
      const dir = direction === "zh2en"
        ? "將以下繁體中文醫療文字精確翻譯為英文，並提供重要醫學術語中英對照表。"
        : "Translate the following English medical text to Traditional Chinese. Provide a glossary of important medical terms.";
      prompt = `${SYSTEM_PROMPT}\n\n${dir}\n\n原文：\n${text}`;
      const result = await model.generateContent(prompt);
      return NextResponse.json({ result: result.response.text() });

    } else if (type === "scan") {
      if (!imageBase64 || !imageMimeType) {
        return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 });
      }
      const q = typeof question === "string" && question.trim()
        ? question.trim()
        : "請分析報告內容，列出所有數值，標示異常項目，並用一般人看得懂的語言解釋，最後提出建議。";
      prompt = `${SYSTEM_PROMPT}\n\n用戶問題：${q}\n\n請分析上傳的醫療文件圖片。`;

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
      ]);
      return NextResponse.json({ result: result.response.text() });
    }
  } catch (err: unknown) {
    console.error("[Gemini API error]", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "GEMINI_ERROR", message: "AI 處理失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
