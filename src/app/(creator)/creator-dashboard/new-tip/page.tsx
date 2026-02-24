import { TipForm } from "@/components/creator-dashboard/tip-form";

export default function NewTipPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gradient-primary">Post a New Tip</h1>
        <p className="text-sm text-muted">
          Share your market call. It will be reviewed before going live.
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(26,54,93,0.06),0_1px_2px_-1px_rgba(26,54,93,0.06)] p-6">
        <TipForm />
      </div>
    </div>
  );
}
