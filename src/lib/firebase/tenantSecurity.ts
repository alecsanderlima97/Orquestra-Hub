export function tenantFromAttachmentPath(path: string) {
  if (!path || path.includes("..") || path.startsWith("/") || !path.includes("/")) return null;
  return path.split("/")[0] || null;
}
