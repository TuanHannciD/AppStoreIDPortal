import { z } from "zod";
import { parsePassFileContent } from "../../share-pages/lib/passBulk";

export const ShareLinkFormSchema = z
  .object({
    appLabel: z.string().trim().min(1, "App label is required").max(160),
    appDescription: z.string().max(2000).optional(),
    note: z.string().max(2000).optional(),
    expiresAt: z.string().optional(),
    code: z.string().max(64).optional(),
    apiUrl: z.string().max(2000).optional(),
    rateEnabled: z.boolean(),
    rateWindowSec: z.coerce.number().int().min(1, "Rate window must be >= 1"),
    rateMaxRequests: z.coerce.number().int().min(1, "Rate max requests must be >= 1"),
    consumeOnVerify: z.boolean(),
    mode: z.enum(["single", "multiple"]),
    multiPassInputMode: z.enum(["file", "autogen"]).default("file"),
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
    const seen = new Set();
    const passValidation = parsePassFileContent(
      val.passes
        .map((item) => `${item.pass || ""}|${item.quota || ""}|${item.label || ""}`)
        .join("\n"),
    );

    if (!passValidation.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["passes"],
        message: passValidation.message,
      });
      return;
    }

    for (let i = 0; i < val.passes.length; i++) {
      const p = (val.passes[i].pass || "").trim();

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

export function defaultShareLinkForm() {
  return {
    appLabel: "",
    appDescription: "",
    note: "",
    expiresAt: "",
    code: "",
    apiUrl: "",
    rateEnabled: true,
    rateWindowSec: 60,
    rateMaxRequests: 30,
    consumeOnVerify: false,
    mode: "single",
    multiPassInputMode: "file",
    passes: [{ pass: "", quota: 1, label: "" }],
  };
}
