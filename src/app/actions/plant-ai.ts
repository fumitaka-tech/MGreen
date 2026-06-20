"use server";

import { generateJsonFromImage } from "@/lib/gemini";
import type {
  PlantByNameAnalysis,
  PlantRegistrationAnalysis,
  PlantStatusAnalysis,
} from "@/types/plant-ai";

const REGISTRATION_PROMPT = `あなたは観葉植物・家庭菜園の専門家です。写真から植物を推定し、日本語で JSON のみを返してください。

{
  "suggestions": [
    {
      "nickname": "親しみやすいニックネーム案",
      "species_name": "植物の種名（一般名）",
      "confidence": "high または medium または low"
    }
  ],
  "care_guide": "育て方の要点（水やり・日当たり・土・温度など）を200文字程度",
  "current_status": "写真から見える現在の状態（葉の色、成長段階、元気さなど）を100文字程度",
  "recommendations": ["今すぐできるおすすめアクション1", "アクション2"]
}

ルール:
- suggestions は推定の信頼度が高い順に最大3件
- 断定せず「〜の可能性があります」という表現を使う
- 病気の診断や農薬の使用は推奨しない
- 不明な場合は confidence を low にする`;

function buildByNamePrompt(speciesName: string, nickname?: string) {
  const nameLine = nickname
    ? `植物名: ${speciesName}（ニックネーム: ${nickname}）`
    : `植物名: ${speciesName}`;

  return `あなたは観葉植物・家庭菜園の専門家です。
ユーザーが指定した植物名と写真をもとに、日本語で JSON のみを返してください。

${nameLine}

{
  "suggested_nickname": "親しみやすいニックネーム案（未入力の場合に使う）",
  "care_guide": "この植物の育て方の要点（水やり・日当たり・土・温度など）を200文字程度",
  "current_status": "写真に写っているこの植物の現在の状態。指定名の植物として見た場合の様子を100〜200文字",
  "recommendations": ["今すぐできるおすすめアクション1", "アクション2"]
}

ルール:
- 指定された植物名を前提に育て方を答える
- 写真の見た目が指定植物と一致しない可能性がある場合は current_status でその旨を伝える
- 断定せず「〜の可能性があります」という表現を使う
- 病気の診断や農薬の使用は推奨しない`;
}

function buildStatusPrompt(plant?: {
  nickname?: string;
  species_name?: string;
}) {
  const plantContext =
    plant?.species_name || plant?.nickname
      ? `\nこの植物は「${plant.nickname ?? plant.species_name}」${
          plant.species_name && plant.nickname
            ? `（${plant.species_name}）`
            : ""
        }です。`
      : "";

  return `あなたは観葉植物・家庭菜園の専門家です。${plantContext}
写真から植物の現在の状態を推定し、日本語で JSON のみを返してください。

{
  "current_status": "写真から見える状態の説明（100〜200文字）",
  "recommendations": ["今後のおすすめアクション1", "アクション2", "アクション3"],
  "care_tips": "水やり・日当たり・手入れのヒント（100文字程度）"
}

ルール:
- 断定せず「〜の可能性があります」という表現を使う
- 病気の診断や農薬の使用は推奨しない
- 具体的で実行しやすいアドバイスにする`;
}

function validateRegistrationAnalysis(
  data: PlantRegistrationAnalysis
): PlantRegistrationAnalysis {
  if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
    throw new Error("植物名の候補を取得できませんでした");
  }

  return {
    suggestions: data.suggestions.slice(0, 3).map((s) => ({
      nickname: s.nickname?.trim() || "名前未設定",
      species_name: s.species_name?.trim() || "不明",
      confidence: s.confidence ?? "low",
    })),
    care_guide: data.care_guide?.trim() || "",
    current_status: data.current_status?.trim() || "",
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations.filter(Boolean)
      : [],
  };
}

function validateByNameAnalysis(data: PlantByNameAnalysis): PlantByNameAnalysis {
  return {
    suggested_nickname: data.suggested_nickname?.trim() || "",
    care_guide: data.care_guide?.trim() || "",
    current_status: data.current_status?.trim() || "",
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations.filter(Boolean)
      : [],
  };
}

function validateStatusAnalysis(data: PlantStatusAnalysis): PlantStatusAnalysis {
  return {
    current_status: data.current_status?.trim() || "",
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations.filter(Boolean)
      : [],
    care_tips: data.care_tips?.trim() || "",
  };
}

export async function analyzePlantImageForRegistration(
  imageBase64: string,
  mimeType: string
): Promise<PlantRegistrationAnalysis> {
  if (!imageBase64) throw new Error("画像が指定されていません");

  const raw = await generateJsonFromImage<PlantRegistrationAnalysis>(
    REGISTRATION_PROMPT,
    imageBase64,
    mimeType
  );

  return validateRegistrationAnalysis(raw);
}

export async function analyzePlantByNameForRegistration(
  imageBase64: string,
  mimeType: string,
  speciesName: string,
  nickname?: string
): Promise<PlantRegistrationAnalysis> {
  if (!imageBase64) throw new Error("画像が指定されていません");
  if (!speciesName?.trim()) throw new Error("植物名を入力してください");

  const trimmedSpecies = speciesName.trim();
  const trimmedNickname = nickname?.trim();

  const raw = await generateJsonFromImage<PlantByNameAnalysis>(
    buildByNamePrompt(trimmedSpecies, trimmedNickname),
    imageBase64,
    mimeType
  );

  const validated = validateByNameAnalysis(raw);

  return {
    suggestions: [
      {
        nickname:
          trimmedNickname ||
          validated.suggested_nickname ||
          trimmedSpecies,
        species_name: trimmedSpecies,
        confidence: "high",
      },
    ],
    care_guide: validated.care_guide,
    current_status: validated.current_status,
    recommendations: validated.recommendations,
  };
}

export async function analyzePlantImageForStatus(
  imageBase64: string,
  mimeType: string,
  plant?: { nickname?: string; species_name?: string }
): Promise<PlantStatusAnalysis> {
  if (!imageBase64) throw new Error("画像が指定されていません");

  const raw = await generateJsonFromImage<PlantStatusAnalysis>(
    buildStatusPrompt(plant),
    imageBase64,
    mimeType
  );

  return validateStatusAnalysis(raw);
}
