//Hàm này dùng để chuyển dữ liệu từ form (frontend) thành payload chuẩn gửi lên API.
export function mapFormToCreatePayload(form) {
  return {
    appId: form.appId,
    note: form.note?.trim() || null,
    expiresAt: form.expiresAt?.trim() ? new Date(form.expiresAt).toISOString() : null,
    code: form.code?.trim() ? form.code.trim() : null,
    passes: form.passes.map(p => ({
      pass: (p.pass || "").trim(),
      quota: Number(p.quota),
      label: p.label?.trim() || null,
    })),
  };
}