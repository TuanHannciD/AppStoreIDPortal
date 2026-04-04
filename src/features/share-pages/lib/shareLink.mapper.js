export function mapShareLinkFormToCreatePayload(form) {
  return {
    appLabel: form.appLabel?.trim(),
    appDescription: form.appDescription?.trim() || null,
    note: form.note?.trim() || null,
    expiresAt: form.expiresAt?.trim()
      ? new Date(form.expiresAt).toISOString()
      : null,
    code: form.code?.trim() ? form.code.trim() : null,
    apiUrl: form.apiUrl?.trim() || null,
    rateEnabled: Boolean(form.rateEnabled),
    rateWindowSec: Number(form.rateWindowSec),
    rateMaxRequests: Number(form.rateMaxRequests),
    consumeOnVerify: Boolean(form.consumeOnVerify),
    passes: form.passes.map((p) => ({
      pass: (p.pass || "").trim(),
      quota: Number(p.quota),
      label: p.label?.trim() || null,
    })),
  };
}
