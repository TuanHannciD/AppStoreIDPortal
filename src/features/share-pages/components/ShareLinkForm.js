"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createShareLink } from "../api/shareLink.api";
import PassRowsEditor from "./PassRowsEditor";
import ShareLinkResultCard from "./ShareLinkResultCard";
import {
  ShareLinkFormSchema,
  defaultShareLinkForm,
} from "../../share-public/components/shareLink.schema";
import { mapShareLinkFormToCreatePayload } from "../lib/shareLink.mapper";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  buildPassFileContent,
  generateRandomPassItems,
  parsePassFileContent,
  PASS_FILE_ACCEPT,
  PASS_FILE_TEMPLATE_HEADER,
} from "../lib/passBulk";

function createDownloadMeta(items) {
  const content = buildPassFileContent(items);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

  return {
    downloadUrl: URL.createObjectURL(blob),
    downloadName: `share-passes-${Date.now()}.txt`,
  };
}

function cloneDownloadMeta(meta) {
  if (!meta?.downloadUrl) return null;

  return {
    downloadUrl: meta.downloadUrl,
    downloadName: meta.downloadName,
  };
}

function FieldError({ message }) {
  if (!message) return null;
  return <div className="text-xs text-red-300">{message}</div>;
}

export default function ShareLinkForm({
  embedded = false,
  onCreated,
  onCancel,
}) {
  const [form, setForm] = useState(defaultShareLinkForm());
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [enableExpire, setEnableExpire] = useState(false);
  const [passFile, setPassFile] = useState(null);
  const [passFileError, setPassFileError] = useState("");
  const [autoGenCount, setAutoGenCount] = useState("1");
  const [autoGenQuota, setAutoGenQuota] = useState("1");
  const [autoGenMeta, setAutoGenMeta] = useState(null);
  const [createdDownloadMeta, setCreatedDownloadMeta] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoGenMeta?.downloadUrl) {
        URL.revokeObjectURL(autoGenMeta.downloadUrl);
      }
      if (createdDownloadMeta?.downloadUrl) {
        URL.revokeObjectURL(createdDownloadMeta.downloadUrl);
      }
    };
  }, [autoGenMeta, createdDownloadMeta]);

  useEffect(() => {
    if (form.mode === "single" && form.passes.length > 1) {
      setForm((s) => ({
        ...s,
        passes: [s.passes[0]],
        multiPassInputMode: "file",
      }));
      setPassFile(null);
      setPassFileError("");
      clearAutoGenMeta();
    }
  }, [form.mode, form.passes.length]);

  const canSubmit = useMemo(() => !submitting, [submitting]);
  const selectedDate = form.expiresAt ? new Date(form.expiresAt) : undefined;

  function clearAutoGenMeta() {
    setAutoGenMeta((prev) => {
      if (prev?.downloadUrl) URL.revokeObjectURL(prev.downloadUrl);
      return null;
    });
  }

  function replaceCreatedDownloadMeta(nextMeta) {
    setCreatedDownloadMeta((prev) => {
      if (prev?.downloadUrl) URL.revokeObjectURL(prev.downloadUrl);
      return nextMeta;
    });
  }

  function setField(name, value) {
    setForm((s) => ({ ...s, [name]: value }));
  }

  function setPasses(passes) {
    setForm((s) => ({ ...s, passes }));
  }

  function setMultiPassInputMode(mode) {
    setForm((s) => ({
      ...s,
      multiPassInputMode: mode,
    }));
    setPassFileError("");

    if (mode !== "file") {
      setPassFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    if (mode !== "autogen") {
      clearAutoGenMeta();
    }
  }

  async function handlePassFileChange(event) {
    const file = event.target.files?.[0];
    setPassFileError("");

    if (!file) {
      setPassFile(null);
      return;
    }

    try {
      const text = await file.text();
      const parsed = parsePassFileContent(text);

      if (!parsed.ok) {
        setPassFile(null);
        setPassFileError(parsed.message);
        event.target.value = "";
        return;
      }

      setPassFile({
        name: file.name,
        size: file.size,
        content: text,
      });
      setPasses(parsed.items);
    } catch (error) {
      setPassFile(null);
      setPassFileError(String(error?.message || error));
      event.target.value = "";
    }
  }

  function removePassFile() {
    setPassFile(null);
    setPassFileError("");
    setPasses([{ pass: "", quota: 1, label: "" }]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAutoGenerate() {
    setPassFileError("");
    const generated = generateRandomPassItems(autoGenCount, autoGenQuota);

    if (!generated.ok) {
      clearAutoGenMeta();
      setPassFileError(generated.message);
      return;
    }

    clearAutoGenMeta();
    setPasses(generated.items);
    setAutoGenMeta(createDownloadMeta(generated.items));
  }

  function validate(current) {
    if (current.mode === "multiple" && current.multiPassInputMode === "file") {
      if (!passFile?.content) {
        setErrors({ form: "Please attach a valid txt file for bulk pass creation.", fields: {} });
        return { ok: false };
      }

      const fileValidation = parsePassFileContent(passFile.content);
      if (!fileValidation.ok) {
        setErrors({ form: fileValidation.message, fields: {} });
        return { ok: false };
      }
    }

    if (current.mode === "multiple" && current.multiPassInputMode === "autogen") {
      if (!current.passes.length || !autoGenMeta?.downloadUrl) {
        setErrors({ form: "Please generate pass list before creating the share link.", fields: {} });
        return { ok: false };
      }
    }

    const parsed = ShareLinkFormSchema.safeParse(current);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      setErrors({
        form: flat.formErrors?.[0] || "",
        fields: flat.fieldErrors || {},
      });
      return { ok: false };
    }

    setErrors({});
    return { ok: true, data: parsed.data };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    setCreated(null);

    const v = validate(form);
    if (!v.ok) return;

    setSubmitting(true);

    try {
      const payload = mapShareLinkFormToCreatePayload(form);
      const res = await createShareLink(payload);

      if (!res?.success) {
        setServerError(res?.message || "Create failed");
        return;
      }

      const nextCreatedMeta =
        form.mode === "multiple" && form.multiPassInputMode === "autogen" && form.passes.length
          ? createDownloadMeta(form.passes)
          : null;

      replaceCreatedDownloadMeta(nextCreatedMeta);
      const createdResult = {
        ...res,
        ...(cloneDownloadMeta(nextCreatedMeta) || {}),
      };

      setCreated(createdResult);
      onCreated?.(createdResult);
    } catch (err) {
      setServerError(String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleExpire() {
    setEnableExpire((prev) => {
      const next = !prev;
      setForm((s) => ({ ...s, expiresAt: next ? new Date().toISOString() : "" }));
      return next;
    });
  }

  const wrapperClassName = embedded
    ? "space-y-5 sm:space-y-6"
    : "mx-auto max-w-5xl space-y-6 p-6";

  return (
    <div className={wrapperClassName}>
      {created && <ShareLinkResultCard result={created} passes={form.passes} />}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-neutral-800 p-4">
          <div>
            <div className="text-sm font-semibold">Thông tin share link</div>
            <div className="mt-1 text-xs text-neutral-400">
              Nhập các thông tin chính sẽ được lưu trực tiếp vào bảng ShareLink.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Tên ứng dụng *</div>
              <input
                value={form.appLabel}
                onChange={(e) => setField("appLabel", e.target.value)}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                placeholder="Movie VIP"
              />
              <FieldError message={errors?.fields?.appLabel?.[0]} />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Mã tùy chỉnh</div>
              <input
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 font-mono outline-none focus:border-neutral-600"
                placeholder="Để trống nếu muốn tự tạo mã"
              />
              <FieldError message={errors?.fields?.code?.[0]} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-neutral-400">Mô tả ứng dụng</div>
              <textarea
                value={form.appDescription}
                onChange={(e) => setField("appDescription", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                placeholder="Mô tả ngắn cho share link này..."
              />
              <FieldError message={errors?.fields?.appDescription?.[0]} />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Ngày hết hạn</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleExpire}
                  className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-[rgb(124,124,124)]"
                >
                  {enableExpire ? "Bật" : "Tắt"}
                </button>

                {enableExpire ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-[rgb(124,124,124)]"
                      >
                        {selectedDate ? format(selectedDate, "PPP") : "Chọn ngày"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => setField("expiresAt", d ? d.toISOString() : "")}
                      />
                    </PopoverContent>
                  </Popover>
                ) : null}
              </div>
              <FieldError message={errors?.fields?.expiresAt?.[0]} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-xs text-neutral-400">Ghi chú</div>
              <textarea
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                placeholder="Ghi chú nội bộ..."
              />
              <FieldError message={errors?.fields?.note?.[0]} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-neutral-800 p-4">
          <div>
            <div className="text-sm font-semibold">Link nguồn</div>
            <div className="mt-1 text-xs text-neutral-400">
              Người dùng chỉ cần nhập đúng link. Hệ thống sẽ mặc định dùng GET.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Đường dẫn</div>
              <input
                value={form.apiUrl}
                onChange={(e) => setField("apiUrl", e.target.value)}
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
                placeholder="https://example.com/integrations/movie-vip"
              />
              <FieldError message={errors?.fields?.apiUrl?.[0]} />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-neutral-800 p-4">
          <div>
            <div className="text-sm font-semibold">Cách hoạt động</div>
            <div className="mt-1 text-xs text-neutral-400">
              Chọn rate limit và cách trừ quota cho từng pass.
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-800 p-3">
            <input
              type="checkbox"
              checked={form.rateEnabled}
              onChange={(e) => setField("rateEnabled", e.target.checked)}
            />
            <div>
              <div className="text-sm font-medium">Bật giới hạn request</div>
              <div className="text-xs text-neutral-400">
                Bật giới hạn request theo cửa sổ thời gian của share link.
              </div>
            </div>
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Cửa sổ thời gian (giây) *</div>
              <input
                value={form.rateWindowSec}
                onChange={(e) => setField("rateWindowSec", e.target.value)}
                type="number"
                min="1"
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
              />
              <FieldError message={errors?.fields?.rateWindowSec?.[0]} />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Số request tối đa *</div>
              <input
                value={form.rateMaxRequests}
                onChange={(e) => setField("rateMaxRequests", e.target.value)}
                type="number"
                min="1"
                className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
              />
              <FieldError message={errors?.fields?.rateMaxRequests?.[0]} />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-neutral-400">Trừ quota khi verify</div>
              <div className="flex h-full items-center">
                <label className="flex items-center gap-3 rounded-xl border border-neutral-800 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form.consumeOnVerify}
                    onChange={(e) => setField("consumeOnVerify", e.target.checked)}
                  />
                  <span className="text-sm">Trừ quota ngay ở bước verify</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-800 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold">Chế độ pass</div>
              <div className="text-xs text-neutral-400">
                Single pass cho một người dùng, multiple passes cho nhiều slot trên cùng một share link.
              </div>
            </div>

            <div className="flex w-full flex-wrap gap-2 md:w-auto">
              <button
                type="button"
                onClick={() => setField("mode", "single")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm md:flex-none ${
                  form.mode === "single"
                    ? "border-neutral-500 bg-[rgb(202,202,202)]"
                    : "border-neutral-800 hover:bg-[rgb(124,124,124)]"
                }`}
              >
                Một pass
              </button>

              <button
                type="button"
                onClick={() => setField("mode", "multiple")}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm md:flex-none ${
                  form.mode === "multiple"
                    ? "border-neutral-500 bg-[rgb(202,202,202)]"
                    : "border-neutral-800 hover:bg-[rgb(124,124,124)]"
                }`}
              >
                Nhiều pass
              </button>
            </div>
          </div>

          {form.mode === "multiple" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="cursor-pointer rounded-xl border border-neutral-800 p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="multiPassInputMode"
                    checked={form.multiPassInputMode === "file"}
                    onChange={() => setMultiPassInputMode("file")}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium">Tạo pass từ file txt</div>
                    <div className="mt-1 text-xs text-neutral-400">
                      Định dạng hỗ trợ: {PASS_FILE_TEMPLATE_HEADER}
                    </div>
                  </div>
                </div>
              </label>

              <label className="cursor-pointer rounded-xl border border-neutral-800 p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="multiPassInputMode"
                    checked={form.multiPassInputMode === "autogen"}
                    onChange={() => setMultiPassInputMode("autogen")}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium">Tự tạo pass ngẫu nhiên</div>
                    <div className="mt-1 text-xs text-neutral-400">
                      Tạo nhanh danh sách pass và tải file txt để lưu trữ.
                    </div>
                  </div>
                </div>
              </label>
            </div>
          ) : null}
        </div>

        <PassRowsEditor
          mode={form.mode}
          inputMode={form.multiPassInputMode}
          passes={form.passes}
          onChange={setPasses}
          passFile={passFile}
          passFileError={passFileError}
          fileInputRef={fileInputRef}
          onPassFileChange={handlePassFileChange}
          onPassFileRemove={removePassFile}
          autoGenCount={autoGenCount}
          autoGenQuota={autoGenQuota}
          onAutoGenCountChange={setAutoGenCount}
          onAutoGenQuotaChange={setAutoGenQuota}
          onGenerateAutoPasses={handleAutoGenerate}
          autoGenDownloadUrl={autoGenMeta?.downloadUrl || ""}
          autoGenDownloadName={autoGenMeta?.downloadName || ""}
          fileAccept={PASS_FILE_ACCEPT}
        />

        <div className="-mt-3 text-xs text-neutral-400">
          Mỗi pass sẽ được hash trước khi lưu. Hệ thống sẽ kiểm tra lại danh sách pass một lần nữa ở backend.
        </div>

        {errors?.fields?.passes?.[0] && (
          <div className="text-xs text-red-300">{errors.fields.passes[0]}</div>
        )}

        {errors?.form && <div className="text-xs text-red-300">{errors.form}</div>}

        {serverError ? (
          <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {serverError}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {embedded ? (
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-xl border border-neutral-800 px-4 py-2 text-center text-sm hover:bg-[rgb(124,124,124)] sm:w-auto"
            >
              Hủy
            </button>
          ) : (
            <a
              href="/admin/share-pages"
              className="w-full rounded-xl border border-neutral-800 px-4 py-2 text-center text-sm hover:bg-[rgb(124,124,124)] sm:w-auto"
            >
              Hủy
            </a>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-100 px-4 py-2 text-sm text-neutral-950 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? "Đang tạo..." : "Tạo mới"}
          </button>
        </div>
      </form>
    </div>
  );
}
