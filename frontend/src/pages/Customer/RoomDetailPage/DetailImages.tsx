import { useState, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface DetailImagesProps {
  images?: string[];
  videoUrl?: string | null;
  isDarkMode?: boolean;
}

// Fallback image
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='380'%3E%3Crect width='800' height='380' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='%236b7280'%3ENo Image%3C/text%3E%3C/svg%3E";
const FALLBACK_THUMB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='70'%3E%3Crect width='100' height='70' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='10' fill='%236b7280'%3ENo Image%3C/text%3E%3C/svg%3E";

const DetailImages = ({ images = [], videoUrl = null, isDarkMode = false }: DetailImagesProps) => {
  const [current, setCurrent] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const VISIBLE_COUNT = 4; // số thumbnail hiển thị

  // Normalize images
  const normalizedImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    return images.map(img => img || FALLBACK_IMAGE);
  }, [images]);

  // Combine images and video into media array
  type MediaType = 'image' | 'video';
  interface MediaItem {
    type: MediaType;
    url: string;
  }
  
  const media = useMemo<MediaItem[]>(() => {
    const mediaArray: MediaItem[] = normalizedImages.map(url => ({ type: 'image' as MediaType, url }));
    if (videoUrl) {
      mediaArray.push({ type: 'video' as MediaType, url: videoUrl });
    }
    return mediaArray;
  }, [normalizedImages, videoUrl]);

  if (!media || media.length === 0) {
    return (
      <div className="text-center p-8">
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chưa có ảnh phòng</p>
      </div>
    );
  }

  const currentMedia = media[current];

  const prevImage = () => {
    setCurrent((prev) => {
      let newIndex;
      if (prev === 0) {
        newIndex = media.length - 1;
        setThumbStart(Math.max(media.length - VISIBLE_COUNT, 0));
      } else {
        newIndex = prev - 1;
        if (newIndex < thumbStart) setThumbStart(newIndex);
      }
      return newIndex;
    });
  };

  const nextImage = () => {
    setCurrent((prev) => {
      let newIndex;
      if (prev === media.length - 1) {
        newIndex = 0;
        setThumbStart(0);
      } else {
        newIndex = prev + 1;
        if (newIndex >= thumbStart + VISIBLE_COUNT) {
          setThumbStart(newIndex - VISIBLE_COUNT + 1);
        }
      }
      return newIndex;
    });
  };

  const visibleThumbs = media.slice(thumbStart, thumbStart + VISIBLE_COUNT);

  return (
    <div className="relative">
      {/* Media chính (Ảnh hoặc Video) */}
      <div className="relative mb-4">
        {currentMedia.type === 'video' ? (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-[380px] object-cover rounded-lg bg-black"
          >
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        ) : (
          <img
            src={currentMedia.url || FALLBACK_IMAGE}
            alt={`media-${current}`}
            className="w-full h-[380px] object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
        )}

        {/* Badge đếm vị trí: 1/4 */}
        <div
          className="absolute bottom-4 right-3 z-10 bg-black/60 text-white px-3 py-1 rounded-full text-xs pointer-events-none"
          aria-label={`${currentMedia.type === 'video' ? 'Video' : 'Ảnh'} ${current + 1} trên ${media.length}`}
        >
          {current + 1} / {media.length}
        </div>

        {/* Nút Prev */}
        <button
          onClick={prevImage}
          className={`absolute top-1/2 left-2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'bg-gray-800/80 text-white border border-gray-600 hover:bg-gray-700'
              : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Ảnh trước"
        >
          <FaChevronLeft />
        </button>

        {/* Nút Next */}
        <button
          onClick={nextImage}
          className={`absolute top-1/2 right-2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode
              ? 'bg-gray-800/80 text-white border border-gray-600 hover:bg-gray-700'
              : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Ảnh sau"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Thumbnail bên dưới */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => {
            if (thumbStart > 0) setThumbStart(thumbStart - 1);
          }}
          disabled={thumbStart === 0}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode
              ? 'bg-gray-800/80 text-white border border-gray-600 hover:bg-gray-700'
              : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Xem thumbnail trước"
        >
          <FaChevronLeft className="text-sm" />
        </button>

        <div className="flex gap-2 justify-center overflow-hidden">
          {visibleThumbs.map((item, index) => {
            const realIndex = thumbStart + index;
            return (
              <div
                key={realIndex}
                className={`relative w-[100px] h-[70px] rounded border-2 cursor-pointer overflow-hidden transition-all ${
                  current === realIndex
                    ? 'border-[#4da6ff] ring-2 ring-[#4da6ff]/30'
                    : isDarkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setCurrent(realIndex)}
              >
                {item.type === 'video' ? (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-2xl drop-shadow-lg">▶</span>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url || FALLBACK_THUMB}
                    alt={`thumb-${realIndex}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_THUMB;
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (thumbStart + VISIBLE_COUNT < media.length) {
              setThumbStart(thumbStart + 1);
            }
          }}
          disabled={thumbStart + VISIBLE_COUNT >= media.length}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDarkMode
              ? 'bg-gray-800/80 text-white border border-gray-600 hover:bg-gray-700'
              : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Xem thumbnail sau"
        >
          <FaChevronRight className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default DetailImages;
