// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}


// ==========================================
// FUNÇÕES ADICIONAIS PARA BACKUP
// ==========================================

/**
 * Lista arquivos em um prefixo (diretório virtual) no S3
 */
export async function storageList(prefix: string): Promise<{ key: string; size: number; lastModified: string }[]> {
  const { baseUrl, apiKey } = getStorageConfig();
  const listUrl = new URL("v1/storage/list", ensureTrailingSlash(baseUrl));
  listUrl.searchParams.set("prefix", normalizeKey(prefix));
  
  const response = await fetch(listUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  
  if (!response.ok) {
    // Se a API não suportar listagem, retornar array vazio
    return [];
  }
  
  const data = await response.json();
  return data.files || [];
}

/**
 * Deleta um arquivo do S3
 */
export async function storageDelete(relKey: string): Promise<boolean> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const deleteUrl = new URL("v1/storage/delete", ensureTrailingSlash(baseUrl));
  deleteUrl.searchParams.set("path", key);
  
  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: buildAuthHeaders(apiKey),
  });
  
  return response.ok;
}

/**
 * Verifica se um arquivo existe no S3
 */
export async function storageExists(relKey: string): Promise<boolean> {
  try {
    const { url } = await storageGet(relKey);
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Copia um arquivo dentro do S3
 */
export async function storageCopy(
  sourceKey: string,
  destKey: string
): Promise<{ key: string; url: string }> {
  // Baixar o arquivo original
  const { url: sourceUrl } = await storageGet(sourceKey);
  const response = await fetch(sourceUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download source file: ${sourceKey}`);
  }
  
  const data = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  
  // Upload para o novo destino
  return storagePut(destKey, data, contentType);
}
