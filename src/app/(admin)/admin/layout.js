import AdminSidebarShell from "@/components/admin/AdminSidebarShell";

/**
 * Layout dùng chung cho mọi route trong `/admin`.
 */
export default function AdminLayout({ children }) {
  return <AdminSidebarShell>{children}</AdminSidebarShell>;
}
