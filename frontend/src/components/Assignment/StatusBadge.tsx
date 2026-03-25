type BadgeTone = "blue" | "emerald" | "amber" | "red" | "slate" | "violet";

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
  className?: string;
};

const toneClassMap: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

export const StatusBadge = ({ label, tone = "slate", className = "" }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClassMap[tone]} ${className}`}
    >
      {label}
    </span>
  );
};

export const DeadlineBadge = ({ deadline }: { deadline?: string }) => {
  if (!deadline) {
    return <StatusBadge label="Khong co deadline" tone="slate" />;
  }

  const isExpired = new Date(deadline).getTime() < Date.now();
  return <StatusBadge label={isExpired ? "Da het han" : "Con han"} tone={isExpired ? "red" : "amber"} />;
};

export const SubmissionStatusBadge = ({
  status,
}: {
  status?: "SUBMITTED" | "IN_REVIEW" | "GRADED";
}) => {
  if (status === "GRADED") {
    return <StatusBadge label="Da cham" tone="emerald" />;
  }

  if (status === "IN_REVIEW") {
    return <StatusBadge label="Dang cham" tone="amber" />;
  }

  if (status === "SUBMITTED") {
    return <StatusBadge label="Da nop" tone="blue" />;
  }

  return <StatusBadge label="Chua nop" tone="slate" />;
};

