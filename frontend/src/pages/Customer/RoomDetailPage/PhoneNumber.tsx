import { useMemo, useState } from "react";

/**
 * Tailwind-variant utilities
 */
const SIZE = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-2.5 text-lg",
};

const COLORS = {
  teal: {
    solid: "bg-[#4da6ff] text-white hover:bg-[#3d8cff] focus:ring-2 focus:ring-[#4da6ff]/30",
    outline:
      "bg-white text-[#4da6ff] border border-[#4da6ff] hover:bg-[#4da6ff]/5 focus:ring-2 focus:ring-[#4da6ff]/30",
  },
  gray: {
    solid: "bg-gray-900 text-white hover:brightness-95 focus:ring-2 focus:ring-gray-300",
    outline:
      "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200",
  },
};

const BASE =
  "inline-flex items-center gap-1 rounded-full font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Helper gộp class (nhẹ, không cần thư viện)
 */
function cx(...arr: (string | boolean | undefined)[]): string {
  return arr.filter(Boolean).join(" ");
}

interface PhoneNumberProps {
  phone?: string;
  requireAuth?: (callback: () => void) => void;
  // === Styling props ===
  className?: string;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  color?: "teal" | "gray";
  // === UX text props ===
  label?: string;
  revealText?: string;
  maskedPrefix?: number;
  icon?: React.ReactNode;
}

export default function PhoneNumber({
  phone,
  requireAuth,
  // === Styling props ===
  className = "",
  variant = "outline",
  size = "sm",
  color = "teal",
  // === UX text props ===
  label = "SĐT liên hệ:",
  revealText = "Hiện thêm",
  maskedPrefix = 6,
  icon,
}: PhoneNumberProps) {
  const [showFullPhone, setShowFullPhone] = useState(false);

  const masked = useMemo(() => {
    if (!phone) return "";
    const prefix = phone.slice(0, Math.max(0, maskedPrefix));
    return `${prefix}***`;
  }, [phone, maskedPrefix]);

  const classes = useMemo(() => {
    const palette = COLORS[color] ?? COLORS.teal;
    const variantCls = palette[variant] ?? palette.outline;
    const sizeCls = SIZE[size] ?? SIZE.sm;
    return cx(BASE, sizeCls, variantCls, className);
  }, [color, variant, size, className]);

  const handleShowPhone = () => {
    // Sử dụng requireAuth giống như header
    if (requireAuth) {
      requireAuth(() => {
        setShowFullPhone(true);
      });
    } else {
      // Nếu không có requireAuth, hiển thị số ngay (fallback)
      setShowFullPhone(true);
    }
  };

  // Khi đã hiện số => dùng <a> để click gọi trực tiếp, style như button
  if (showFullPhone) {
    return (
      <a
        href={phone ? `tel:${phone}` : undefined}
        className={classes}
        aria-label={`${label} ${phone}`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        <span className="opacity-80 mr-1">{label}</span>
        <span className="underline underline-offset-2">{phone}</span>
      </a>
    );
  }

  // Chưa hiện số => button để mở khoá xem số
  return (
    <button
      type="button"
      onClick={handleShowPhone}
      className={classes}
      aria-label={`${label} ${masked}. ${revealText}`}
    >
      {icon && <span>{icon}</span>}
      <span className="opacity-80">{label}</span>
      <span className="tabular-nums">{masked}</span>
      <span className="ml-1 font-semibold">{revealText}</span>
    </button>
  );
}
