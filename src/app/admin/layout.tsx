import AdminSidebarDesktop from "@/components/AdminSidebarDesktop";

/**
 * Admin shell layout:
 * - Mobile:  no sidebar, children full-width (FAB + bottom sheet handle nav)
 * - Desktop: fixed 224px sidebar on the left, content shifts right with sm:pl-56
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminSidebarDesktop />
      <div className="sm:pl-56">
        {children}
      </div>
    </>
  );
}
