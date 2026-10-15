const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-50 text-success",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-danger",
  cancelled: "bg-gray-100 text-gray-600",
  refunded: "bg-gray-100 text-gray-600",
};

export function StatusPill({ s }: { s: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLE[s] ?? "bg-sand"}`}>
      {s === "pending" ? "Awaiting payment" : s}
    </span>
  );
}
