import api from "@/lib/api";

export async function downloadFile(path: string, filename: string, mimeFallback = "application/octet-stream") {
  const response = await api.get(path, { responseType: "arraybuffer" });
  const blob = new Blob([response.data], { type: response.headers["content-type"] ?? mimeFallback });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
