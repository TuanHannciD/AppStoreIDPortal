import { SHARE_ACCOUNT_RESPONSE_TEMPLATE } from "@/lib/share-account-response.template";

/**
 * Đọc dữ liệu theo path dạng "data.account.email".
 * Đây là hàm nền để mapper chạy theo template path do bạn cấu hình.
 */
function getByPath(obj, path) {
  // Nếu object không có hoặc path rỗng thì trả null cho an toàn.
  if (!obj || !path) return null;

  // Tách path thành từng key nhỏ rồi đi lần lượt qua object.
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Chuẩn hóa response lỗi thành format chung của mapper.
 * Hàm này giúp route reveal không phải tự build lỗi ở nhiều nơi.
 */
function buildErrorResult({ errorType, message, httpStatus, sourceCode, rawKind, preview }) {
  // Trả về một object lỗi thống nhất để bên gọi xử lý dễ hơn.
  return {
    // Đánh dấu mapper thất bại.
    ok: false,

    // Phân loại lỗi để route reveal có thể map ra status nội bộ.
    errorType,

    // Message ưu tiên để hiển thị hoặc ghi log.
    message,

    // Meta giữ lại thêm ngữ cảnh gốc từ API ngoài để debug.
    meta: {
      httpStatus: httpStatus ?? null,
      sourceCode: sourceCode ?? null,
      rawKind: rawKind ?? null,
      preview: preview ?? null,
    },
  };
}

/**
 * Dùng template để đọc trạng thái thành công từ body API ngoài.
 * Trả về true khi body[successPath] === successValue.
 */
function isTemplateSuccess(body, template) {
  // Lấy giá trị thực tế của field success từ body.
  const actualValue = getByPath(body, template.successPath);

  // So sánh đúng theo giá trị thành công mà template định nghĩa.
  return actualValue === template.successValue;
}

/**
 * Dùng template để lấy message lỗi từ response thất bại.
 */
function getTemplateErrorMessage(body, template) {
  // Đọc đúng path được cấu hình trong template.
  return getByPath(body, template.errorMessagePath) || "API ngoài trả về lỗi nghiệp vụ.";
}

/**
 * Dùng template để lấy mã lỗi từ response thất bại.
 */
function getTemplateErrorCode(body, template) {
  // Đọc đúng path được cấu hình trong template.
  return getByPath(body, template.errorCodePath);
}

/**
 * Dùng template để lấy object account thô từ body thành công.
 */
function getTemplateDataObject(body, template) {
  // Nếu template không khai báo dataPath thì dùng luôn body gốc.
  if (!template.dataPath) {
    return body;
  }

  // Lấy object data theo path mà template chỉ định.
  return getByPath(body, template.dataPath);
}

/**
 * Dùng fieldMap trong template để map object API ngoài về account nội bộ.
 */
function normalizeAccountWithTemplate(dataObject, template) {
  // Nếu dataObject không phải object thì không map tiếp được.
  if (!dataObject || typeof dataObject !== "object" || Array.isArray(dataObject)) {
    return null;
  }

  // Tạo object account chuẩn mà hệ thống nội bộ đang sử dụng.
  const normalized = {
    // Mỗi field nội bộ sẽ lấy dữ liệu theo path được cấu hình trong fieldMap.
    title: getByPath(dataObject, template.fieldMap.title),
    email: getByPath(dataObject, template.fieldMap.email),
    username: getByPath(dataObject, template.fieldMap.username),
    password: getByPath(dataObject, template.fieldMap.password),
    twoFaKey: getByPath(dataObject, template.fieldMap.twoFaKey),
    backupCode: getByPath(dataObject, template.fieldMap.backupCode),
    note: getByPath(dataObject, template.fieldMap.note),
  };

  // Kiểm tra ít nhất một field bắt buộc phải có dữ liệu thì mới coi là hợp lệ.
  const hasRequiredValue = template.requiredFields.some(
    (fieldName) => normalized[fieldName] !== undefined
      && normalized[fieldName] !== null
      && normalized[fieldName] !== "",
  );

  // Nếu không có field bắt buộc nào thì coi như response không đúng mẫu mong đợi.
  if (!hasRequiredValue) {
    return null;
  }

  // Trả account đã được map đúng theo template.
  return normalized;
}

/**
 * Hàm chính của mapper theo hướng template-driven.
 * Input là rawResponse đã được route reveal chuẩn hóa sau khi fetch API ngoài.
 * Output luôn chỉ có 2 dạng:
 * - ok: true + account
 * - ok: false + thông tin lỗi chuẩn hóa
 */
export function mapExternalAccountResponse(
  rawResponse,
  template = SHARE_ACCOUNT_RESPONSE_TEMPLATE,
) {
  // Nếu rawResponse không tồn tại thì coi như lỗi hệ thống khi fetch.
  if (!rawResponse || typeof rawResponse !== "object") {
    return buildErrorResult({
      errorType: "INVALID_RAW_RESPONSE",
      message: "Không nhận được phản hồi hợp lệ từ API ngoài.",
      rawKind: "invalid-input",
    });
  }

  // Lấy các phần quan trọng ra để xử lý.
  const { ok, httpStatus, contentType, body, bodyText } = rawResponse;

  // Nếu HTTP fail và không có body để phân tích thì trả lỗi HTTP trực tiếp.
  if (!ok && (body === undefined || body === null || body === "")) {
    return buildErrorResult({
      errorType: "EXTERNAL_HTTP_ERROR",
      message: `API ngoài trả về HTTP ${httpStatus}`,
      httpStatus,
      rawKind: "http-error-empty-body",
      preview: bodyText ?? null,
    });
  }

  // Nếu body không phải object JSON thì báo lỗi format.
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return buildErrorResult({
      errorType: "UNSUPPORTED_RESPONSE_FORMAT",
      message: "API ngoài không trả object JSON đúng như template mong đợi.",
      httpStatus,
      rawKind: contentType || "non-object-response",
      preview: body ?? bodyText ?? null,
    });
  }

  // Nếu response không đạt điều kiện thành công theo template thì coi là lỗi nghiệp vụ.
  if (!isTemplateSuccess(body, template)) {
    return buildErrorResult({
      errorType: "EXTERNAL_API_ERROR",
      message: getTemplateErrorMessage(body, template),
      httpStatus,
      sourceCode: getTemplateErrorCode(body, template),
      rawKind: "template-declared-error",
      preview: body,
    });
  }

  // Lấy object account thô từ đúng vị trí mà template chỉ định.
  const dataObject = getTemplateDataObject(body, template);

  // Map object account thô về schema nội bộ.
  const account = normalizeAccountWithTemplate(dataObject, template);

  // Nếu map không ra account hợp lệ thì báo response sai mẫu.
  if (!account) {
    return buildErrorResult({
      errorType: "ACCOUNT_FORMAT_INVALID",
      message: "Response thành công nhưng dữ liệu account không khớp template đã cấu hình.",
      httpStatus,
      rawKind: "template-map-failed",
      preview: dataObject ?? body,
    });
  }

  // Nếu map thành công thì trả object chuẩn cho route reveal dùng lại.
  return {
    ok: true,
    account,
    meta: {
      httpStatus: httpStatus ?? null,
      contentType: contentType ?? null,
    },
  };
}

/**
 * Hàm phụ trợ để route reveal dễ chuẩn hóa fetch response trước khi đưa vào mapper.
 * Hàm này không gọi network, chỉ nhận dữ liệu đã parse sẵn và trả về rawResponse chuẩn.
 */
export function createExternalRawResponse({
  ok,
  httpStatus,
  contentType,
  body,
  bodyText,
  headers,
}) {
  // Trả object rawResponse chuẩn mà mapExternalAccountResponse đang mong đợi.
  return {
    ok: Boolean(ok),
    httpStatus: httpStatus ?? null,
    contentType: contentType ?? null,
    body: body ?? null,
    bodyText: bodyText ?? null,
    headers: headers ?? null,
  };
}
