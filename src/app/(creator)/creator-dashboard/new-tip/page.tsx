import { TipForm } from "@/components/creator-dashboard/tip-form";

export default function NewTipPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">Post a New Tip</h1>
        <p className="text-sm text-muted">
          Share your market call. It will be reviewed before going live.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-surface p-6">
        <TipForm />
      </div>
    </div>
  );
}
