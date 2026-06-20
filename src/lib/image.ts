const STORAGE_MAX_EDGE = 1600;
const STORAGE_QUALITY = 0.85;
const ANALYSIS_MAX_EDGE = 1280;
const ANALYSIS_QUALITY = 0.82;

async function compressImageToBlob(
  file: File,
  options: { maxEdge: number; quality: number }
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale =
    longest > options.maxEdge ? options.maxEdge / longest : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("画像の処理に失敗しました");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("画像の圧縮に失敗しました"));
      },
      "image/jpeg",
      options.quality
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  });
}

/** Storage 保存用にリサイズ・JPEG 圧縮した File を返す */
export async function compressImageForStorage(file: File): Promise<File> {
  const blob = await compressImageToBlob(file, {
    maxEdge: STORAGE_MAX_EDGE,
    quality: STORAGE_QUALITY,
  });
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** @deprecated Use prepareImageForAnalysis for server actions */
export async function fileToBase64(
  file: File
): Promise<{ data: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  return {
    data: arrayBufferToBase64(buffer),
    mimeType: file.type || "image/jpeg",
  };
}

/**
 * AI 解析用に画像をリサイズ・圧縮してから base64 化する。
 */
export async function prepareImageForAnalysis(
  file: File,
  options?: { maxEdge?: number; quality?: number }
): Promise<{ data: string; mimeType: string }> {
  const blob = await compressImageToBlob(file, {
    maxEdge: options?.maxEdge ?? ANALYSIS_MAX_EDGE,
    quality: options?.quality ?? ANALYSIS_QUALITY,
  });

  return {
    data: await blobToBase64(blob),
    mimeType: "image/jpeg",
  };
}
