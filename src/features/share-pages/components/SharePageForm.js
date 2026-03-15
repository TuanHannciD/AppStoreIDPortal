// full create screen
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApps, createSharePage } from "../api/sharePage.api";
import PassRowsEditor from "./PassRowsEditor";
import SharePageResultCard from "./SharePageResultCard";
import {
  SharePageFormSchema,
  defaultSharePageForm,
} from "../../share-public/components/sharePage.schema";
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

  // CHANGED:
  // Flow mới là:
  // - Verify pass -> chưa trừ quota
  // - Reveal account info -> mới trừ quota

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

    const v = validate(form);
    if (!v.ok) return;

    setSubmitting(true);
    try {
      // CHANGED:
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
  // thì chỉ giữ lại pass đầu tiên
  useEffect(() => {
    if (form.mode === "single" && form.passes.length > 1) {
      setForm((s) => ({ ...s, passes: [s.passes[0]] }));
    }
  }, [form.mode]);

  const selectedDate = form.expiresAt ? new Date(form.expiresAt) : undefined;

  return (
    <div className="space-y-6">
      {created && <SharePageResultCard result={created} passes={form.passes} />}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Share info */}
        <div className="rounded-2xl border border-neutral-800 p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold">Share link info</div>

            {/* CHANGED:
                Thêm mô tả ngắn đúng business mới để sau này đọc lại dễ hiểu */}
            <div className="text-xs text-neutral-400 mt-1">
              Cấu hình thông tin cơ bản của share link, thời hạn sử dụng và mã
              public trên URL.
            </div>
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
                      ? "border-neutral-500 bg-neutral-400"
                      : "border-neutral-400"
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

        {/* CHANGED:
            Thêm block Access behavior để phản ánh flow mới.
            Đây là thay đổi quan trọng nhất ở màn create.
        */}
        <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold">Access behavior</div>
            <div className="text-xs text-neutral-400 mt-1">
              Xác định thời điểm hệ thống trừ quota của từng pass.
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 rounded-xl border border-neutral-800 p-3 cursor-pointer">
              <input
                type="radio"
                name="consumeMode"
                checked={!form.consumeOnVerify}
                onChange={() => setField("consumeOnVerify", false)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">
                  Verify trước, chỉ trừ quota khi reveal account
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Đây là flow mới: user nhập pass để xác thực trước; chỉ khi bấm
                  xem thông tin account thì hệ thống mới gọi API lấy full info
                  và mới trừ quota.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-neutral-800 p-3 cursor-pointer opacity-70">
              <input
                type="radio"
                name="consumeMode"
                checked={form.consumeOnVerify}
                onChange={() => setField("consumeOnVerify", true)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">
                  Trừ quota ngay khi verify pass
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Chế độ cũ. Chỉ giữ lại để tương thích nếu sau này bạn vẫn muốn
                  support policy cũ ở backend.
                </div>
              </div>
            </label>
          </div>
        </div>
        {/* CHANGED:
            Thêm placeholder block cho account mapping.
            Vì flow mới phụ thuộc vào account reveal, nên nếu không có block này
            thì UI create sẽ thiếu ngữ cảnh business.
        */}
        <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold">
              Shared account configuration
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Chọn account sẽ được trả về sau khi user verify pass và bấm xem
              thông tin account.
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-neutral-700 p-4">
            <div className="text-sm font-medium">
              Account assignment placeholder
            </div>
            <div className="text-xs text-neutral-400 mt-2 leading-5">
              Phần này nên được nối với các bảng như{" "}
              <span className="font-mono">AppAccount</span> và{" "}
              <span className="font-mono">SharePageAccount</span>.
              <br />
              Hiện tại bạn chưa build xong module account nên mới để placeholder
              để tránh UI bị lệch với flow mới.
            </div>

            <div className="mt-3 text-xs text-amber-400">
              Chưa có account nào được gắn vào share link này.
            </div>
          </div>
        </div>

        {/* Pass mode */}
        <div className="rounded-2xl border border-neutral-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Pass mode</div>

              {/* CHANGED:
                  Sửa wording để dễ hiểu hơn và đỡ lặp chữ "link" */}
              <div className="text-xs text-neutral-400">
                Single pass dành cho một người dùng; multiple passes dành cho
                nhiều người dùng trên cùng một share link.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setField("mode", "single")}
                className={`px-3 py-2 text-sm rounded-xl border ${
                  form.mode === "single"
                    ? "border-neutral-500 bg-neutral-400"
                    : "border-neutral-800 hover:bg-neutral-400"
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setField("mode", "multiple")}
                className={`px-3 py-2 text-sm rounded-xl border ${
                  form.mode === "multiple"
                    ? "border-neutral-500 bg-neutral-400"
                    : "border-neutral-800 hover:bg-neutral-400"
                }`}
              >
                Multiple
              </button>
            </div>
          </div>
        </div>

        {/* CHANGED:
            Giữ PassRowsEditor, nhưng logic mô tả quota phải theo flow mới.
            Nếu component này có title/subtitle hardcode bên trong, bạn nên sửa luôn ở file đó.
        */}
        <PassRowsEditor
          mode={form.mode}
          passes={form.passes}
          onChange={setPasses}
        />

        {/* CHANGED:
            Thêm helper text ngoài editor để làm rõ quota semantics
            trong trường hợp PassRowsEditor chưa sửa subtitle bên trong */}
        <div className="text-xs text-neutral-400 -mt-3">
          Mỗi pass tương ứng một người dùng hoặc một slot sử dụng. Quota chỉ bị
          trừ khi người dùng bấm xem thông tin account thành công, không trừ ở
          bước verify pass.
        </div>

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
            className="px-4 py-2 text-sm rounded-xl border border-neutral-800 hover:bg-neutral-400"
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
