import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAdminUser();

  return <AdminShell currentUser={currentUser}>{children}</AdminShell>;
}
