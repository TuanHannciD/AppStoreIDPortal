import { z } from "zod";

export const SharePageFormSchema = z
  .object({
    appId: z.string().min(1, "App is required"),
    note: z.string().max(2000).optional(),
    expiresAt: z.string().optional(), // ISO string or ""
    code: z.string().max(64).optional(), // optional custom
    mode: z.enum(["single", "multiple"]),
    passes: z
      .array(
        z.object({
          pass: z.string().min(1, "Pass is required").max(128),
          quota: z.coerce.number().int().min(1, "Quota must be >= 1"),
          label: z.string().max(120).optional(),
        }),
      )
      .min(1, "At least 1 pass is required"),
  })
  .superRefine((val, ctx) => {
    const seen = new Set(); // Lư pass đã gặp
    for (let i = 0; i < val.passes.length; i++) {
      //Duyệt từng pass.
      const p = (val.passes[i].pass || "").trim(); //trim khoảng trắng.
      if (seen.has(p)) {
        ctx.addIssue({
          code: "custom",
          path: ["passes", i, "pass"],
          message: "Duplicate pass",
        });
      }
      seen.add(p);
    }
  });

export function defaultSharePageForm() {
  return {
    appId: "",
    note: "",
    expiresAt: "",
    code: "",
    mode: "single",
    passes: [{ pass: "", quota: 1, label: "" }],
  };
}
