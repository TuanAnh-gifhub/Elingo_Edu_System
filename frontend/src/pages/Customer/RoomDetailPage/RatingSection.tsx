import { FaStar } from "react-icons/fa";

interface RatingSectionProps {
  rating?: number;
  reviewCount?: number;
  ratingDistribution?: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
  isDarkMode?: boolean;
}

export default function RatingSection({
  rating = 4.8,
  reviewCount = 96,
  ratingDistribution = { five: 65, four: 30, three: 1, two: 0, one: 0 },
  isDarkMode = false,
}: RatingSectionProps) {
  const maxCount = Math.max(
    ratingDistribution.five,
    ratingDistribution.four,
    ratingDistribution.three,
    ratingDistribution.two,
    ratingDistribution.one
  );

  const renderStarRating = (value: number) => {
    const fullStars = Math.floor(value);
    const hasHalfStar = value % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: fullStars }).map((_, i) => (
          <FaStar key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative w-5 h-5">
            <FaStar className="w-5 h-5 text-gray-300 absolute" />
            <div className="absolute overflow-hidden w-1/2">
              <FaStar className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <FaStar key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
    );
  };

  const renderRatingBar = (_stars: number, count: number, label: string) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className={`text-sm w-12 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          {label}
        </span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4da6ff] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`text-sm font-medium w-8 text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          {count}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`border rounded-lg p-6 transition-colors duration-500 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start gap-8 mb-6">
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {rating.toFixed(1)}
          </div>
          {renderStarRating(rating)}
          <div className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {reviewCount} đánh giá
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {renderRatingBar(5, ratingDistribution.five, "5 sao")}
          {renderRatingBar(4, ratingDistribution.four, "4 sao")}
          {renderRatingBar(3, ratingDistribution.three, "3 sao")}
          {renderRatingBar(2, ratingDistribution.two, "2 sao")}
          {renderRatingBar(1, ratingDistribution.one, "1 sao")}
        </div>
      </div>
    </div>
  );
}
