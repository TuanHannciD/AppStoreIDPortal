"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Grid2x2,
  House,
  Info,
  MonitorPlay,
  ShieldCheck,
  Smartphone,
  UserRound,
  Vault,
} from "lucide-react";
import styles from "./HomeDashboard.module.css";

const HOME_DATA = {
  brand: "Apstoreviet",
  supportLabel: "Hỗ trợ",
  pageTitle: "Chi tiết thuê ID",
  pageSubtitle: "Quản lý và sử dụng tài khoản",
  app: {
    name: "Dead Cells",
    iconText: "DC",
  },
  metrics: [
    {
      icon: Grid2x2,
      label: "Tổng còn lại",
      value: "2/8",
    },
    {
      icon: Vault,
      label: "Hàng tháng",
      value: "1/2",
    },
    {
      icon: Info,
      label: "Thời gian",
      value: "45 phút",
    },
  ],
  health: {
    title: "Đang hoạt động",
    description: "Tài khoản ổn định",
    status: "Tốt",
  },
  warning:
    "Tuyệt đối không đăng nhập vào iCloud trong Cài đặt. Chỉ đăng nhập trong App Store.",
  videoLabel: "Xem video hướng dẫn lấy ID",
  guideSteps: [
    {
      title: "Đăng nhập App Store",
      description:
        "Mở App Store > Click Avatar góc phải trên cùng > Kéo xuống cuối cùng đăng xuất > Đăng nhập ID mới.",
    },
    {
      title: "Bỏ qua bảo mật",
      description:
        'Nếu hiện yêu cầu nâng cấp bảo mật, chọn "Các lựa chọn khác" > "Không nâng cấp" để tiếp tục.',
    },
    {
      title: "Tải ứng dụng",
      description:
        'Vào mục "Đã mua" (Purchased) > Tìm kiếm "Dead Cells" > Nhấn biểu tượng đám mây để tải về.',
    },
    {
      title: "Đăng xuất an toàn",
      description:
        "Sau khi tải xong, vui lòng đăng xuất ID ngay để tránh bị khóa và nhường lượt cho người khác.",
    },
  ],
  credentials: {
    appleId: "sample.email@icloud.com",
    password: "Q2x9-P7m1-R8t3",
  },
  note: {
    title: "Lưu ý về DLC & In-App",
    description:
      "Với các game có DLC hoặc mua trong ứng dụng (In-App Purchase), bạn cần mở game ít nhất 1 lần trong khi vẫn đang đăng nhập ID thuê để kích hoạt nội dung. Sau đó mới được đăng xuất.",
  },
  faqs: [
    {
      question: "Tại sao ID bị khóa?",
      answer:
        "Thường do đăng nhập sai nơi dùng, đăng nhập vào iCloud hoặc sử dụng đồng thời quá nhiều thiết bị trong thời gian ngắn.",
    },
    {
      question: "Làm sao để cập nhật game?",
      answer:
        "Đăng nhập lại ID thuê trong App Store, vào mục Purchased và cập nhật ứng dụng như bình thường.",
    },
    {
      question: "Game đòi mã xác thực 2 bước?",
      answer:
        "Hãy liên hệ hỗ trợ để được cấp lại thông tin hoặc nhận hướng dẫn xử lý cho phiên đăng nhập hiện tại.",
    },
  ],
  bottomNav: [
    { label: "Trang chủ", icon: House, active: false, href: "/" },
    { label: "ID của tôi", icon: Smartphone, active: true, href: "/" },
    { label: "Cá nhân", icon: UserRound, active: false, href: "/" },
  ],
};

export default function HomeDashboard() {
  const [showPassword, setShowPassword] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  function copyText(value) {
    if (!value) return;
    navigator.clipboard?.writeText(value);
  }

  return (
    <div className={styles.home}>
      <div className={styles.home__shell}>
        <header className={styles.home__header}>
          <Link href="/" className={styles.home__brand}>
            <span className={styles["home__brand-mark"]}>A</span>
            <span className={styles["home__brand-text"]}>{HOME_DATA.brand}</span>
          </Link>
          <button type="button" className={styles.home__support}>
            {HOME_DATA.supportLabel}
          </button>
        </header>

        <main className={styles.home__content}>
          <section className={styles.home__hero}>
            <div className={styles.home__titleBlock}>
              <h1 className={styles.home__title}>{HOME_DATA.pageTitle}</h1>
              <p className={styles.home__subtitle}>{HOME_DATA.pageSubtitle}</p>
            </div>

            <div className={styles.home__appCard}>
              <div className={styles.home__appIcon}>
                <span>{HOME_DATA.app.iconText}</span>
              </div>
              <div className={styles.home__appName}>{HOME_DATA.app.name}</div>
            </div>
          </section>

          <section className={styles.home__section}>
            <div className={styles.home__sectionLabel}>Trạng thái tài khoản</div>

            <div className={styles.home__statusGrid}>
              {HOME_DATA.metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <article key={metric.label} className={styles.home__statusCard}>
                    <div className={styles.home__statusIcon}>
                      <Icon size={14} />
                    </div>
                    <div className={styles.home__statusLabel}>{metric.label}</div>
                    <div className={styles.home__statusValue}>{metric.value}</div>
                  </article>
                );
              })}
            </div>

            <article className={styles["home__health-card"]}>
              <div className={styles["home__health-main"]}>
                <span className={styles["home__health-icon"]}>
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <div className={styles["home__health-title"]}>
                    {HOME_DATA.health.title}
                  </div>
                  <div className={styles["home__health-description"]}>
                    {HOME_DATA.health.description}
                  </div>
                </div>
              </div>
              <span className={styles["home__health-badge"]}>
                {HOME_DATA.health.status}
              </span>
            </article>
          </section>

          <div className={styles.home__scrollHint}>
            <span>Vuốt xuống dưới để xem thông tin ID</span>
            <ChevronDown size={16} />
          </div>

          <section className={styles["home__alert-card"]}>
            <div className={styles["home__alert-icon"]}>
              <AlertTriangle size={16} />
            </div>
            <div className={styles["home__alert-content"]}>
              <div className={styles["home__alert-title"]}>Cảnh báo quan trọng:</div>
              <p className={styles["home__alert-text"]}>{HOME_DATA.warning}</p>
            </div>
          </section>

          <section className={styles.home__section}>
            <div className={styles.home__sectionLabel}>Hướng dẫn sử dụng</div>

            <div className={styles.home__videoCard}>
              <div className={styles.home__videoPlay}>
                <MonitorPlay size={22} />
              </div>
              <div className={styles.home__videoLabel}>{HOME_DATA.videoLabel}</div>
            </div>

            <div className={styles.home__guideList}>
              {HOME_DATA.guideSteps.map((step, index) => (
                <article key={step.title} className={styles.home__guideStep}>
                  <div className={styles.home__guideIndex}>{index + 1}</div>
                  <div className={styles.home__guideBody}>
                    <div className={styles.home__guideTitle}>{step.title}</div>
                    <p className={styles.home__guideDescription}>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.home__section}>
            <div className={styles.home__sectionLabel}>Thông tin đăng nhập</div>

            <article className={styles.home__credentialCard}>
              <div className={styles.home__credentialRow}>
                <div className={styles.home__credentialLabel}>Apple ID</div>
                <div className={styles.home__credentialValue}>
                  {HOME_DATA.credentials.appleId}
                </div>
              </div>

              <div className={styles.home__credentialDivider} />

              <div className={styles.home__credentialRow}>
                <div className={styles.home__credentialLabel}>Mật khẩu</div>
                <div className={styles.home__credentialActions}>
                  <button
                    type="button"
                    className={styles.home__iconButton}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    className={styles.home__iconButton}
                    onClick={() => copyText(HOME_DATA.credentials.password)}
                    aria-label="Copy mật khẩu"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className={styles.home__credentialSecret}>
                  {showPassword
                    ? HOME_DATA.credentials.password
                    : "* * * * * * * * * * * *"}
                </div>
              </div>
            </article>
          </section>

          <section className={styles["home__note-card"]}>
            <div className={styles["home__note-icon"]}>
              <AlertTriangle size={18} />
            </div>
            <div className={styles["home__note-content"]}>
              <div className={styles["home__note-title"]}>{HOME_DATA.note.title}</div>
              <p className={styles["home__note-text"]}>{HOME_DATA.note.description}</p>
            </div>
          </section>

          <section className={styles.home__section}>
            <div className={styles.home__sectionLabel}>Câu hỏi thường gặp</div>

            <div className={styles.home__faqList}>
              {HOME_DATA.faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <article key={faq.question} className={styles.home__faqItem}>
                    <button
                      type="button"
                      className={styles.home__faqQuestion}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    >
                      <span>{faq.question}</span>
                      <span className={styles.home__faqChevron}>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className={styles.home__faqAnswer}>{faq.answer}</div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        <nav className={styles.home__bottomNav}>
          {HOME_DATA.bottomNav.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.home__bottomNavItem} ${
                  item.active ? styles["home__bottomNavItem--active"] : ""
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
