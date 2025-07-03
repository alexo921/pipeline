import Sidebar from "../components/dashboard-layout/SideBar";
import DashboardLayout from "../components/dashboard-layout/DashboardLayout";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      showNav={true}
      showFooter={false}
      customBackground="linear-gradient(180deg, #F0F4F8 0%, #D9E2EC 100%)"
    >
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 p-6 bg-[#F4F5FF]">{children}</main>
      </div>
    </DashboardLayout>
  );
}
