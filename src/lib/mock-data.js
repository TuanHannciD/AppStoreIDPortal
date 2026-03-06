/**
 * Nguồn dữ liệu giả lập trung tâm (Central Mock Data).
 * Sau này, hãy thay thế các cấu trúc này bằng phản hồi từ API thật.
 */

const now = new Date();

/**
 * Hàm tiện ích: Tạo định dạng ngày ISO dựa trên số ngày tính từ hiện tại.
 * @param {number} days - Số ngày cộng thêm hoặc trừ đi.
 */
function isoDaysFromNow(days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// 1. ĐỊNH NGHĨA CÁC LOẠI GÓI (PACKAGE TYPES)
export const PACKAGE_TYPES = {
  STANDARD: "STANDARD", // Gói tiêu chuẩn
  FULL_DLC: "FULL_DLC", // Gói đầy đủ DLC (Nội dung tải thêm)
  FULL_INAPP: "FULL_INAPP", // Gói đầy đủ In-App (Mua trong ứng dụng)
};

// 2. DANH SÁCH CÁC GÓI ĐĂNG KÝ (PLANS)
export const PLANS = [
  {
    id: "plan_standard_30d",
    name: "Truy cập Tiêu chuẩn (30 ngày)",
    packageType: PACKAGE_TYPES.STANDARD,
    monthlyQuota: 30, // Hạn mức mỗi tháng
    notes: ["Truy cập cơ bản với các giới hạn sử dụng tiêu chuẩn."],
  },
  {
    id: "plan_full_dlc_30d",
    name: "Truy cập Toàn bộ DLC (30 ngày)",
    packageType: PACKAGE_TYPES.FULL_DLC,
    monthlyQuota: 30,
    notes: [
      "Bao gồm quyền tải xuống các nội dung DLC.",
      "Yêu cầu các bước kích hoạt đặc biệt sau khi tải xuống.",
    ],
  },
  {
    id: "plan_full_inapp_30d",
    name: "Truy cập Toàn bộ In-App (30 ngày)",
    packageType: PACKAGE_TYPES.FULL_INAPP,
    monthlyQuota: 30,
    notes: [
      "Bao gồm các vật phẩm trong ứng dụng (nếu có).",
      "Yêu cầu các bước xác minh đặc biệt.",
    ],
  },
];

// 3. CÂU HỎI THƯỜNG GẶP CHUNG (COMMON FAQ)
const FAQ_COMMON = [
  {
    id: "faq_reveal",
    q: "Khi nào tôi nên hiển thị mật khẩu?",
    a: "Chỉ hiển thị mật khẩu khi bạn đã sẵn sàng đăng nhập. Tránh việc hiển thị lặp đi lặp lại trên nhiều thiết bị.",
  },
  {
    id: "faq_limits",
    q: "Tại sao tôi lại có hạn mức sử dụng (quota)?",
    a: "Hạn mức được dùng để quản lý sự công bằng và giảm thiểu tình trạng khóa tài khoản. Số dư hạn mức được hiển thị trên trang của ứng dụng.",
  },
  {
    id: "faq_reset",
    q: "Khi nào hạn mức tháng được đặt lại?",
    a: "Hạn mức sẽ được đặt lại theo chu kỳ hàng tháng (logic giả lập). Nhà cung cấp sẽ quy định quy tắc đặt lại thực tế.",
  },
];

// 4. DANH SÁCH ỨNG DỤNG (APPS)
const APPS = [
  {
    id: "app_deadcells",
    slug: "deadcells",
    name: "Dead Cells",
    packageType: PACKAGE_TYPES.FULL_DLC,
    description:
      "Cổng truy cập thuê game Dead Cells. Bao gồm xử lý đặc biệt để kích hoạt DLC sau khi tải về (giả lập).",
    subscription: {
      status: "ACTIVE", // Trạng thái: ACTIVE (Hoạt động) | PAUSED (Tạm dừng) | EXPIRED (Hết hạn)
      planId: "plan_full_dlc_30d",
      quotaTotal: 120, // Tổng hạn mức tổng thể
      quotaRemainingTotal: 84, // Tổng hạn mức còn lại
      monthlyUsed: 12, // Đã dùng trong tháng
      monthlyRemaining: 18, // Còn lại trong tháng
      expiresAt: isoDaysFromNow(22), // Ngày hết hạn
    },
    credentials: {
      status: "READY", // Trạng thái: READY (Sẵn sàng) | LOCKED (Đang khóa) | COOLDOWN (Chờ hồi chiêu)
      accountEmail: "rent.deadcells.001@icloud.example",
      password: "MockPass#Deadcells-001",
      lastRevealedAt: isoDaysFromNow(-1),
      cooldownMinutes: 10,
      notes: [
        'Không được bật "Find My" trên tài khoản này.',
        "Không được thay đổi mật khẩu.",
      ],
    },
    faq: [
      ...FAQ_COMMON,
      {
        id: "faq_dlc",
        q: "Tôi có cần làm gì sau khi tải xuống DLC không?",
        a: "Có. Hãy mở ứng dụng một lần để đảm bảo nội dung DLC được nhận diện, sau đó bạn có thể đăng xuất.",
      },
    ],
    guide: {
      steps: [
        "Vào Cài đặt → App Store → Đăng xuất (nếu đang đăng nhập tài khoản khác).",
        "Đăng nhập bằng ID App Store và mật khẩu được cung cấp.",
        "Tải xuống ứng dụng và bất kỳ nội dung yêu cầu nào.",
        "Mở ứng dụng một lần để xác minh ứng dụng hoạt động và có đủ nội dung.",
        "Sau khi xác minh, hãy đăng xuất để tránh đồng bộ hóa ngoài ý muốn.",
      ],
      notes: [
        "Tránh đăng nhập trên nhiều thiết bị cùng lúc.",
        ' nếu thấy trạng thái "Cooldown", hãy đợi một lát trước khi thử lại.',
      ],
    },
  },
  {
    id: "app_stardew",
    slug: "stardewvalley",
    name: "Stardew Valley",
    packageType: PACKAGE_TYPES.STANDARD,
    description: "Cổng truy cập thuê game Stardew Valley tiêu chuẩn (giả lập).",
    subscription: {
      status: "ACTIVE",
      planId: "plan_standard_30d",
      quotaTotal: 60,
      quotaRemainingTotal: 44,
      monthlyUsed: 6,
      monthlyRemaining: 24,
      expiresAt: isoDaysFromNow(10),
    },
    credentials: {
      status: "READY",
      accountEmail: "rent.stardew.014@icloud.example",
      password: "MockPass#Stardew-014",
      lastRevealedAt: isoDaysFromNow(-3),
      cooldownMinutes: 5,
      notes: [
        "Không thay đổi cài đặt bảo mật tài khoản.",
        "Chỉ dùng để tải/khôi phục và đăng xuất ngay sau đó.",
      ],
    },
    faq: FAQ_COMMON,
    guide: {
      steps: [
        "Đăng xuất tài khoản App Store hiện có trên thiết bị.",
        "Đăng nhập bằng thông tin App Store ID được cung cấp.",
        "Tải ứng dụng từ App Store.",
        "Khởi chạy ứng dụng một lần để xác nhận hoạt động, sau đó đăng xuất.",
      ],
      notes: [
        "Nếu không thể đăng nhập, hãy đợi vài phút và thử lại (có thể do thời gian hồi chiêu).",
      ],
    },
  },
];

// 5. CÁC HÀM XUẤT DỮ LIỆU (GETTER FUNCTIONS)

/**
 * Lấy tất cả ứng dụng (Dùng cho danh sách rút gọn)
 */
export function getAllApps() {
  return APPS.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    packageType: a.packageType,
  }));
}

/**
 * Lấy danh sách ứng dụng công khai (Không bao gồm thông tin đăng nhập/mật khẩu)
 */
export function getAllAppsPublic() {
  return APPS.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    packageType: a.packageType,
    subscription: {
      status: a.subscription.status,
      expiresAt: a.subscription.expiresAt,
    },
  }));
}

/**
 * Lấy thông tin chi tiết ứng dụng theo Slug
 * @param {string} slug - Đường dẫn định danh ứng dụng
 */
export function getAppBySlug(slug) {
  const key = String(slug || "").toLowerCase();
  const app = APPS.find((a) => a.slug === key);
  if (!app) return null;

  return {
    ...app,
    plan: PLANS.find((p) => p.id === app.subscription.planId) || null,
  };
}

/**
 * Kiểm tra xem loại gói có phải là loại đặc biệt (DLC/In-App) không
 */
export function isSpecialPackageType(packageType) {
  return (
    packageType === PACKAGE_TYPES.FULL_DLC ||
    packageType === PACKAGE_TYPES.FULL_INAPP
  );
}
