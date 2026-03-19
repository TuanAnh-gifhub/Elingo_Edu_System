import { useEffect, useRef, useState } from "react";
import {
  FiBookOpen,
  FiBookmark,
  FiClock,
  FiEdit3,
  FiFilter,
  FiGlobe,
  FiHeart,
  FiImage,
  FiMessageSquare,
  FiMoreHorizontal,
  FiSearch,
  FiSend,
  FiTrash2,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { FaChalkboardTeacher, FaGraduationCap, FaMedal } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import commentService, {
  type CreateCommunityCommentRequest,
  type CommunityCommentResponse as CommunityApiCommentResponse,
  type UpdateCommunityCommentRequest,
} from "../../../services/community/commentService";
import communityService, {
  type CommunityPostResponse,
} from "../../../services/community/communityService";
import { uploadMultipleFiles } from "../../../services/upload/uploadService";

type AudienceType = "Giáo viên" | "Học sinh";
type PostType = "Quảng bá khóa học" | "Tìm khóa học" | "Thảo luận";

interface PostComment {
  id: number | string;
  authorId?: string;
  author: string;
  role: AudienceType;
  time: string;
  content: string;
}

interface CommunityMedia {
  id: string;
  type: "image" | "video" | "placeholder";
  value: string;
}

interface ComposerAsset {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
}

interface CommunityPost {
  id: number | string;
  authorId?: string;
  author: string;
  role: AudienceType;
  subject: string;
  time: string;
  visibility: string;
  postType: PostType;
  headline: string;
  content: string;
  tags: string[];
  media: CommunityMedia[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  commentsPreview: PostComment[];
}

const communityStats = [
  { label: "Bài viết hôm nay", value: "124", icon: FiEdit3 },
  { label: "Giáo viên đang hoạt động", value: "58", icon: FaChalkboardTeacher },
  { label: "Học sinh cần tư vấn", value: "92", icon: FaGraduationCap },
];

const trendingTopics = [
  "IELTS cấp tốc 6.5+",
  "Luyện speaking 1 kèm 1",
  "Gia sư Toán online lớp 10",
  "Khóa học tiếng Anh cho người đi làm",
  "Workshop giao tiếp tiếng Anh cuối tuần",
];

const suggestedGroups = [
  {
    name: "Cộng đồng IELTS Elingo",
    members: "2.4k thành viên",
    tone: "from-sky-500 to-cyan-400",
  },
  {
    name: "Giáo viên ngoại ngữ chất lượng",
    members: "1.2k thành viên",
    tone: "from-emerald-500 to-teal-400",
  },
  {
    name: "Học sinh tìm lớp phù hợp",
    members: "3.1k thành viên",
    tone: "from-amber-500 to-orange-400",
  },
];

const initialPosts: CommunityPost[] = [
  {
    id: 1,
    author: "Cô Minh Anh",
    role: "Giáo viên",
    subject: "IELTS / Speaking",
    time: "15 phút trước",
    visibility: "Công khai",
    postType: "Quảng bá khóa học",
    headline: "Mở lớp IELTS Speaking 1 kèm 1 cho người mất gốc đến 6.5+",
    content:
      "Mình mở 6 slot học thử miễn phí trong tuần này cho học viên muốn cải thiện phản xạ speaking. Lộ trình cá nhân hóa theo mục tiêu du học, đi làm hoặc thi đầu ra. Học online buổi tối, có feedback từng bài nói và mock test cuối tuần.",
    tags: ["IELTS", "Speaking", "1 kèm 1", "Online buổi tối"],
    media: [
      { id: "1-1", type: "placeholder", value: "Lộ trình 8 tuần" },
      { id: "1-2", type: "placeholder", value: "Mock test cuối tuần" },
    ],
    stats: { likes: 128, comments: 24, shares: 12 },
    commentsPreview: [
      {
        id: 11,
        author: "Hà Vy",
        role: "Học sinh",
        time: "8 phút trước",
        content:
          "Lớp này phù hợp cho người đang ở mức 4.5 lên 6.0 trong 3 tháng không cô?",
      },
      {
        id: 12,
        author: "Cô Minh Anh",
        role: "Giáo viên",
        time: "5 phút trước",
        content:
          "Phù hợp em nhé, cô sẽ test đầu vào và điều chỉnh lesson plan riêng.",
      },
    ],
  },
  {
    id: 2,
    author: "Nguyễn Khánh Linh",
    role: "Học sinh",
    subject: "Tiếng Anh giao tiếp",
    time: "37 phút trước",
    visibility: "Thành viên Elingo",
    postType: "Tìm khóa học",
    headline:
      "Cần tìm lớp tiếng Anh giao tiếp cho người đi làm, học sau 8h tối",
    content:
      "Mình đang đi làm full-time, cần khóa học giao tiếp online tập trung vào họp, thuyết trình và phản xạ trong môi trường công sở. Ngân sách khoảng 1.5 đến 2 triệu mỗi tháng, ưu tiên lớp nhỏ hoặc mentor theo sát.",
    tags: ["Người đi làm", "Giao tiếp", "Buổi tối", "Lớp nhỏ"],
    media: [
      { id: "2-1", type: "placeholder", value: "Mục tiêu trong 4 tháng" },
    ],
    stats: { likes: 76, comments: 31, shares: 4 },
    commentsPreview: [
      {
        id: 21,
        author: "Thầy Quang Huy",
        role: "Giáo viên",
        time: "20 phút trước",
        content:
          "Thầy có lớp 6 người, học 2 buổi tối mỗi tuần, tập trung nhiều vào tình huống công việc.",
      },
      {
        id: 22,
        author: "Mai Trang",
        role: "Học sinh",
        time: "16 phút trước",
        content:
          "Mình đang học dạng lớp này và thấy hiệu quả nếu có speaking club cuối tuần nữa.",
      },
    ],
  },
  {
    id: 3,
    author: "Thầy Đức Mạnh",
    role: "Giáo viên",
    subject: "Toán THPT",
    time: "1 giờ trước",
    visibility: "Công khai",
    postType: "Thảo luận",
    headline:
      "Theo mọi người học sinh lớp 12 đang cần gì nhất ở lớp Toán online?",
    content:
      "Mình đang thiết kế lại khóa ôn thi THPTQG môn Toán và muốn lấy thêm insight từ phụ huynh và học sinh. Các bạn ưu tiên chữa đề, học theo chuyên đề hay cần mentor theo sát tiến độ hơn?",
    tags: ["Toán 12", "THPTQG", "Khảo sát", "Ôn thi"],
    media: [
      { id: "3-1", type: "placeholder", value: "Khảo sát nội dung khóa học" },
      { id: "3-2", type: "placeholder", value: "Bảng tiến độ tuần" },
    ],
    stats: { likes: 93, comments: 42, shares: 7 },
    commentsPreview: [
      {
        id: 31,
        author: "Phạm Hoàng",
        role: "Học sinh",
        time: "45 phút trước",
        content:
          "Em cần chữa đề có phân tích lỗi sai chi tiết hơn là chỉ giải nhanh.",
      },
      {
        id: 32,
        author: "Lan Anh",
        role: "Học sinh",
        time: "39 phút trước",
        content:
          "Nếu có bảng theo dõi tiến độ và deadline bài tập thì sẽ giữ kỷ luật tốt hơn nhiều.",
      },
    ],
  },
];

const roleStyles: Record<AudienceType, string> = {
  "Giáo viên": "bg-sky-100 text-sky-700",
  "Học sinh": "bg-amber-100 text-amber-700",
};

const postTypeStyles: Record<PostType, string> = {
  "Quảng bá khóa học": "bg-emerald-100 text-emerald-700",
  "Tìm khóa học": "bg-violet-100 text-violet-700",
  "Thảo luận": "bg-slate-100 text-slate-700",
};

const mediaCardTones = [
  "from-sky-500 to-cyan-400",
  "from-indigo-500 to-violet-400",
  "from-emerald-500 to-teal-400",
];

const SUCCESS_CODES = new Set([0, 200]);

const SUCCESS_TOAST_OPTIONS = {
  style: {
    borderLeft: "4px solid #16a34a",
  },
  progressStyle: {
    background: "#16a34a",
  },
} as const;

function normalizeRole(role?: string | null): AudienceType {
  const normalized = role?.toLowerCase() ?? "";

  if (
    normalized.includes("teacher") ||
    normalized.includes("giáo") ||
    normalized.includes("giao")
  ) {
    return "Giáo viên";
  }

  return "Học sinh";
}

function normalizePostType(role?: string | null): PostType {
  return normalizeRole(role) === "Giáo viên"
    ? "Quảng bá khóa học"
    : "Tìm khóa học";
}

function formatRelativeTime(isoDate?: string | null) {
  if (!isoDate) {
    return "Vừa xong";
  }

  const now = Date.now();
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) {
    return "Vừa xong";
  }

  const diffMinutes = Math.max(0, Math.floor((now - target) / 60000));

  if (diffMinutes < 1) {
    return "Vừa xong";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

function mapCommentFromApi(
  comment: Partial<CommunityApiCommentResponse>,
): PostComment {
  return {
    id:
      comment.commentId ||
      `${comment.authorId || "comment"}-${comment.createdAt || Date.now()}`,
    authorId: comment.authorId,
    author: comment.authorName || "Thành viên Elingo",
    role: "Học sinh",
    time: formatRelativeTime(comment.createdAt),
    content: comment.content || "",
  };
}

function mapCreatedCommentToFeed(
  comment: Partial<CommunityApiCommentResponse>,
  role?: string | null,
  fallback?: { content?: string; authorName?: string },
): PostComment {
  return {
    id:
      comment.commentId ||
      `${comment.authorId || "comment"}-${comment.createdAt || Date.now()}`,
    authorId: comment.authorId,
    author: comment.authorName || fallback?.authorName || "Thành viên Elingo",
    role: normalizeRole(role),
    time: formatRelativeTime(comment.createdAt),
    content: comment.content ?? fallback?.content ?? "",
  };
}

async function hydratePostsWithComments(posts: CommunityPost[]) {
  const hydratedPosts = await Promise.all(
    posts.map(async (post) => {
      if (typeof post.id !== "string") {
        return post;
      }

      try {
        const response = await commentService.getCommentsByPostId(post.id);
        const comments = Array.isArray(response.result) ? response.result : [];

        return {
          ...post,
          commentsPreview: comments.map(mapCommentFromApi),
          stats: {
            ...post.stats,
            comments: comments.length,
          },
        };
      } catch (error) {
        console.error(`Không thể tải comments cho post ${post.id}`, error);
        return post;
      }
    }),
  );

  return hydratedPosts;
}

function mapCreatedPostToFeed(
  post: Partial<CommunityPostResponse>,
  role?: string | null,
  fallback?: {
    authorId?: string;
    content?: string;
    images?: string[];
    videos?: string[];
    authorName?: string;
  },
): CommunityPost {
  const safeContent = post.content ?? fallback?.content ?? "";
  const safeImages = Array.isArray(post.images)
    ? post.images
    : (fallback?.images ?? []);
  const safeVideos = Array.isArray(post.videos)
    ? post.videos
    : (fallback?.videos ?? []);
  const safeComments = Array.isArray(post.comments) ? post.comments : [];
  const safeAuthorName =
    post.authorName ?? fallback?.authorName ?? "Thành viên Elingo";
  const safePostId = post.postId ?? `local-${Date.now()}`;
  const media: CommunityMedia[] = [
    ...safeImages.map((imageUrl, index) => ({
      id: `${safePostId}-image-${index}`,
      type: "image" as const,
      value: imageUrl,
    })),
    ...safeVideos.map((videoUrl, index) => ({
      id: `${safePostId}-video-${index}`,
      type: "video" as const,
      value: videoUrl,
    })),
  ];

  return {
    id: safePostId,
    authorId: post.authorId ?? fallback?.authorId,
    author: safeAuthorName,
    role: normalizeRole(role),
    subject: "Bài viết cộng đồng",
    time: formatRelativeTime(post.createdAt),
    visibility: post.active === false ? "Đã ẩn" : "Công khai",
    postType: normalizePostType(role),
    headline: "",
    content: safeContent,
    tags: [],
    media,
    stats: {
      likes: post.likeCount ?? 0,
      comments: post.commentCount ?? safeComments.length,
      shares: 0,
    },
    commentsPreview: safeComments.slice(0, 2).map(mapCommentFromApi),
  };
}

function hasSuccessfulPostResponse(response: {
  code: number;
  result?: CommunityPostResponse | null;
}) {
  return SUCCESS_CODES.has(response.code) || Boolean(response.result?.postId);
}

function shouldShowHeadline(post: CommunityPost) {
  const normalizedHeadline = post.headline.trim();
  const normalizedContent = post.content.trim();

  return Boolean(normalizedHeadline) && normalizedHeadline !== normalizedContent;
}

function parseMediaInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMediaUrls(post: CommunityPost, mediaType: "image" | "video") {
  return post.media
    .filter((mediaItem) => mediaItem.type === mediaType)
    .map((mediaItem) => mediaItem.value);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, tone }: { name: string; tone: string }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${tone} text-sm font-bold text-white shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [content, setContent] = useState("");
  const [composerAssets, setComposerAssets] = useState<ComposerAsset[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImagesInput, setEditImagesInput] = useState("");
  const [editVideosInput, setEditVideosInput] = useState("");
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [submittingCommentPostId, setSubmittingCommentPostId] = useState<
    string | null
  >(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(
    null,
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const composerAssetsRef = useRef<ComposerAsset[]>([]);
  const modalCommentInputRef = useRef<HTMLInputElement>(null);

  const releaseComposerAssets = (assets: ComposerAsset[]) => {
    assets.forEach((asset) => {
      if (asset.url.startsWith("blob:")) {
        URL.revokeObjectURL(asset.url);
      }
    });
  };

  const resetComposer = () => {
    setContent("");
    setComposerAssets([]);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    composerAssetsRef.current = composerAssets;
  }, [composerAssets]);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoadingPosts(true);

      try {
        const response = await communityService.getPosts(1, 20);
        const postList = response.result?.data ?? [];

        if (postList.length > 0) {
          const mappedPosts = postList.map((post) =>
            mapCreatedPostToFeed(post, user?.role),
          );
          const hydratedPosts = await hydratePostsWithComments(mappedPosts);
          setPosts(hydratedPosts);
        }
      } catch (error) {
        console.error("Không thể tải bài viết cộng đồng", error);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    void loadPosts();
  }, [user?.role]);

  useEffect(() => {
    return () => {
      releaseComposerAssets(composerAssetsRef.current);
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest("[data-post-menu-root='true']")) {
        return;
      }

      if (target.closest("[data-comment-menu-root='true']")) {
        return;
      }

      setOpenPostMenuId(null);
      setOpenCommentMenuId(null);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const attachFiles = async (
    files: FileList | null,
    assetType: "image" | "video",
  ) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileList = Array.from(files);
    const toggleUploading =
      assetType === "image" ? setIsUploadingImages : setIsUploadingVideos;
    toggleUploading(true);

    try {
      const uploads = await uploadMultipleFiles(fileList, {
        folder: `community-${assetType}s`,
      });

      const nextAssets = uploads
        .filter((result) => result.success)
        .map((result, index) => ({
          id: `${assetType}-${Date.now()}-${index}`,
          type: assetType,
          url: result.data.url,
          name: fileList[index]?.name || `${assetType}-${index + 1}`,
        }));

      setComposerAssets((currentAssets) => [...currentAssets, ...nextAssets]);
      toast.success(
        assetType === "image"
          ? "Đã thêm ảnh vào bài viết."
          : "Đã thêm video vào bài viết.",
        SUCCESS_TOAST_OPTIONS,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Tải media thất bại.";
      toast.error(message);
    } finally {
      toggleUploading(false);
    }
  };

  const removeComposerAsset = (assetId: string) => {
    setComposerAssets((currentAssets) => {
      const removedAsset = currentAssets.find((asset) => asset.id === assetId);
      if (removedAsset?.url.startsWith("blob:")) {
        URL.revokeObjectURL(removedAsset.url);
      }

      return currentAssets.filter((asset) => asset.id !== assetId);
    });
  };

  const submitPost = async () => {
    const trimmedContent = content.trim();
    const images = composerAssets
      .filter((asset) => asset.type === "image")
      .map((asset) => asset.url);
    const videos = composerAssets
      .filter((asset) => asset.type === "video")
      .map((asset) => asset.url);

    if (!isAuthenticated) {
      toast.info("Bạn cần đăng nhập để tạo bài đăng cộng đồng.");
      return;
    }

    if (!trimmedContent) {
      toast.error("Hãy nhập nội dung bài đăng trước khi gửi.");
      contentInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await communityService.createPost({
        content: trimmedContent,
        images,
        videos,
      });

      if (!hasSuccessfulPostResponse(response)) {
        throw new Error(response.message || "Không thể tạo bài đăng.");
      }

      setPosts((currentPosts) => [
        mapCreatedPostToFeed(response.result, user?.role, {
          authorId: user?.userId,
          content: trimmedContent,
          images,
          videos,
          authorName: user?.userName,
        }),
        ...currentPosts,
      ]);
      resetComposer();
      toast.success("Đăng bài thành công.", SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Tạo bài đăng thất bại.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingPost = (post: CommunityPost) => {
    if (typeof post.id !== "string") {
      return;
    }

    setOpenPostMenuId(null);
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditImagesInput(getMediaUrls(post, "image").join("\n"));
    setEditVideosInput(getMediaUrls(post, "video").join("\n"));
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditContent("");
    setEditImagesInput("");
    setEditVideosInput("");
  };

  const submitPostUpdate = async (post: CommunityPost) => {
    if (typeof post.id !== "string") {
      return;
    }

    const trimmedContent = editContent.trim();
    const images = parseMediaInput(editImagesInput);
    const videos = parseMediaInput(editVideosInput);

    if (!trimmedContent) {
      toast.error("Nội dung bài viết không được để trống.");
      return;
    }

    setIsUpdatingPost(true);

    try {
      const response = await communityService.updatePost(post.id, {
        content: trimmedContent,
        images,
        videos,
      });

      if (!hasSuccessfulPostResponse(response)) {
        throw new Error(response.message || "Không thể cập nhật bài đăng.");
      }

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id
            ? mapCreatedPostToFeed(response.result, user?.role, {
                authorId: post.authorId,
                authorName: post.author,
                content: trimmedContent,
                images,
                videos,
              })
            : currentPost,
        ),
      );
      cancelEditingPost();
      toast.success("Cập nhật bài đăng thành công.", SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cập nhật bài đăng thất bại.";
      toast.error(message);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const deletePost = async (post: CommunityPost) => {
    if (typeof post.id !== "string") {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa bài đăng này không?");
    if (!confirmed) {
      return;
    }

    setOpenPostMenuId(null);
    setDeletingPostId(post.id);

    try {
      const response = await communityService.deletePost(post.id);

      if (!SUCCESS_CODES.has(response.code)) {
        throw new Error(response.message || "Không thể xóa bài đăng.");
      }

      setPosts((currentPosts) =>
        currentPosts.filter((currentPost) => currentPost.id !== post.id),
      );

      if (editingPostId === post.id) {
        cancelEditingPost();
      }

      toast.success("Xóa bài đăng thành công.", SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Xóa bài đăng thất bại.";
      toast.error(message);
    } finally {
      setDeletingPostId(null);
    }
  };

  const updateCommentDraft = (postId: string, value: string) => {
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [postId]: value,
    }));
  };

  const openCommentsModal = (postId: string) => {
    setActiveCommentsPostId(postId);
  };

  const closeCommentsModal = () => {
    setActiveCommentsPostId(null);
    setOpenCommentMenuId(null);
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  useEffect(() => {
    if (!activeCommentsPostId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      modalCommentInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [activeCommentsPostId]);

  useEffect(() => {
    if (!activeCommentsPostId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeCommentsPostId]);

  const submitComment = async (post: CommunityPost) => {
    if (typeof post.id !== "string") {
      return;
    }

    const draft = (commentDrafts[post.id] || "").trim();

    if (!isAuthenticated) {
      toast.info("Bạn cần đăng nhập để bình luận.");
      return;
    }

    if (!draft) {
      toast.error("Hãy nhập nội dung bình luận trước khi gửi.");
      return;
    }

    setSubmittingCommentPostId(post.id);

    try {
      const payload: CreateCommunityCommentRequest = {
        postId: post.id,
        content: draft,
        images: [],
        videos: [],
      };

      const response = await commentService.createComment(payload);

      if (!SUCCESS_CODES.has(response.code) && !response.result?.commentId) {
        throw new Error(response.message || "Không thể tạo bình luận.");
      }

      const nextComment = mapCreatedCommentToFeed(response.result, user?.role, {
        content: draft,
        authorName: user?.userName,
      });

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) => {
          if (currentPost.id !== post.id) {
            return currentPost;
          }

          return {
            ...currentPost,
            commentsPreview: [...currentPost.commentsPreview, nextComment],
            stats: {
              ...currentPost.stats,
              comments: currentPost.stats.comments + 1,
            },
          };
        }),
      );

      setCommentDrafts((currentDrafts) => ({
        ...currentDrafts,
        [post.id]: "",
      }));
      toast.success("Bình luận thành công.", SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Tạo bình luận thất bại.";
      toast.error(message);
    } finally {
      setSubmittingCommentPostId(null);
    }
  };

  const startEditingComment = (comment: PostComment) => {
    if (typeof comment.id !== "string") {
      return;
    }

    setOpenCommentMenuId(null);
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const updateCommentInPosts = (commentId: string, updater: (comment: PostComment) => PostComment) => {
    setPosts((currentPosts) =>
      currentPosts.map((currentPost) => ({
        ...currentPost,
        commentsPreview: currentPost.commentsPreview.map((comment) =>
          String(comment.id) === commentId ? updater(comment) : comment,
        ),
      })),
    );
  };

  const removeCommentFromPosts = (commentId: string) => {
    setPosts((currentPosts) =>
      currentPosts.map((currentPost) => {
        const hasComment = currentPost.commentsPreview.some(
          (comment) => String(comment.id) === commentId,
        );

        if (!hasComment) {
          return currentPost;
        }

        return {
          ...currentPost,
          commentsPreview: currentPost.commentsPreview.filter(
            (comment) => String(comment.id) !== commentId,
          ),
          stats: {
            ...currentPost.stats,
            comments: Math.max(0, currentPost.stats.comments - 1),
          },
        };
      }),
    );
  };

  const submitCommentUpdate = async (comment: PostComment) => {
    if (typeof comment.id !== "string") {
      return;
    }

    const trimmedContent = editCommentContent.trim();
    if (!trimmedContent) {
      toast.error("Nội dung bình luận không được để trống.");
      return;
    }

    setUpdatingCommentId(comment.id);

    try {
      const payload: UpdateCommunityCommentRequest = {
        content: trimmedContent,
        images: [],
        videos: [],
      };
      const response = await commentService.updateComment(comment.id, payload);

      if (!SUCCESS_CODES.has(response.code) && !response.result?.commentId) {
        throw new Error(response.message || "Không thể cập nhật bình luận.");
      }

      const updatedComment = mapCreatedCommentToFeed(response.result, user?.role, {
        content: trimmedContent,
        authorName: comment.author,
      });

      updateCommentInPosts(comment.id, () => updatedComment);
      cancelEditingComment();
      toast.success("Cập nhật bình luận thành công.", SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cập nhật bình luận thất bại.";
      toast.error(message);
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const deleteComment = async (comment: PostComment) => {
    if (typeof comment.id !== "string") {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này không?");
    if (!confirmed) {
      return;
    }

    setOpenCommentMenuId(null);
    setDeletingCommentId(comment.id);

    try {
      const response = await commentService.deleteComment(comment.id);

      if (!SUCCESS_CODES.has(response.code)) {
        throw new Error(response.message || "Không thể xóa bình luận.");
      }

      removeCommentFromPosts(comment.id);
      if (editingCommentId === comment.id) {
        cancelEditingComment();
      }
      toast.success("Xóa bình luận thành công.", SUCCESS_TOAST_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Xóa bình luận thất bại.";
      toast.error(message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const activeCommentsPost = posts.find(
    (post) => typeof post.id === "string" && post.id === activeCommentsPostId,
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#f8fbff_18%,#ffffff_100%)] text-slate-900">
      <section className="border-b border-slate-200/70 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                <FiUsers />
                Elingo Community
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Trang cộng đồng để giáo viên quảng bá khóa học và học sinh tìm
                  lớp phù hợp
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Thiết kế theo kiểu news feed quen thuộc: có khu tạo bài viết,
                  luồng bài đăng nổi bật, gợi ý nhóm học tập và toàn bộ thành
                  phần của một post để sau này nối API thật.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-120 xl:max-w-140">
              {communityStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-white/80 bg-white px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <Icon />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-slate-500">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Avatar
                  name="Elingo Community"
                  tone="from-sky-500 to-indigo-500"
                />
                <div>
                  <div className="font-semibold">Xin chào Elingo</div>
                  <div className="text-sm text-slate-500">
                    Không gian kết nối học và dạy
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                  <FiTrendingUp className="text-sky-600" />
                  Feed ưu tiên bài viết đang có tương tác tốt
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                  <FiBookOpen className="text-emerald-600" />
                  Gợi ý theo môn học và nhu cầu thực tế
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                  <FaMedal className="text-amber-500" />
                  Giáo viên nổi bật được ghim ưu tiên ở đầu feed
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Chủ đề nổi bật</h2>
                <FiFilter className="text-slate-400" />
              </div>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <button
                    key={topic}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-700">{topic}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <FiSearch className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm giáo viên, bài đăng, khóa học hoặc chủ đề bạn quan tâm"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
                  Dành cho tất cả
                </button>
                <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                  Giáo viên đăng bài
                </button>
                <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                  Học sinh tìm lớp
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex gap-3">
              <Avatar
                name={user?.userName || "Bạn"}
                tone="from-slate-700 to-slate-500"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <textarea
                  ref={contentInputRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={4}
                  placeholder="Bạn muốn chia sẻ khóa học mới hay đăng nhu cầu tìm lớp hôm nay?"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void attachFiles(event.target.files, "image");
                    event.target.value = "";
                  }}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void attachFiles(event.target.files, "video");
                    event.target.value = "";
                  }}
                />
                {composerAssets.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {composerAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100"
                      >
                        <button
                          type="button"
                          onClick={() => removeComposerAsset(asset.id)}
                          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/72 text-white transition hover:bg-slate-900"
                        >
                          <FiX />
                        </button>
                        {asset.type === "image" ? (
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="h-44 w-full object-cover"
                          />
                        ) : (
                          <video
                            src={asset.url}
                            controls
                            className="h-44 w-full object-cover"
                          />
                        )}
                        <div className="border-t border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                          {asset.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideos}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiVideo />
                    {isUploadingVideos
                      ? "Đang thêm video..."
                      : "Video giới thiệu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImages}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiImage />
                    {isUploadingImages ? "Đang thêm ảnh..." : "Ảnh khóa học"}
                  </button>
                  <button
                    type="button"
                    onClick={submitPost}
                    disabled={
                      isSubmitting || isUploadingImages || isUploadingVideos
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiBookOpen />
                    {isSubmitting ? "Đang đăng bài..." : "Đăng bài cộng đồng"}
                  </button>
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Chọn trực tiếp ảnh hoặc video từ thiết bị. Hệ thống sẽ lấy
                  file, tạo preview và dùng URL media đó khi gửi bài đăng lên
                  API.
                </p>
              </div>
            </div>
          </div>

          {isLoadingPosts ? (
            <div className="rounded-[30px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Đang tải bài viết cộng đồng...
            </div>
          ) : null}

          {posts.map((post, postIndex) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
            >
              {(() => {
                const canEditPost =
                  typeof post.id === "string" &&
                  Boolean(user?.userId) &&
                  post.authorId === user?.userId;
                const isEditingPost = editingPostId === post.id;
                const isDeletingPost = deletingPostId === post.id;
                const isMenuOpen = openPostMenuId === post.id;

                return (
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar
                      name={post.author}
                      tone={mediaCardTones[postIndex % mediaCardTones.length]}
                    />
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-900">
                          {post.author}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[post.role]}`}
                        >
                          {post.role}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${postTypeStyles[post.postType]}`}
                        >
                          {post.postType}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{post.subject}</span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-slate-400" />
                          {post.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiGlobe className="text-slate-400" />
                          {post.visibility}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEditPost ? (
                      <div className="relative" data-post-menu-root="true">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenPostMenuId((currentMenuId) =>
                              currentMenuId === post.id ? null : String(post.id),
                            )
                          }
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                          <FiMoreHorizontal />
                        </button>

                        {isMenuOpen ? (
                          <div className="absolute right-0 top-12 z-20 min-w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                            <button
                              type="button"
                              onClick={() =>
                                isEditingPost
                                  ? cancelEditingPost()
                                  : startEditingPost(post)
                              }
                              disabled={isDeletingPost}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <FiEdit3 className="text-slate-500" />
                              {isEditingPost ? "Đóng chỉnh sửa" : "Chỉnh sửa bài viết"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deletePost(post)}
                              disabled={isDeletingPost || isUpdatingPost}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <FiTrash2 className="text-rose-500" />
                              {isDeletingPost ? "Đang xóa bài viết" : "Xóa bài viết"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {isEditingPost ? (
                    <div className="space-y-4 rounded-[26px] border border-sky-100 bg-sky-50/60 p-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Nội dung bài viết
                        </label>
                        <textarea
                          value={editContent}
                          onChange={(event) => setEditContent(event.target.value)}
                          rows={5}
                          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                        />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            URL ảnh
                          </label>
                          <textarea
                            value={editImagesInput}
                            onChange={(event) => setEditImagesInput(event.target.value)}
                            rows={4}
                            placeholder="Mỗi URL một dòng hoặc ngăn cách bằng dấu phẩy"
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">
                            URL video
                          </label>
                          <textarea
                            value={editVideosInput}
                            onChange={(event) => setEditVideosInput(event.target.value)}
                            rows={4}
                            placeholder="Mỗi URL một dòng hoặc ngăn cách bằng dấu phẩy"
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEditingPost}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => void submitPostUpdate(post)}
                          disabled={isUpdatingPost}
                          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdatingPost ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {shouldShowHeadline(post) ? (
                        <h3 className="text-xl font-bold tracking-tight text-slate-900">
                          {post.headline}
                        </h3>
                      ) : null}
                      <p className={`${shouldShowHeadline(post) ? "mt-3" : "mt-0"} text-sm leading-7 text-slate-700 md:text-[15px]`}>
                        {post.content}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {post.media.length > 0 ? (
                    <div
                      className={`grid gap-3 ${post.media.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}
                    >
                      {post.media.map((mediaItem, mediaIndex) => {
                        if (mediaItem.type === "image") {
                          return (
                            <div
                              key={mediaItem.id}
                              className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-100"
                            >
                              <img
                                src={mediaItem.value}
                                alt="Ảnh bài đăng"
                                className="h-72 w-full object-cover"
                              />
                            </div>
                          );
                        }

                        if (mediaItem.type === "video") {
                          return (
                            <div
                              key={mediaItem.id}
                              className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-950"
                            >
                              <video
                                src={mediaItem.value}
                                controls
                                className="h-72 w-full object-cover"
                              >
                                Trình duyệt không hỗ trợ phát video.
                              </video>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={mediaItem.id}
                            className={`rounded-[26px] bg-linear-to-br ${mediaCardTones[(postIndex + mediaIndex) % mediaCardTones.length]} p-5 text-white shadow-inner`}
                          >
                            <div className="flex min-h-45 flex-col justify-between">
                              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                                <FiImage />
                                Preview
                              </div>
                              <div>
                                <div className="text-lg font-bold">
                                  {mediaItem.value}
                                </div>
                                <div className="mt-2 max-w-xs text-sm text-white/85">
                                  Bố cục media placeholder để sau này nối ảnh,
                                  thumbnail video hoặc poster khóa học thật.
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
                );
              })()}

              <div className="border-t border-slate-100 px-4 py-3 md:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <FiHeart className="text-sm" />
                      </span>
                      {post.stats.likes} lượt quan tâm
                    </span>
                    <span>{post.stats.comments} bình luận</span>
                    <span>{post.stats.shares} lượt chia sẻ</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof post.id === "string") {
                        openCommentsModal(post.id);
                      }
                    }}
                    className="text-sm font-medium text-sky-700 hover:text-sky-800"
                  >
                    Xem chi tiết bài viết
                  </button>
                </div>
              </div>

              <div className="border-y border-slate-100 px-4 py-2 md:px-6">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <button className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-sky-700">
                    <FiHeart />
                    Thích
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof post.id === "string") {
                        openCommentsModal(post.id);
                      }
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-sky-700"
                  >
                    <FiMessageSquare />
                    Bình luận
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-sky-700">
                    <FiSend />
                    Chia sẻ
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-sky-700">
                    <FiBookmark />
                    Lưu
                  </button>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/70 px-4 py-4 md:px-6">
                {post.commentsPreview.slice(0, 2).map((comment, commentIndex) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      name={comment.author}
                      tone={
                        mediaCardTones[
                          (postIndex + commentIndex + 1) % mediaCardTones.length
                        ]
                      }
                    />
                    <div className="min-w-0 flex-1 rounded-3xl bg-white px-4 py-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {comment.author}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[comment.role]}`}
                        >
                          {comment.role}
                        </span>
                        <span className="text-xs text-slate-400">
                          {comment.time}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                {post.commentsPreview.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof post.id === "string") {
                        openCommentsModal(post.id);
                      }
                    }}
                    className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
                  >
                    Xem thêm {post.commentsPreview.length - 2} bình luận
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Nhóm bạn có thể quan tâm</h2>
                <FiUsers className="text-slate-400" />
              </div>
              <div className="space-y-3">
                {suggestedGroups.map((group) => (
                  <div
                    key={group.name}
                    className="rounded-3xl border border-slate-100 p-3"
                  >
                    <div
                      className={`mb-3 h-24 rounded-[20px] bg-linear-to-br ${group.tone}`}
                    />
                    <div className="font-semibold text-slate-900">
                      {group.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {group.members}
                    </div>
                    <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                      <FiUserPlus />
                      Tham gia nhóm
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold">Gợi ý cho khu bài viết</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Tách nguồn feed theo hai loại chính: bài tuyển sinh của giáo
                  viên và bài tìm lớp của học sinh.
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Có thể thêm bộ lọc theo môn học, level, lịch học và hình thức
                  1 kèm 1 hoặc nhóm.
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Khi nối backend, action Thích, Bình luận, Chia sẻ và Lưu nên
                  tách service riêng để dễ scale.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {activeCommentsPost ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-4xl bg-white shadow-[0_32px_90px_rgba(15,23,42,0.22)]">
            <button
              type="button"
              onClick={closeCommentsModal}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <FiX />
            </button>

            <div className="border-b border-slate-100 px-6 py-5 md:px-8">
              <div className="pr-12 text-lg font-semibold text-slate-900">
                Chi tiết bài viết và bình luận
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-h-0 overflow-y-auto px-6 py-6 md:px-8">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={activeCommentsPost.author}
                    tone="from-sky-500 to-indigo-500"
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900">
                        {activeCommentsPost.author}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[activeCommentsPost.role]}`}
                      >
                        {activeCommentsPost.role}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${postTypeStyles[activeCommentsPost.postType]}`}
                      >
                        {activeCommentsPost.postType}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{activeCommentsPost.subject}</span>
                      <span className="flex items-center gap-1">
                        <FiClock className="text-slate-400" />
                        {activeCommentsPost.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiGlobe className="text-slate-400" />
                        {activeCommentsPost.visibility}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <p className="text-sm leading-7 text-slate-700 md:text-[15px]">
                    {activeCommentsPost.content}
                  </p>

                  {activeCommentsPost.media.length > 0 ? (
                    <div className={`grid gap-3 ${activeCommentsPost.media.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
                      {activeCommentsPost.media.map((mediaItem) => (
                        mediaItem.type === "image" ? (
                          <div
                            key={mediaItem.id}
                            className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-100"
                          >
                            <img
                              src={mediaItem.value}
                              alt="Ảnh bài đăng"
                              className="h-72 w-full object-cover"
                            />
                          </div>
                        ) : mediaItem.type === "video" ? (
                          <div
                            key={mediaItem.id}
                            className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-950"
                          >
                            <video
                              src={mediaItem.value}
                              controls
                              className="h-72 w-full object-cover"
                            >
                              Trình duyệt không hỗ trợ phát video.
                            </video>
                          </div>
                        ) : null
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex min-h-0 flex-col border-t border-slate-100 bg-slate-50/70 lg:border-l lg:border-t-0">
                <div className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-700">
                  {activeCommentsPost.stats.comments} bình luận
                </div>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  {activeCommentsPost.commentsPreview.length > 0 ? (
                    activeCommentsPost.commentsPreview.map((comment, commentIndex) => {
                      const canManageComment =
                        typeof comment.id === "string" &&
                        Boolean(user?.userId) &&
                        comment.authorId === user?.userId;
                      const isCommentMenuOpen = openCommentMenuId === comment.id;
                      const isEditingComment = editingCommentId === comment.id;
                      const isUpdatingComment = updatingCommentId === comment.id;
                      const isDeletingComment = deletingCommentId === comment.id;

                      return (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar
                          name={comment.author}
                          tone={mediaCardTones[commentIndex % mediaCardTones.length]}
                        />
                        <div className="min-w-0 flex-1 rounded-3xl bg-white px-4 py-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {comment.author}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[comment.role]}`}
                              >
                                {comment.role}
                              </span>
                              <span className="text-xs text-slate-400">
                                {comment.time}
                              </span>
                            </div>

                            {canManageComment ? (
                              <div className="relative shrink-0" data-comment-menu-root="true">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenCommentMenuId((currentMenuId) =>
                                      currentMenuId === comment.id ? null : String(comment.id),
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                >
                                  <FiMoreHorizontal />
                                </button>

                                {isCommentMenuOpen ? (
                                  <div className="absolute right-0 top-10 z-20 min-w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        isEditingComment
                                          ? cancelEditingComment()
                                          : startEditingComment(comment)
                                      }
                                      disabled={isDeletingComment}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <FiEdit3 className="text-slate-500" />
                                      {isEditingComment ? "Đóng chỉnh sửa" : "Chỉnh sửa bình luận"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void deleteComment(comment)}
                                      disabled={isDeletingComment || isUpdatingComment}
                                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <FiTrash2 className="text-rose-500" />
                                      {isDeletingComment ? "Đang xóa bình luận" : "Xóa bình luận"}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          {isEditingComment ? (
                            <div className="mt-3 space-y-3">
                              <textarea
                                value={editCommentContent}
                                onChange={(event) => setEditCommentContent(event.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                              />
                              <div className="flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEditingComment}
                                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void submitCommentUpdate(comment)}
                                  disabled={isUpdatingComment}
                                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isUpdatingComment ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                    })
                  ) : (
                    <div className="rounded-3xl bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
                      Chưa có bình luận nào cho bài viết này.
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 px-6 py-4">
                  <div className="flex gap-3">
                    <Avatar name="Bạn" tone="from-slate-700 to-slate-500" />
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-sm">
                      <input
                        ref={modalCommentInputRef}
                        type="text"
                        value={commentDrafts[String(activeCommentsPost.id)] || ""}
                        onChange={(event) => {
                          if (typeof activeCommentsPost.id === "string") {
                            updateCommentDraft(activeCommentsPost.id, event.target.value);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void submitComment(activeCommentsPost);
                          }
                        }}
                        placeholder="Viết bình luận mang tính xây dựng cho bài viết này"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => void submitComment(activeCommentsPost)}
                        disabled={submittingCommentPostId === activeCommentsPost.id}
                        className="rounded-full bg-sky-600 p-2 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiSend />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CommunityPage;
