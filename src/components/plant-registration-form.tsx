"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  analyzePlantByNameForRegistration,
  analyzePlantImageForRegistration,
} from "@/app/actions/plant-ai";
import { createGrowthLog } from "@/app/actions/growth-logs";
import { createPlantReturnId } from "@/app/actions/plants";
import { AiInsightsPanel } from "@/components/ai-insights-panel";
import { createClient } from "@/lib/supabase/client";
import { prepareImageForAnalysis } from "@/lib/image";
import { uploadPlantPhotos } from "@/lib/plant-photos-upload";
import { createId, toDatetimeLocalValue } from "@/lib/utils";
import type { Area } from "@/types/database";
import type {
  AiInsights,
  PlantNameSuggestion,
  PlantRegistrationAnalysis,
} from "@/types/plant-ai";

function CameraIcon() {
  return (
    <svg
      className="h-10 w-10 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  );
}

function confidenceLabel(confidence: PlantNameSuggestion["confidence"]) {
  if (confidence === "high") return "信頼度: 高";
  if (confidence === "medium") return "信頼度: 中";
  return "信頼度: 低";
}

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

export function PlantRegistrationForm({
  areas,
  defaultAreaId,
}: {
  areas: Area[];
  defaultAreaId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [analysis, setAnalysis] = useState<PlantRegistrationAnalysis | null>(
    null
  );
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<
    number | null
  >(null);
  const [nickname, setNickname] = useState("");
  const [speciesName, setSpeciesName] = useState("");
  const [notes, setNotes] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  const [areaId, setAreaId] = useState(defaultAreaId ?? "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"image" | "name" | null>(
    null
  );
  const [lookupSpecies, setLookupSpecies] = useState("");
  const [lookupNickname, setLookupNickname] = useState("");

  function addFiles(files: File[]) {
    if (files.length === 0) return;

    const items: SelectedFile[] = files.map((file) => ({
      id: createId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...items]);
    setAnalysis(null);
    setSelectedSuggestionIndex(null);
    setAnalysisMode(null);
    setError(null);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    setAnalysis(null);
    setSelectedSuggestionIndex(null);
    setAnalysisMode(null);
  }

  function applySuggestion(suggestion: PlantNameSuggestion, index: number) {
    setSelectedSuggestionIndex(index);
    setNickname(suggestion.nickname);
    setSpeciesName(suggestion.species_name);
  }

  function applyAnalysisResult(
    result: PlantRegistrationAnalysis,
    mode: "image" | "name"
  ) {
    setAnalysis(result);
    setAnalysisMode(mode);
    setNotes(result.care_guide);
    setCurrentStatus(result.current_status);

    if (result.suggestions.length > 0) {
      applySuggestion(result.suggestions[0], 0);
    }
  }

  async function handleAnalyze() {
    if (selectedFiles.length === 0) {
      setError("まず写真を撮影または選択してください");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, mimeType } = await prepareImageForAnalysis(
        selectedFiles[0].file
      );
      const result = await analyzePlantImageForRegistration(data, mimeType);
      applyAnalysisResult(result, "image");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "画像の解析に失敗しました"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyzeByName() {
    if (selectedFiles.length === 0) {
      setError("まず写真を撮影または選択してください");
      return;
    }
    if (!lookupSpecies.trim()) {
      setError("植物名（種類）を入力してください");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, mimeType } = await prepareImageForAnalysis(
        selectedFiles[0].file
      );
      const result = await analyzePlantByNameForRegistration(
        data,
        mimeType,
        lookupSpecies.trim(),
        lookupNickname.trim() || undefined
      );
      applyAnalysisResult(result, "name");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "植物名からの情報取得に失敗しました"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedFiles.length === 0) {
      setError("写真は必須です");
      return;
    }
    if (!areaId) {
      setError("エリアを選択してください");
      return;
    }
    if (!nickname.trim()) {
      setError("名前を入力してください");
      return;
    }
    if (!analysis) {
      setError(
        "「画像を解析する」または「植物名から探す」を実行してから登録してください"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const plantFormData = new FormData();
      plantFormData.set("area_id", areaId);
      plantFormData.set("nickname", nickname.trim());
      plantFormData.set("species_name", speciesName.trim());
      plantFormData.set("planted_at", plantedAt);
      plantFormData.set("notes", notes.trim());

      const plantId = await createPlantReturnId(plantFormData);

      const supabase = createClient();
      const photoUrls = await uploadPlantPhotos(
        supabase,
        plantId,
        selectedFiles.map((item) => item.file)
      );

      const aiInsights: AiInsights = {
        current_status: currentStatus.trim() || analysis.current_status,
        care_guide: notes.trim() || analysis.care_guide,
        recommendations: analysis.recommendations,
        analyzed_at: new Date().toISOString(),
      };

      const logFormData = new FormData();
      logFormData.set("plant_id", plantId);
      logFormData.set("logged_at", toDatetimeLocalValue());
      logFormData.set("photo_urls", JSON.stringify(photoUrls));
      logFormData.set("ai_insights", JSON.stringify(aiInsights));

      await createGrowthLog(logFormData);
      router.push(`/plants/${plantId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
      setIsSubmitting(false);
    }
  }

  const previewInsights: AiInsights | null = analysis
    ? {
        current_status: currentStatus || analysis.current_status,
        care_guide: notes || analysis.care_guide,
        recommendations: analysis.recommendations,
      }
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div>
        <span className="field-label">
          写真<span className="text-red-500">（必須）</span>
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 px-4 py-8 transition active:scale-[0.99] active:bg-green-100/60"
        >
          <CameraIcon />
          <span className="text-base font-medium text-green-700">
            写真を撮る / 選ぶ
          </span>
          <span className="text-sm text-gray-500">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} 枚選択中（解析は1枚目を使用）`
              : "植物全体が写るように撮影してください"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {selectedFiles.map((item, index) => (
              <div key={item.id} className="relative shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-green-200 bg-green-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={`選択した写真 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow"
                  aria-label={`写真 ${index + 1} を削除`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={selectedFiles.length === 0 || isAnalyzing}
        className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAnalyzing && analysisMode !== "name"
          ? "解析中..."
          : "画像を解析する"}
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-green-100" />
        </div>
        <p className="relative mx-auto w-fit bg-[var(--background)] px-3 text-xs text-gray-500">
          植物名がわかっている場合
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-green-100 bg-green-50/40 p-4">
        <div>
          <label htmlFor="lookup_species" className="field-label">
            植物名（種類）<span className="text-red-500">*</span>
          </label>
          <input
            id="lookup_species"
            type="text"
            value={lookupSpecies}
            onChange={(e) => setLookupSpecies(e.target.value)}
            placeholder="例: モンステラ、バジル"
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="lookup_nickname" className="field-label">
            ニックネーム（任意）
          </label>
          <input
            id="lookup_nickname"
            type="text"
            value={lookupNickname}
            onChange={(e) => setLookupNickname(e.target.value)}
            placeholder="例: モンステラちゃん"
            className="field-input"
          />
        </div>
        <button
          type="button"
          onClick={handleAnalyzeByName}
          disabled={
            selectedFiles.length === 0 ||
            !lookupSpecies.trim() ||
            isAnalyzing
          }
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing && analysisMode !== "image"
            ? "取得中..."
            : "植物名から探す"}
        </button>
        <p className="text-xs text-gray-500">
          入力した植物名を前提に、写真と照らし合わせて育て方と今の状態を取得します。
        </p>
      </div>

      {analysis && (
        <div className="space-y-5 rounded-2xl border border-green-100 bg-white p-4">
          {analysisMode === "image" && analysis.suggestions.length > 0 && (
            <div>
              <p className="field-label">植物名の候補</p>
              <div className="mt-2 space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion, index)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selectedSuggestionIndex === index
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white active:bg-green-50/50"
                    }`}
                  >
                    <p className="font-semibold text-gray-800">
                      {suggestion.nickname}
                    </p>
                    <p className="text-sm text-green-600">
                      {suggestion.species_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {confidenceLabel(suggestion.confidence)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {analysisMode === "name" && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              「{speciesName || lookupSpecies}」として情報を取得しました
            </p>
          )}

          <div>
            <label htmlFor="reg_nickname" className="field-label">
              名前（ニックネーム）
            </label>
            <input
              id="reg_nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="reg_species" className="field-label">
              種類
            </label>
            <input
              id="reg_species"
              type="text"
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="reg_area" className="field-label">
              エリア
            </label>
            <select
              id="reg_area"
              required
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="field-input"
            >
              <option value="">選択してください</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}（{area.type === "outdoor" ? "屋外" : "室内"}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg_planted_at" className="field-label">
              植えた日（任意）
            </label>
            <input
              id="reg_planted_at"
              type="date"
              value={plantedAt}
              onChange={(e) => setPlantedAt(e.target.value)}
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="reg_notes" className="field-label">
              育て方メモ
            </label>
            <textarea
              id="reg_notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-textarea"
            />
          </div>

          <div>
            <label htmlFor="reg_status" className="field-label">
              今の状態（最初の成長記録に保存）
            </label>
            <textarea
              id="reg_status"
              rows={2}
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="field-textarea"
            />
          </div>

          <AiInsightsPanel insights={previewInsights} />
        </div>
      )}

      <button
        type="submit"
        disabled={
          !analysis ||
          isSubmitting ||
          isAnalyzing ||
          selectedFiles.length === 0
        }
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "登録中..." : "植物を登録する"}
      </button>
    </form>
  );
}
