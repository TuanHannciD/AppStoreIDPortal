const PASS_FILE_ACCEPT = ".txt,text/plain";
const PASS_FILE_TEMPLATE_HEADER =
  "Password|quota(bắt buộc, phải là số)|label(có thể trống)";

function normalizeLineEndings(text) {
  return String(text || "").replace(/\r\n?/g, "\n");
}

function sanitizeQuota(value) {
  const quota = Number(String(value || "").trim());
  return Number.isInteger(quota) && quota > 0 ? quota : null;
}

export function parsePassFileContent(text) {
  const normalized = normalizeLineEndings(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      ok: false,
      message: "File pass không được để trống.",
      items: [],
    };
  }

  const items = [];
  const seen = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const parts = line.split("|");

    if (parts.length !== 3) {
      return {
        ok: false,
        message: `Dòng ${index + 1} không đúng định dạng Password|quota|label.`,
        items: [],
      };
    }

    const [rawPass, rawQuota, rawLabel] = parts;
    const pass = rawPass.trim();
    const quota = sanitizeQuota(rawQuota);
    const label = rawLabel.trim();

    if (!pass) {
      return {
        ok: false,
        message: `Dòng ${index + 1} đang bị thiếu password.`,
        items: [],
      };
    }

    if (!quota) {
      return {
        ok: false,
        message: `Dòng ${index + 1} có quota không hợp lệ.`,
        items: [],
      };
    }

    if (pass.length > 128) {
      return {
        ok: false,
        message: `Dòng ${index + 1} có password dài quá 128 ký tự.`,
        items: [],
      };
    }

    if (label.length > 120) {
      return {
        ok: false,
        message: `Dòng ${index + 1} có label dài quá 120 ký tự.`,
        items: [],
      };
    }

    if (seen.has(pass)) {
      return {
        ok: false,
        message: `Password bị trùng tại dòng ${index + 1}.`,
        items: [],
      };
    }

    seen.add(pass);
    items.push({
      pass,
      quota,
      label,
    });
  }

  return {
    ok: true,
    message: "",
    items,
  };
}

export function buildPassFileContent(items) {
  return items
    .map((item) => `${item.pass}|${item.quota}|${item.label || ""}`)
    .join("\n");
}

export function createRandomAlphabetPass(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let out = "";

  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }

  return out;
}

export function generateRandomPassItems(count, quota = 1) {
  const size = Number(count);
  const normalizedQuota = sanitizeQuota(quota);

  if (!Number.isInteger(size) || size < 1) {
    return {
      ok: false,
      message: "Số lượng pass phải là số nguyên lớn hơn 0.",
      items: [],
    };
  }

  if (!normalizedQuota) {
    return {
      ok: false,
      message: "Quota mặc định phải là số nguyên lớn hơn 0.",
      items: [],
    };
  }

  const seen = new Set();
  const items = [];

  while (items.length < size) {
    const pass = createRandomAlphabetPass(8);

    if (seen.has(pass)) continue;

    seen.add(pass);
    items.push({
      pass,
      quota: normalizedQuota,
      label: "",
    });
  }

  return {
    ok: true,
    message: "",
    items,
  };
}

export {
  PASS_FILE_ACCEPT,
  PASS_FILE_TEMPLATE_HEADER,
};
