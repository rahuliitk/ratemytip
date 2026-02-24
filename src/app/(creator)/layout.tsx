import { CreatorSidebar } from "@/components/creator-dashboard/creator-sidebar";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-56">
          <h2 className="mb-4 text-lg font-bold text-primary">Creator Dashboard</h2>
          <CreatorSidebar />
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
