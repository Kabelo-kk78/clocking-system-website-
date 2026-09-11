interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "amber" | "green" | "red" | "neutral";
}

const accents = {
  amber: "text-amber-400",
  green: "text-green-400",
  red: "text-red-400",
  neutral: "text-white",
};

export default function StatCard({ label, value, hint, accent = "neutral" }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accents[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}