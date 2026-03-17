import "./globals.css";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import AppFrame from "@/components/layout/AppFrame";

export const metadata = {
  title: "Customer Portal · App Store ID Access",
  description:
    "Self-service portal for viewing packages, quotas, and credential access (mock).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppFrame>{children}</AppFrame>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
