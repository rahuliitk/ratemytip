import { MyTipsTable } from "@/components/creator-dashboard/my-tips-table";

export default function MyTipsPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gradient-primary">My Tips</h1>
      <p className="text-sm text-muted">
        View and manage all your posted tips
      </p>
      <MyTipsTable />
    </div>
  );
}
