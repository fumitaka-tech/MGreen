import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY が設定されていません。.env.local に追加してください。"
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });
}

export async function generateJsonFromImage<T>(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  const text = result.response.text();
  if (!text) {
    throw new Error("AI からの応答が空でした");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("AI の応答を解析できませんでした");
  }
}
