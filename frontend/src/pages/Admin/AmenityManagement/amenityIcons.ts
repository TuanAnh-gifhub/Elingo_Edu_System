import type React from "react";
import {
  FaWifi,
  FaSnowflake,
  FaPlug,
  FaChalkboard,
  FaVideo,
  FaTv,
  FaMicrophone,
  FaVolumeUp,
  FaLightbulb,
  FaUsers,
  FaChair,
  FaChalkboardTeacher,
  FaPen,
  FaDesktop,
  FaPrint,
  FaServer,
  FaNetworkWired,
  FaKeyboard,
  FaHeadphones,
  FaWind,
  FaRulerCombined,
  FaFan,
  FaTint,
  FaCouch,
  FaDoorClosed,
} from "react-icons/fa";

/* =======================================================
   1️⃣  Union type phải chứa TẤT CẢ icon bạn muốn dùng
======================================================= */

export type AmenityIconKey =
  | "FaWifi"
  | "FaSnowflake"
  | "FaPlug"
  | "FaChalkboard"
  | "FaVideo"
  | "FaTv"
  | "FaMicrophone"
  | "FaVolumeUp"
  | "FaLightbulb"
  | "FaUsers"
  | "FaChair"
  | "FaChalkboardTeacher"
  | "FaPen"
  | "FaDesktop"
  | "FaPrint"
  | "FaServer"
  | "FaNetworkWired"
  | "FaKeyboard"
  | "FaHeadphones"
  | "FaWind"
  | "FaRulerCombined"
  | "FaFan"
  | "FaTint"
  | "FaCouch"
  | "FaDoorClosed";

/* =======================================================
   2️⃣  Map key -> Component
======================================================= */

export const AMENITY_ICON_MAP: Record<
  AmenityIconKey,
  React.ComponentType<{ className?: string }>
> = {
  FaWifi,
  FaSnowflake,
  FaPlug,
  FaChalkboard,
  FaVideo,
  FaTv,
  FaMicrophone,
  FaVolumeUp,
  FaLightbulb,
  FaUsers,
  FaChair,
  FaChalkboardTeacher,
  FaPen,
  FaDesktop,
  FaPrint,
  FaServer,
  FaNetworkWired,
  FaKeyboard,
  FaHeadphones,
  FaWind,
  FaRulerCombined,
  FaFan,
  FaTint,
  FaCouch,
  FaDoorClosed,
};

/* =======================================================
   3️⃣  Option cho Select
======================================================= */

export const AMENITY_ICON_OPTIONS: {
  value: AmenityIconKey;
  label: string;
}[] = [
  { value: "FaWifi", label: "WiFi" },
  { value: "FaSnowflake", label: "Máy lạnh" },
  { value: "FaPlug", label: "Ổ điện" },
  { value: "FaChalkboard", label: "Bảng trắng" },
  { value: "FaVideo", label: "Máy chiếu" },
  { value: "FaTv", label: "TV / Màn hình lớn" },
  { value: "FaMicrophone", label: "Micro" },
  { value: "FaVolumeUp", label: "Loa" },
  { value: "FaLightbulb", label: "Đèn LED" },
  { value: "FaUsers", label: "Bàn họp" },
  { value: "FaChair", label: "Ghế" },
  { value: "FaChalkboardTeacher", label: "Bảng điện tử" },
  { value: "FaPen", label: "Bút trình chiếu" },
  { value: "FaDesktop", label: "Máy tính" },
  { value: "FaPrint", label: "Máy in" },
  { value: "FaServer", label: "Server" },
  { value: "FaNetworkWired", label: "Thiết bị mạng" },
  { value: "FaKeyboard", label: "Bàn phím" },
  { value: "FaHeadphones", label: "Tai nghe" },
  { value: "FaWind", label: "Hệ thống thông gió" },
  { value: "FaRulerCombined", label: "Thiết bị đo lường" },
  { value: "FaFan", label: "Quạt" },
  { value: "FaTint", label: "Máy lọc nước" },
  { value: "FaCouch", label: "Khu nghỉ ngơi" },
  { value: "FaDoorClosed", label: "Cửa cách âm" },
];
