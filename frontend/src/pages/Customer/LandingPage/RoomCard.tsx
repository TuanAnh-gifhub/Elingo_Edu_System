import { motion } from "framer-motion";
import { FaUsers, FaWifi, FaDesktop, FaLeaf, FaPalette, FaMicrophone, FaHeart, FaShare, FaBed } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export interface RoomCardProps {
  id: string | number;
  title: string;
  location: string;
  capacity: string;
  price: number;
  image?: string | null;
  listingId?: string | number;
  feature?: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  };
  onClick?: () => void;
  variant?: 'large' | 'small' | 'wide' | 'compact';
  showOverlay?: boolean;
}

// Template data for demo
const TEMPLATE_ROOMS: Omit<RoomCardProps, 'onClick'>[] = [
  {
    id: 1,
    title: "Lớp Tiếng Anh Giao Tiếp 1-1",
    location: "Online hoặc Quận 1, TP.HCM",
    capacity: "1-2 học viên",
    price: 15,
    feature: { icon: FaDesktop, label: "Lịch học linh hoạt" },
  },
  {
    id: 2,
    title: "Lớp Luyện Thi IELTS Nhóm Nhỏ",
    location: "Quận 3, TP.HCM",
    capacity: "4-8 học viên",
    price: 45,
    feature: { icon: FaMicrophone, label: "Giáo viên 8.0+ IELTS" },
  },
  {
    id: 3,
    title: "Khóa Kỹ Năng Thuyết Trình",
    location: "Trung tâm kỹ năng, Quận 10",
    capacity: "10-20 học viên",
    price: 60,
    feature: { icon: FaWifi, label: "Workshop tương tác" },
  },
  {
    id: 4,
    title: "Lớp Lập Trình Web Cơ Bản",
    location: "Online qua Zoom",
    capacity: "8-15 học viên",
    price: 35,
    feature: { icon: FaDesktop, label: "Dự án thực hành" },
  },
  {
    id: 5,
    title: "Lớp Toán Tư Duy Cho Trẻ",
    location: "Quận Bình Thạnh, TP.HCM",
    capacity: "6-10 học viên",
    price: 20,
    feature: { icon: FaLeaf, label: "Giáo trình trực quan" },
  },
  {
    id: 6,
    title: "Khóa Kỹ Năng Mềm Cho Nhân Sự",
    location: "Doanh nghiệp, in-house",
    capacity: "15-25 học viên",
    price: 120,
    feature: { icon: FaPalette, label: "Thiết kế riêng cho DN" },
  },
];

const RoomCard = ({
  id,
  title,
  location,
  capacity,
  price,
  image,
  listingId,
  feature,
  onClick,
  variant = 'small',
  showOverlay = false
}: RoomCardProps) => {
  const navigate = useNavigate();
  const FeatureIcon = feature?.icon || FaUsers;
  const [isFavorite, setIsFavorite] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Điều hướng đến trang chi tiết lớp học theo id lớp
      navigate(`/classes/${id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality
  };

  const isLarge = variant === 'large';
  const isWide = variant === 'wide';
  const isCompact = variant === 'compact';
  // Large card adjusted to match right side total height (~554px)
  // Wide card: ~260px, Small cards: each ~95px (total 190px), Gap: 24px = 474px
  // Large card set to ~462px to match right side
  // Compact cards: for "Phòng học mới nhất" with reduced content
  // Small cards: original size for "Đặt Phòng Học Trực Tuyến"
  const imageHeight = isLarge ? 'h-[462px]' : isWide ? 'h-[210px]' : isCompact ? 'h-[132px]' : 'h-52';
  const cardHeight = isLarge ? 'h-full' : 'h-full';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 ${cardHeight} flex flex-col relative`}>
        {/* Image Container */}
        <div className={`relative ${imageHeight} overflow-hidden bg-gray-200`}>
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm font-medium">No Image</span>
            </div>
          )}

          {/* Heart Icon */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-all duration-200 z-10"
          >
            <FaHeart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </button>

          {/* Share Icon - Only for large variant */}
          {isLarge && (
            <button
              onClick={handleShareClick}
              className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-all duration-200 z-10"
            >
              <FaShare className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Overlay with price and title - Only for large variant with showOverlay */}
          {isLarge && showOverlay && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 text-white">
              <div className="text-3xl font-bold mb-3">${price}/hr</div>
              <div className="text-xl font-semibold mb-1">{title}</div>
              <div className="text-base font-medium mb-1 opacity-90">{location}</div>
              <div className="text-sm font-medium mb-4 opacity-80">{feature?.label || 'Equipped'}</div>

              {/* Feature Icons */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <FaBed className="w-4 h-4 opacity-80" />
                  <span className="text-sm">1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaUsers className="w-4 h-4 opacity-80" />
                  <span className="text-sm">{capacity.split('-')[1]?.replace(' people', '') || '12'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaWifi className="w-4 h-4 opacity-80" />
                  <span className="text-sm">1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FaDesktop className="w-4 h-4 opacity-80" />
                  <span className="text-sm">1</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="text-sm font-medium underline hover:no-underline opacity-90 hover:opacity-100 transition-opacity"
              >
                Xem tất cả lớp học
              </button>
            </div>
          )}

        </div>

        {/* Content - Only for small variant, wide variant, or large without overlay */}
        {(!isLarge || !showOverlay) && (
          <div className={`flex-1 flex ${isWide ? 'flex-row items-center justify-between px-3 py-2 gap-3' : isCompact ? 'flex-col px-2 py-1' : 'flex-col p-4'}`}>
            {isWide ? (
              <>
                {/* Title and Location in one line for wide variant */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-gray-900 line-clamp-1 group-hover:text-[#4da6ff] transition-colors text-sm`}>
                    {title}
                  </h3>
                  <p className={`text-gray-600 line-clamp-1 text-xs mt-0.5`}>
                    {location}
                  </p>
                </div>

                {/* Feature and Price in one line for wide variant */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`flex items-center text-gray-600 text-xs`}>
                    <FeatureIcon className={`mr-1 text-[#4da6ff] w-3 h-3`} />
                    <span className="line-clamp-1 whitespace-nowrap">{feature?.label || capacity}</span>
                  </div>
                  <div className={`font-bold text-[#4da6ff] text-sm whitespace-nowrap`}>
                    ${price}/hr
                  </div>
                </div>
              </>
            ) : isCompact ? (
              <>
                {/* Title only for compact cards - location hidden to show more image */}
                <h3 className={`font-bold text-gray-900 mb-0 line-clamp-1 group-hover:text-[#4da6ff] transition-colors text-xs`}>
                  {title}
                </h3>

                {/* Price and Feature in one line - compact layout */}
                <div className="flex items-center justify-between mt-auto">
                  <div className={`flex items-center text-gray-600 text-xs`}>
                    <FeatureIcon className={`mr-1 text-[#4da6ff] w-2.5 h-2.5`} />
                    <span className="line-clamp-1 text-xs">{feature?.label || capacity}</span>
                  </div>
                  <div className={`font-bold text-[#4da6ff] text-xs`}>
                    ${price}/hr
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Title */}
                <h3 className={`font-bold text-gray-900 mb-0.5 line-clamp-1 group-hover:text-[#4da6ff] transition-colors text-base`}>
                  {title}
                </h3>

                {/* Location */}
                <p className={`text-gray-600 mb-1.5 line-clamp-1 text-xs`}>
                  {location}
                </p>

                {/* Price and Feature in one line */}
                <div className="flex items-center justify-between mt-auto">
                  <div className={`flex items-center text-gray-600 text-xs`}>
                    <FeatureIcon className={`mr-1.5 text-[#4da6ff] w-3 h-3`} />
                    <span className="line-clamp-1">{feature?.label || capacity}</span>
                  </div>
                  <div className={`font-bold text-[#4da6ff] text-sm`}>
                    ${price}/hr
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Export template rooms for use in LandingPage
export { TEMPLATE_ROOMS };
export default RoomCard;
