import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DetailImages from "./DetailImages";
import DetailInfo from "./DetailInfo";
import DetailSummary from "./DetailSummary";
import SellerInfoCard from "./SellerInfoCard";
import CommentsSection from "./CommentsSection";
import Footer from "../../../components/Footer/Footer";

// Mock data structure - sẽ thay bằng API call sau
interface Room {
  listingId?: string | number;
  id?: string | number;
  title: string;
  location?: string;
  address?: string;
  pricePerMonth?: number;
  price?: number;
  priceCurrency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string | number;
  direction?: string;
  deposit?: number;
  status?: string;
  projectName?: string;
  description?: string;
  images?: string[];
  videoUrl?: string | null;
  postedTime?: string;
  roomType?: string;
  legalDocuments?: string;
  interiorStatus?: string;
  balconyDirection?: string;
  rating?: number;
  reviewCount?: number;
  ratingDistribution?: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
  buildingName?: string;
  directions?: string;
  seller?: {
    userId?: string | number;
    userName?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
}

// Mock data
const MOCK_ROOM: Room = {
  listingId: 1,
  id: 1,
  title: "Giỏ hàng tháng 11 – Căn hộ studio 1-2PN nội thất cao cấp, view đẹp, vào ở ngay",
  address: "Nguyễn Đức Cảnh, phường Tân Phong, Quận 7, Thành phố Hồ Chí Minh, Việt Nam",
  location: "Nguyễn Đức Cảnh, phường Tân Phong, Quận 7, Thành phố Hồ Chí Minh",
  pricePerMonth: 4500000,
  price: 4500000,
  priceCurrency: "VNĐ",
  area: 30,
  bedrooms: 1,
  bathrooms: 1,
  floor: "16/35",
  direction: "Đông",
  deposit: 5000000,
  projectName: "Vinhomes Grand Park",
  status: "Nội thất cao cấp, chỉ cần xách vali vào ở",
  interiorStatus: "Nội thất cao cấp",
  description:
    "Căn hộ studio thiết kế hiện đại, tận dụng tối đa ánh sáng tự nhiên, nội thất mới 100% gồm: giường nệm cao cấp, tủ quần áo, bếp trên dưới, tủ lạnh, máy giặt, máy lạnh, rèm, bàn ăn. Thích hợp cho sinh viên, người đi làm, gia đình trẻ cần không gian sống tiện nghi, an toàn và đảm bảo sức khỏe.",
  images: [
    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  videoUrl: null,
  postedTime: "3 ngày trước",
  roomType: "Chung cư",
  legalDocuments: "Sổ hồng riêng",
  balconyDirection: "Đông",
  rating: 4.8,
  reviewCount: 96,
  ratingDistribution: {
    five: 65,
    four: 30,
    three: 1,
    two: 0,
    one: 0,
  },
  buildingName: "Science Hall 42, Ground floor",
  directions: "Tòa nhà dễ dàng tiếp cận với nhiều phương tiện giao thông công cộng.",
  seller: {
    userId: 1,
    userName: "HoangkhanhVinhomes",
    fullName: "Hoàng Khánh Vinhomes",
    phone: "0978641234",
    email: "hoangkhanh@example.com",
    avatarUrl: "https://i.pravatar.cc/100?img=12",
  },
};

const RoomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentUpdatedAt] = useState(() => Date.now());
  const footerRef = useRef<HTMLElement>(null);

  // Dark mode state synced with localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("landing_dark_mode");
    return stored === "true";
  });

  // Listen for dark mode changes from Header
  useEffect(() => {
    const handleDarkModeChange = (event: CustomEvent) => {
      setIsDarkMode(event.detail.isDarkMode);
    };

    window.addEventListener("darkModeChanged", handleDarkModeChange as EventListener);
    return () => window.removeEventListener("darkModeChanged", handleDarkModeChange as EventListener);
  }, []);

  // Get current user ID from localStorage
  const getCurrentUserId = (): string | number | null => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        return user.userId;
      }
    } catch (error) {
      console.error("❌ Error parsing userInfo from localStorage:", error);
    }
    return null;
  };

  const currentUserId = getCurrentUserId();
  const isLoggedIn = !!currentUserId;

  // Check if this is own product
  const isOwnProduct = room && currentUserId && room.seller?.userId?.toString() === currentUserId.toString();

  // Mock requireAuth function - replace with actual auth check later
  const requireAuth = (callback: () => void) => {
    if (isLoggedIn) {
      callback();
    } else {
      // TODO: Show login modal or redirect to login
      navigate("/login");
    }
  };

  // Handle chat (for SellerInfoCard quick chat)
  const handleChat = async (preset?: string) => {
    if (!room) return;

    requireAuth(async () => {
      try {
        // TODO: Implement chat creation logic
        console.log("Creating chat for listing:", room.listingId, "with preset:", preset);
        // Navigate to chat page when ready
        // navigate(`/chat?conversationId=${conversationId}&preset=${preset}`);
      } catch (error) {
        console.error("❌ Error in handleChat:", error);
      }
    });
  };

  // Fetch room data
  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Fetching room by ID:", id);

        // TODO: Replace with actual API call
        // const response = await listingService.getListingById(id);
        // if (response && response.success && response.data) {
        //   setRoom(transformListingToRoomData(response.data));
        // } else {
        //   setError("Không tìm thấy phòng hoặc phòng không khả dụng.");
        // }

        // Mock data for now
        setTimeout(() => {
          setRoom({
            ...MOCK_ROOM,
            id: id || MOCK_ROOM.id,
            listingId: id || MOCK_ROOM.listingId,
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("❌ RoomDetailPage - Error fetching room:", error);
        setError("Không thể tải thông tin phòng. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    // Check if id exists and is not empty
    if (id && id.trim() !== "") {
      fetchRoomDetail();
    } else {
      // If no ID provided, use mock data for development/testing
      console.warn("⚠️ No room ID in URL, using mock data");
      setTimeout(() => {
        setRoom(MOCK_ROOM);
        setLoading(false);
      }, 500);
      // Uncomment below to show error instead of using mock data
      // setError("ID phòng không hợp lệ.");
      // setLoading(false);
    }

    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen relative">
        {/* Background with overlay */}
        <div className="fixed inset-0 -z-10" style={{ background: isDarkMode ? '#1a1a2e' : '#f5f7fa' }}>
          <div
            className={`absolute inset-0 backdrop-blur-sm transition-colors duration-500 ${
              isDarkMode ? "bg-[#1a1a2e]/95" : "bg-[#f5f7fa]/95"
            }`}
          ></div>
        </div>

        <div className="flex gap-6 p-6 animate-pulse">
          <div className="basis-3/5 space-y-4">
            <div
              className={`p-4 border rounded-lg ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`h-96 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            </div>
            <div
              className={`p-4 border rounded-lg space-y-4 ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`h-8 rounded w-3/4 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
              <div className={`h-4 rounded w-1/2 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
              <div className={`h-4 rounded w-2/3 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            </div>
          </div>
          <div className="basis-2/5 space-y-4">
            <div
              className={`p-4 border rounded-lg ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`h-32 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            </div>
            <div
              className={`p-4 border rounded-lg ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`h-48 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-300"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-gray-500 text-lg">Không tìm thấy phòng.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background with overlay */}
      <div className="fixed inset-0 -z-10" style={{ background: isDarkMode ? '#1a1a2e' : '#f5f7fa' }}>
        <div
          className={`absolute inset-0 backdrop-blur-sm transition-colors duration-500 ${
            isDarkMode ? "bg-[#1a1a2e]/95" : "bg-[#f5f7fa]/95"
          }`}
        ></div>
      </div>

      <div className="container mx-auto relative">
        <div className="flex flex-1 flex-col p-6">
          <div className="flex md:flex-row flex-col gap-6">
            {/* Cột trái: ảnh + info */}
            <div className="basis-3/5 space-y-6">
              <div
                className={`p-4 border rounded-lg transition-colors duration-500 ${
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
              >
                <DetailImages
                  images={room.images}
                  videoUrl={room.videoUrl}
                  isDarkMode={isDarkMode}
                />
              </div>
              <DetailInfo
                room={room}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* Cột phải */}
            <div className="basis-2/5 space-y-6">
              <DetailSummary
                room={room}
                isLoggedIn={isLoggedIn}
                requireAuth={requireAuth}
                isDarkMode={isDarkMode}
              />
              <SellerInfoCard
                seller={room.seller}
                onQuickChat={(q) => handleChat(q)}
                isOwnProduct={isOwnProduct || false}
                isDarkMode={isDarkMode}
                listingId={room.listingId}
                commentUpdatedAt={commentUpdatedAt}
              />

              <CommentsSection
                listingId={room.listingId}
                currentUser={
                  currentUserId
                    ? {
                        id: currentUserId,
                        name: "Người dùng", // TODO: Get from userInfo
                      }
                    : undefined
                }
                rating={room.rating}
                reviewCount={room.reviewCount}
                ratingDistribution={room.ratingDistribution}
                requireAuth={requireAuth}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer ref={footerRef} isDarkMode={isDarkMode} />
    </div>
  );
};

export default RoomDetailPage;
