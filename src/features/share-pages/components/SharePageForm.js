//full create screen
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApps, createSharePage } from "../api/sharePage.api";
import PassRowsEditor from "./PassRowsEditor";
import SharePageResultCard from "./SharePageResultCard";
import {
  SharePageFormSchema,
  defaultSharePageForm,
} from "../lib/sharePage.schema";
import { mapFormToCreatePayload } from "../lib/sharePage.mapper";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export default function SharePageForm() {
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [form, setForm] = useState(defaultSharePageForm());
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [created, setCreated] = useState(null);
  const [enableExpire, setEnableExpire] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingApps(true);
      const data = await fetchApps();
      setApps(data?.apps || []);
      setLoadingApps(false);
    })();
  }, []);

  const canSubmit = useMemo(
    () => !submitting && !loadingApps,
    [submitting, loadingApps],
  );

  function setField(name, value) {
    setForm((s) => ({ ...s, [name]: value }));
  }

  function setPasses(passes) {
    setForm((s) => ({ ...s, passes }));
  }

  function validate(current) {
    const parsed = SharePageFormSchema.safeParse(current);
    if (parsed.success) {
      setErrors({});
      return { ok: true, data: parsed.data };
    }
    const flat = parsed.error.flatten();
    setErrors({
      form: flat.formErrors?.[0] || "",
      fields: flat.fieldErrors || {},
    });
    return { ok: false };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    setCreated(null);

    // Validate dữ liệu form trước khi gửi API
    const v = validate(form);
    if (!v.ok) return;

    setSubmitting(true);
    try {
      const payload = mapFormToCreatePayload(form);
      const res = await createSharePage(payload);
      if (!res?.success) {
        setServerError(res?.message || "Create failed");
        return;
      }
      setCreated(res);
    } catch (err) {
      setServerError(String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleExpire() {
    setEnableExpire((prev) => {
      const next = !prev;

      setForm((s) => ({
        ...s,
        expiresAt: next ? new Date().toISOString() : "",
      }));

      return next;
    });
  }
  // Nếu người dùng chuyển từ multiple -> single
  // mode behaviour: if switching to single, keep only first pass row
  useEffect(() => {
    if (form.mode === "single" && form.passes.length > 1) {
      setForm((s) => ({ ...s, passes: [s.passes[0]] }));
    }
  }, [form.mode]);

  // Lấy ngày mặc định
  const selectedDate = form.expiresAt ? new Date(form.expiresAt) : undefined;

  return (
    <div className="space-y-6">
      {created && <SharePageResultCard result={created} passes={form.passes} />}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Share info */}
        <div className="rounded-2xl border border-neutral-800 p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold">Share link info</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400">App *</div>
              <select
                value={form.appId}
                onChange={(e) => setField("appId", e.target.value)}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                disabled={loadingApps}
              >
                <option value="">
                  {loadingApps ? "Loading..." : "Select an app"}
                </option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.slug})
                  </option>
                ))}
              </select>
              {errors?.fields?.appId?.[0] && (
                <div className="text-xs text-red-300">
                  {errors.fields.appId[0]}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-400">Expiration</div>

                <button
                  type="button"
                  onClick={toggleExpire}
                  className={`px-3 py-1 text-xs rounded-lg border ${
                    enableExpire
                      ? "border-neutral-500 bg-neutral-800"
                      : "border-neutral-800"
                  }`}
                >
                  {enableExpire ? "Enabled" : "Disabled"}
                </button>
              </div>

              {enableExpire && (
                <div className="rounded-xl border border-neutral-800 p-2 w-fit">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-empty={!selectedDate}
                        className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                      >
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          setField("expiresAt", d ? d.toISOString() : "");
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-neutral-400">Note (optional)</div>
              <textarea
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                placeholder="Internal note..."
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-neutral-400">
                Custom code (advanced, optional)
              </div>
              <input
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600 font-mono"
                placeholder="Leave empty to auto-generate"
              />
            </div>
          </div>
        </div>

        {/* Pass mode */}
        <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Pass mode</div>
              <div className="text-xs text-neutral-400">
                Single pass dành cho một người dùng; multiple passes dành cho
                nhiều người dùng trên cùng một liên kết link.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setField("mode", "single")}
                className={`px-3 py-2 text-sm rounded-xl border ${
                  form.mode === "single"
                    ? "border-neutral-500 bg-neutral-800"
                    : "border-neutral-800 hover:bg-neutral-800"
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setField("mode", "multiple")}
                className={`px-3 py-2 text-sm rounded-xl border ${
                  form.mode === "multiple"
                    ? "border-neutral-500 bg-neutral-800"
                    : "border-neutral-800 hover:bg-neutral-800"
                }`}
              >
                Multiple
              </button>
            </div>
          </div>
        </div>

        <PassRowsEditor
          mode={form.mode}
          passes={form.passes}
          onChange={setPasses}
        />
        {errors?.fields?.passes?.[0] && (
          <div className="text-xs text-red-300">{errors.fields.passes[0]}</div>
        )}
        {errors?.form && (
          <div className="text-xs text-red-300">{errors.form}</div>
        )}

        {serverError && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <a
            href="/admin/share-pages"
            className="px-4 py-2 text-sm rounded-xl border border-neutral-800 hover:bg-neutral-800"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 text-sm rounded-xl border border-neutral-700 bg-neutral-100 text-neutral-950 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
