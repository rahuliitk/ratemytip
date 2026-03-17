import { MyTipsTable } from "@/components/creator-dashboard/my-tips-table";

export default function MyTipsPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-text">My Tips</h1>
        <p className="text-sm text-muted">
          View and manage all your posted tips
        </p>
      </div>
      <MyTipsTable />
    </div>
  );
}
