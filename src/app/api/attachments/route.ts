import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const bucket = "orquestra-documentos";
const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "Armazenamento ainda não configurado." }, { status: 503 });
  const data = await request.formData();
  const file = data.get("file");
  const tenantId = String(data.get("tenantId") || "");
  const purchaseId = String(data.get("purchaseId") || "");
  const category = String(data.get("category") || "");
  if (!(file instanceof File) || !tenantId || !purchaseId || !["boletos", "notas-fiscais", "lojas"].includes(category)) return NextResponse.json({ error: "Dados do anexo inválidos." }, { status: 400 });
  if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Envie PDF ou imagem com até 10 MB." }, { status: 400 });

  const buckets = await supabase.storage.listBuckets();
  if (!buckets.data?.some((item) => item.name === bucket)) await supabase.storage.createBucket(bucket, { fileSizeLimit: 10 * 1024 * 1024, public: false });
  const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${tenantId}/${purchaseId}/${category}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });
  const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signed.error) return NextResponse.json({ error: signed.error.message }, { status: 500 });
  return NextResponse.json({ name: file.name, size: file.size, type: file.type, url: signed.data.signedUrl });
}
