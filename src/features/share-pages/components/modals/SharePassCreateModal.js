"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createSharePass } from "../../api/shareLink.api";
import PassRowsEditor from "../PassRowsEditor";
import {
  buildPassFileContent,
  generateRandomPassItems,
  parsePassFileContent,
  PASS_FILE_ACCEPT,
  PASS_FILE_TEMPLATE_HEADER,
} from "../../lib/passBulk";

const INITIAL_FORM = {
  mode: "single",
  multiPassInputMode: "file",
  passes: [{ pass: "", quota: 1, label: "" }],
};

function createDownloadMeta(items) {
  const content = buildPassFileContent(items);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });

  return {
    downloadUrl: URL.createObjectURL(blob),
    downloadName: `share-passes-${Date.now()}.txt`,
  };
}

export default function SharePassCreateModal({
  open,
  shareLinkId,
  onOpenChange,
  onCreated,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [passFile, setPassFile] = useState(null);
  const [passFileError, setPassFileError] = useState("");
  const [autoGenCount, setAutoGenCount] = useState("1");
  const [autoGenQuota, setAutoGenQuota] = useState("1");
  const [autoGenMeta, setAutoGenMeta] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (autoGenMeta?.downloadUrl) {
        URL.revokeObjectURL(autoGenMeta.downloadUrl);
      }
    };
  }, [autoGenMeta]);

  useEffect(() => {
    if (form.mode === "single" && form.passes.length > 1) {
      setForm((prev) => ({
        ...prev,
        passes: [prev.passes[0]],
        multiPassInputMode: "file",
      }));
      setPassFile(null);
      setPassFileError("");
      clearAutoGenMeta();
    }
  }, [form.mode, form.passes.length]);

  function clearAutoGenMeta() {
    setAutoGenMeta((prev) => {
      if (prev?.downloadUrl) {
        URL.revokeObjectURL(prev.downloadUrl);
      }

      return null;
    });
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setError("");
    setPassFile(null);
    setPassFileError("");
    setAutoGenCount("1");
    setAutoGenQuota("1");
    clearAutoGenMeta();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function setPasses(passes) {
    setForm((prev) => ({ ...prev, passes }));
  }

  function setMultiPassInputMode(mode) {
    setForm((prev) => ({
      ...prev,
      multiPassInputMode: mode,
    }));
    setPassFileError("");

    if (mode !== "file") {
      setPassFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    } catch (err) {
      setPassFile(null);
      setPassFileError(String(err?.message || err));
      event.target.value = "";
    }
  }

  function removePassFile() {
    setPassFile(null);
    setPassFileError("");
    setPasses([{ pass: "", quota: 1, label: "" }]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  function validateForm() {
    if (form.mode === "multiple" && form.multiPassInputMode === "file") {
      if (!passFile?.content) {
        setError("Vui lòng chọn file .txt hợp lệ trước khi thêm pass.");
        return false;
      }

      const fileValidation = parsePassFileContent(passFile.content);
      if (!fileValidation.ok) {
        setError(fileValidation.message);
        return false;
      }
    }

    if (form.mode === "multiple" && form.multiPassInputMode === "autogen") {
      if (!form.passes.length || !autoGenMeta?.downloadUrl) {
        setError("Vui lòng tạo danh sách pass trước khi thêm.");
        return false;
      }
    }

    const passValidation = parsePassFileContent(
      form.passes
        .map((item) => `${item.pass || ""}|${item.quota || ""}|${item.label || ""}`)
        .join("\n"),
    );

    if (!passValidation.ok) {
      setError(passValidation.message);
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (!validateForm()) {
        return;
      }

      const res = await createSharePass(shareLinkId, {
        passes: form.passes.map((item) => ({
          pass: item.pass.trim(),
          quota: Number(item.quota),
          label: item.label?.trim() || null,
        })),
      });

      if (!res?.success) {
        setError(res?.message || "Không thể tạo pass.");
        return;
      }

      resetForm();
      onCreated?.();
      onOpenChange?.(false);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  function handleClose(nextOpen) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(96vw,64rem)] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 md:px-6">
          <DialogTitle>Thêm pass</DialogTitle>
          <DialogDescription>
            Tạo một pass hoặc nhiều pass cùng lúc cho share link đang chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(88vh-5.5rem)] overflow-y-auto px-5 py-5 md:px-6">
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-neutral-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Chế độ pass</div>
                  <div className="text-xs text-neutral-400">
                    Chọn thêm một pass hoặc nhiều pass cùng lúc bằng file hoặc tự sinh.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setField("mode", "single")}
                    className={`rounded-xl border px-3 py-2 text-sm ${
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
                    className={`rounded-xl border px-3 py-2 text-sm ${
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

            <div className="text-xs text-neutral-400">
              Mỗi pass sẽ được hash trước khi lưu. Với chế độ nhiều pass, hệ thống sẽ
              kiểm tra lại toàn bộ danh sách ở backend trước khi tạo.
            </div>

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving
                  ? "Đang thêm..."
                  : form.mode === "multiple"
                    ? "Thêm nhiều pass"
                    : "Thêm pass"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
