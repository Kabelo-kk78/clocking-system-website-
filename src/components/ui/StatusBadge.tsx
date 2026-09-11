import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "on_time" | "late" | "no_show" | "active" | "inactive" | string;
}

const styles: Record<string, string> = {
  on_time: "bg-green-500/15 text-green-400 border-green-500/30",
  late: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  no_show: "bg-red-500/15 text-red-400 border-red-500/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  inactive: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
};

const labels: Record<string, string> = {
  on_time: "On Time",
  late: "Late",
  no_show: "No Show",
  active: "Active",
  inactive: "Inactive",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status] ?? styles.inactive
      )}
    >
      {labels[status] ?? status.replace("_", " ")}
    </span>
  );
}