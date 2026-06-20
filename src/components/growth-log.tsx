"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createGrowthLog,
  deleteGrowthLog,
  updateGrowthLog,
} from "@/app/actions/growth-logs";
import { analyzePlantImageForStatus } from "@/app/actions/plant-ai";
import { AiInsightsPanel } from "@/components/ai-insights-panel";
import type { GrowthLogWithPhotos } from "@/types/database";
import type { AiInsights } from "@/types/plant-ai";
import {
  formatDateTime,
  toDatetimeLocalValue,
  createId,
} from "@/lib/utils";
import { prepareImageForAnalysis } from "@/lib/image";
import { uploadPlantPhotos } from "@/lib/plant-photos-upload";
import { EditDialog } from "@/components/edit-dialog";

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

function getLogPhotos(log: GrowthLogWithPhotos): string[] {
  const fromTable = [...(log.growth_log_photos ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => p.photo_url);

  if (fromTable.length > 0) return fromTable;
  if (log.photo_url) return [log.photo_url];
  return [];
}

type SelectedFile = {
  id: string;
  file: File;
  previewUrl: string;
};

export function GrowthLogForm({
  plantId,
  plantNickname,
  plantSpeciesName,
  onSuccess,
  compact = false,
}: {
  plantId: string;
  plantNickname?: string;
  plantSpeciesName?: string | null;
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [loggedAt, setLoggedAt] = useState(() => toDatetimeLocalValue());
  const [note, setNote] = useState("");
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function addFiles(files: File[]) {
    if (files.length === 0) return;

    const items: SelectedFile[] = files.map((file) => ({
      id: createId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...items]);
    setError(null);
    setAiInsights(null);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    setAiInsights(null);
  }

  function clearFiles() {
    setSelectedFiles((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAiInsights(null);
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
      const result = await analyzePlantImageForStatus(data, mimeType, {
        nickname: plantNickname,
        species_name: plantSpeciesName ?? undefined,
      });
      setAiInsights({
        current_status: result.current_status,
        care_tips: result.care_tips,
        recommendations: result.recommendations,
        analyzed_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "状態の解析に失敗しました"
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (selectedFiles.length === 0) {
      setError("写真は必須です。1枚以上追加してください。");
      return;
    }

    setIsUploading(true);

    const form = e.currentTarget;

    try {
      const supabase = createClient();
      const photoUrls = await uploadPlantPhotos(
        supabase,
        plantId,
        selectedFiles.map((item) => item.file)
      );

      const submitData = new FormData();
      submitData.set("plant_id", plantId);
      submitData.set("note", note.trim());
      submitData.set("logged_at", loggedAt);
      submitData.set("photo_urls", JSON.stringify(photoUrls));
      if (aiInsights) {
        submitData.set("ai_insights", JSON.stringify(aiInsights));
      }

      await createGrowthLog(submitData);
      form.reset();
      clearFiles();
      setLoggedAt(toDatetimeLocalValue());
      setNote("");
      setAiInsights(null);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "記録の保存に失敗しました");
    } finally {
      setIsUploading(false);
    }
  }

  const canSubmit = selectedFiles.length > 0 && !isUploading && !isAnalyzing;

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "space-y-4" : "space-y-5"}
    >
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div>
        <span className="field-label">
          写真<span className="text-red-500">（必須）</span>
          <span className="ml-1 font-normal text-gray-500">複数枚可</span>
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/60 px-4 transition active:scale-[0.99] active:bg-green-100/60 ${
            compact ? "py-6" : "py-8"
          }`}
        >
          <CameraIcon />
          <span className="text-base font-medium text-green-700">
            写真を撮る / 選ぶ
          </span>
          {selectedFiles.length > 0 ? (
            <span className="text-sm text-gray-500">
              {selectedFiles.length} 枚選択中
            </span>
          ) : (
            <span className="text-sm text-gray-500">
              タップしてカメラを起動（複数枚OK）
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          id="photo"
          name="photo"
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
          <div className="mt-3 space-y-2">
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            <p className="text-xs text-gray-500">
              追加で撮影する場合は、上のボタンをもう一度タップしてください
            </p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || isUploading}
          className="btn-secondary !min-h-11 !py-2.5 !text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? "解析中..." : "今の状態を調べる"}
        </button>
      )}

      {aiInsights && <AiInsightsPanel insights={aiInsights} />}

      <div>
        <label htmlFor="logged_at" className="field-label">
          記録日（日本時間）
        </label>
        <input
          id="logged_at"
          name="logged_at"
          type="datetime-local"
          value={loggedAt}
          onChange={(e) => setLoggedAt(e.target.value)}
          className="field-input"
          required
        />
      </div>

      <div>
        <label htmlFor="note" className="field-label">
          メモ（任意）
        </label>
        <textarea
          id="note"
          name="note"
          rows={compact ? 2 : 3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="成長の様子、気づいたことなど"
          className="field-textarea"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? "保存中..." : "成長を記録する"}
      </button>
    </form>
  );
}

function PhotoGallery({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="border-b border-green-100 bg-green-50">
      <div
        className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {photos.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative h-60 w-[min(85vw,20rem)] shrink-0 snap-center overflow-hidden rounded-xl bg-green-100 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`成長記録の写真 ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {photos.length > 1 && (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                {index + 1} / {photos.length}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type EditPhotoItem =
  | { kind: "existing"; id: string; url: string }
  | { kind: "new"; id: string; file: File; previewUrl: string };

function initEditPhotos(log: GrowthLogWithPhotos): EditPhotoItem[] {
  const fromTable = [...(log.growth_log_photos ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  if (fromTable.length > 0) {
    return fromTable.map((p) => ({
      kind: "existing" as const,
      id: p.id,
      url: p.photo_url,
    }));
  }

  if (log.photo_url) {
    return [
      {
        kind: "existing" as const,
        id: `legacy-${log.id}`,
        url: log.photo_url,
      },
    ];
  }

  return [];
}

function revokeNewPhotoPreviews(items: EditPhotoItem[]) {
  items.forEach((item) => {
    if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
  });
}
function TimelineEntry({
  log,
  plantId,
}: {
  log: GrowthLogWithPhotos;
  plantId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photos = getLogPhotos(log);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedAt, setLoggedAt] = useState(() =>
    toDatetimeLocalValue(new Date(log.logged_at))
  );
  const [note, setNote] = useState(log.note ?? "");
  const [editPhotos, setEditPhotos] = useState<EditPhotoItem[]>(() =>
    initEditPhotos(log)
  );

  function startEditing() {
    setEditPhotos(initEditPhotos(log));
    setLoggedAt(toDatetimeLocalValue(new Date(log.logged_at)));
    setNote(log.note ?? "");
    setError(null);
    setIsEditing(true);
  }

  function addEditPhotos(files: File[]) {
    if (files.length === 0) return;
    const items: EditPhotoItem[] = files.map((file) => ({
      kind: "new",
      id: createId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setEditPhotos((prev) => [...prev, ...items]);
    setError(null);
  }

  function removeEditPhoto(id: string) {
    setEditPhotos((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (editPhotos.length === 0) {
      setError("写真は1枚以上必要です");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const orderedPhotos: { id?: string; url: string }[] = [];

      for (const item of editPhotos) {
        if (item.kind === "existing") {
          const isLegacy = item.id.startsWith("legacy-");
          orderedPhotos.push(
            isLegacy ? { url: item.url } : { id: item.id, url: item.url }
          );
          continue;
        }

        const uploadedUrls = await uploadPlantPhotos(
          supabase,
          plantId,
          [item.file],
          { logId: log.id }
        );
        orderedPhotos.push({ url: uploadedUrls[0] });
      }

      const formData = new FormData();
      formData.set("log_id", log.id);
      formData.set("plant_id", plantId);
      formData.set("logged_at", loggedAt);
      formData.set("note", note);
      formData.set("photos", JSON.stringify(orderedPhotos));

      await updateGrowthLog(formData);
      revokeNewPhotoPreviews(editPhotos);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("この成長記録を削除しますか？")) return;

    setError(null);
    setIsDeleting(true);

    try {
      await deleteGrowthLog(log.id, plantId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setIsDeleting(false);
    }
  }

  function handleCancelEdit() {
    revokeNewPhotoPreviews(editPhotos);
    setEditPhotos(initEditPhotos(log));
    setLoggedAt(toDatetimeLocalValue(new Date(log.logged_at)));
    setNote(log.note ?? "");
    setError(null);
    setIsEditing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <article className="rounded-2xl border border-green-100 bg-white shadow-sm">
      {!isEditing && <PhotoGallery photos={photos} />}
      <div className="p-4 sm:p-5">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div>
              <span className="field-label">
                写真<span className="text-red-500">（必須）</span>
              </span>
              <div className="mt-1.5 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {editPhotos.map((item, index) => (
                  <div key={item.id} className="relative shrink-0">
                    <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-green-200 bg-green-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.kind === "existing" ? item.url : item.previewUrl}
                        alt={`写真 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEditPhoto(item.id)}
                      className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow"
                      aria-label={`写真 ${index + 1} を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-200 bg-green-50/60 px-4 py-3 text-sm font-medium text-green-700 active:bg-green-100/60"
              >
                写真を追加 / 撮り直す
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addEditPhotos(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <p className="mt-2 text-xs text-gray-500">
                取り直す場合は古い写真を削除してから、新しい写真を追加してください
              </p>
            </div>

            <div>
              <label htmlFor={`logged_at-${log.id}`} className="field-label">
                記録日（日本時間）
              </label>
              <input
                id={`logged_at-${log.id}`}
                type="datetime-local"
                value={loggedAt}
                onChange={(e) => setLoggedAt(e.target.value)}
                className="field-input"
                required
              />
            </div>
            <div>
              <label htmlFor={`note-${log.id}`} className="field-label">
                メモ（任意）
              </label>
              <textarea
                id={`note-${log.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="field-textarea"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving || editPhotos.length === 0}
                className="btn-primary-sm flex-1 disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="btn-secondary flex-1 !min-h-11 !py-2.5 !text-sm"
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <time className="text-sm font-medium text-green-700">
                {formatDateTime(log.logged_at)}
              </time>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-lg px-3 py-1.5 text-sm text-green-700 active:bg-green-50"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg px-3 py-1.5 text-sm text-red-500 active:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? "削除中..." : "削除"}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {log.note && (
              <p className="mt-2 leading-relaxed text-gray-700">{log.note}</p>
            )}
            <AiInsightsPanel insights={log.ai_insights} />
          </>
        )}
      </div>
    </article>
  );
}

export function GrowthTimeline({
  logs,
  plantId,
}: {
  logs: GrowthLogWithPhotos[];
  plantId: string;
}) {
  if (logs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        まだ成長記録がありません。「記録を追加」から写真を撮って記録しましょう。
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {logs.map((log) => (
        <TimelineEntry key={log.id} log={log} plantId={plantId} />
      ))}
    </div>
  );
}

export function GrowthLogSection({
  plantId,
  plantNickname,
  plantSpeciesName,
  logs,
}: {
  plantId: string;
  plantNickname: string;
  plantSpeciesName?: string | null;
  logs: GrowthLogWithPhotos[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">成長タイムライン</h2>
        <EditDialog
          title="成長を記録"
          triggerLabel="記録を追加"
          triggerClassName="btn-primary-sm"
          bodyClassName="edit-dialog-body"
        >
          {(close) => (
            <GrowthLogForm
              plantId={plantId}
              plantNickname={plantNickname}
              plantSpeciesName={plantSpeciesName}
              onSuccess={close}
              compact
            />
          )}
        </EditDialog>
      </div>
      <GrowthTimeline logs={logs} plantId={plantId} />
    </section>
  );
}
