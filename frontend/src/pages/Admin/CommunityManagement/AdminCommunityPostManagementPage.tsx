import { useEffect, useMemo, useState } from "react";
import communityService, {
  type CommunityPostResponse,
} from "../../../services/community/communityService";
import commentService, {
  type CommunityCommentResponse,
} from "../../../services/community/commentService";

type CommentsByPostId = Record<string, CommunityCommentResponse[]>;
type CommentsLoadingByPostId = Record<string, boolean>;
type ViolationFilterMode = "all" | "suspected";

type ModerationCommentRow = {
  postId: string;
  postAuthorName: string;
  postContent: string;
  comment: CommunityCommentResponse;
};

type ErrorWithResponse = { response?: { data?: { message?: string } } };

const VIOLATION_KEYWORDS = [
  "spam",
  "lừa đảo",
  "bán acc",
  "cờ bạc",
  "cá độ",
  "18+",
  "kiếm tiền nhanh",
  "khuyến mãi sốc",
  "telegram",
  "zalo",
  "liên hệ ngay",
];

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Vừa xong";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Vừa xong";
  }

  return parsed.toLocaleString("vi-VN");
};

const truncateText = (value: string, maxLength = 140) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
};

const isPotentialViolation = (content?: string | null) => {
  if (!content) {
    return false;
  }

  const normalized = content.toLowerCase();
  const hasKeyword = VIOLATION_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  const hasContactOrLink =
    /(https?:\/\/|www\.|t\.me\/|(?:\+?84|0)\d{9,10})/i.test(content);

  return hasKeyword || hasContactOrLink;
};

const AdminCommunityPostManagementPage = () => {
  const [posts, setPosts] = useState<CommunityPostResponse[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<CommentsByPostId>({});
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] =
    useState<CommentsLoadingByPostId>({});
  const [commentFilterKeyword, setCommentFilterKeyword] = useState("");
  const [violationFilter, setViolationFilter] =
    useState<ViolationFilterMode>("all");
  const [isLoadingAllComments, setIsLoadingAllComments] = useState(false);
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hidingCommentId, setHidingCommentId] = useState<string | null>(null);

  const loadPosts = async () => {
    setIsLoadingPosts(true);
    setPostsError(null);

    try {
      const response = await communityService.getPosts(1, 50);
      const postData = response?.result?.data ?? [];
      setPosts(postData);
      setCommentsByPostId({});
      setCommentsLoadingByPostId({});
      setOpenPostId(null);
      setAllCommentsLoaded(false);
    } catch (error) {
      const err = error as ErrorWithResponse;
      setPostsError(
        err?.response?.data?.message || "Không thể tải danh sách bài viết cộng đồng.",
      );
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const visiblePosts = useMemo(
    () => posts.filter((post) => post.active !== false),
    [posts],
  );

  const moderationRows = useMemo<ModerationCommentRow[]>(
    () =>
      visiblePosts.flatMap((post) => {
        const postComments = commentsByPostId[post.postId] || [];
        return postComments
          .filter((comment) => comment.active !== false)
          .map((comment) => ({
            postId: post.postId,
            postAuthorName: post.authorName,
            postContent: post.content || "",
            comment,
          }));
      }),
    [commentsByPostId, visiblePosts],
  );

  const normalizedCommentKeyword = commentFilterKeyword.trim().toLowerCase();

  const filteredModerationRows = useMemo(
    () =>
      moderationRows.filter((row) => {
        const commentContent = (row.comment.content || "").toLowerCase();
        const commentAuthor = (row.comment.authorName || "").toLowerCase();
        const postContent = (row.postContent || "").toLowerCase();

        const matchesKeyword =
          normalizedCommentKeyword.length === 0
            ? true
            : commentContent.includes(normalizedCommentKeyword) ||
              commentAuthor.includes(normalizedCommentKeyword) ||
              postContent.includes(normalizedCommentKeyword);

        const matchesViolationFilter =
          violationFilter === "suspected"
            ? isPotentialViolation(row.comment.content)
            : true;

        return matchesKeyword && matchesViolationFilter;
      }),
    [moderationRows, normalizedCommentKeyword, violationFilter],
  );

  const loadAllComments = async () => {
    if (visiblePosts.length === 0) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setIsLoadingAllComments(true);

    const postsToLoad = visiblePosts.filter(
      (post) => commentsByPostId[post.postId] === undefined,
    );

    if (postsToLoad.length === 0) {
      setAllCommentsLoaded(true);
      setActionMessage("Tất cả bình luận đã được tải sẵn.");
      setIsLoadingAllComments(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        postsToLoad.map(async (post) => {
          const response = await commentService.getCommentsByPostId(post.postId);
          return {
            postId: post.postId,
            comments: Array.isArray(response.result) ? response.result : [],
          };
        }),
      );

      const nextCommentsByPostId: CommentsByPostId = {};
      let failedCount = 0;

      results.forEach((result, index) => {
        const postId = postsToLoad[index]?.postId;
        if (!postId) {
          return;
        }

        if (result.status === "fulfilled") {
          nextCommentsByPostId[postId] = result.value.comments;
          return;
        }

        failedCount += 1;
        nextCommentsByPostId[postId] = [];
      });

      setCommentsByPostId((current) => ({
        ...current,
        ...nextCommentsByPostId,
      }));

      if (failedCount > 0) {
        setAllCommentsLoaded(false);
        setActionError(
          `Đã tải bình luận, nhưng có ${failedCount} bài viết không thể lấy bình luận.`,
        );
      } else {
        setAllCommentsLoaded(true);
        setActionMessage("Đã tải tất cả bình luận để lọc vi phạm.");
      }
    } catch (error) {
      const err = error as ErrorWithResponse;
      setAllCommentsLoaded(false);
      setActionError(
        err?.response?.data?.message ||
          "Không thể tải toàn bộ bình luận. Vui lòng thử lại.",
      );
    } finally {
      setIsLoadingAllComments(false);
    }
  };

  const togglePostComments = async (postId: string) => {
    setActionError(null);
    setActionMessage(null);

    if (openPostId === postId) {
      setOpenPostId(null);
      return;
    }

    setOpenPostId(postId);

    if (commentsByPostId[postId]) {
      return;
    }

    setCommentsLoadingByPostId((current) => ({
      ...current,
      [postId]: true,
    }));

    try {
      const response = await commentService.getCommentsByPostId(postId);
      setCommentsByPostId((current) => ({
        ...current,
        [postId]: Array.isArray(response.result) ? response.result : [],
      }));
    } catch (error) {
      const err = error as ErrorWithResponse;
      setActionError(
        err?.response?.data?.message || "Không thể tải danh sách bình luận.",
      );
      setCommentsByPostId((current) => ({
        ...current,
        [postId]: [],
      }));
    } finally {
      setCommentsLoadingByPostId((current) => ({
        ...current,
        [postId]: false,
      }));
    }
  };

  const handleHideComment = async (postId: string, commentId: string) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn ẩn bình luận này vì vi phạm quy tắc cộng đồng không?",
    );

    if (!confirmed) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setHidingCommentId(commentId);

    try {
      const response = await commentService.deleteComment(commentId);
      if (response.code !== 0 && response.code !== 200) {
        throw new Error(response.message || "Không thể ẩn bình luận.");
      }

      setCommentsByPostId((current) => ({
        ...current,
        [postId]: (current[postId] || []).filter(
          (comment) => comment.commentId !== commentId,
        ),
      }));

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.postId === postId
            ? {
                ...post,
                commentCount: Math.max(0, (post.commentCount || 0) - 1),
              }
            : post,
        ),
      );

      setActionMessage("Đã ẩn bình luận vi phạm quy tắc cộng đồng.");
    } catch (error) {
      const err = error as ErrorWithResponse;
      setActionError(
        err?.response?.data?.message ||
          (error instanceof Error
            ? error.message
            : "Ẩn bình luận thất bại. Vui lòng thử lại."),
      );
    } finally {
      setHidingCommentId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý bài viết cộng đồng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem bài viết, danh sách bình luận và ẩn bình luận vi phạm trực tiếp tại trang quản trị.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPosts()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          Tải lại danh sách
        </button>
      </div>

      {actionMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {postsError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {postsError}
        </div>
      ) : null}

      {isLoadingPosts ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
          Đang tải bài viết cộng đồng...
        </div>
      ) : null}

      {!isLoadingPosts && visiblePosts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center text-sm text-gray-500">
          Không có bài viết cộng đồng nào để quản lý.
        </div>
      ) : null}

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-amber-900">
            Lọc bình luận toàn bộ bài viết
          </h2>
          <p className="mt-1 text-xs text-amber-800">
            Tải comment của tất cả bài viết, sau đó lọc nhanh để rà soát bình luận có dấu hiệu vi phạm cộng đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <input
            type="text"
            value={commentFilterKeyword}
            onChange={(event) => setCommentFilterKeyword(event.target.value)}
            placeholder="Lọc theo nội dung comment, tác giả, nội dung bài viết..."
            className="lg:col-span-6 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />

          <select
            value={violationFilter}
            onChange={(event) =>
              setViolationFilter(event.target.value as ViolationFilterMode)
            }
            className="lg:col-span-3 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="all">Hiển thị tất cả comment</option>
            <option value="suspected">Chỉ comment nghi ngờ vi phạm</option>
          </select>

          <button
            type="button"
            onClick={() => void loadAllComments()}
            disabled={isLoadingAllComments}
            className="lg:col-span-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {isLoadingAllComments
              ? "Đang tải comment..."
              : "Tải comment tất cả bài"}
          </button>
        </div>

        <div className="text-xs text-amber-900 flex flex-wrap gap-x-4 gap-y-1">
          <span>{moderationRows.length} comment đã tải</span>
          <span>{filteredModerationRows.length} comment sau lọc</span>
          <span>{allCommentsLoaded ? "Đã tải đủ comment." : "Chưa tải đủ comment."}</span>
        </div>

        {filteredModerationRows.length === 0 ? (
          <p className="text-sm text-amber-900">
            {moderationRows.length === 0
              ? "Chưa có comment để lọc. Hãy bấm 'Tải comment tất cả bài'."
              : "Không có comment nào phù hợp bộ lọc hiện tại."}
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
            {filteredModerationRows.map((row) => {
              const suspectedViolation = isPotentialViolation(row.comment.content);

              return (
                <article
                  key={row.comment.commentId}
                  className="rounded-xl border border-amber-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs text-gray-500">
                        Bài viết của <span className="font-semibold text-gray-700">{row.postAuthorName}</span>
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {truncateText(row.postContent || "(Không có nội dung bài viết)", 120)}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {row.comment.authorName}
                      </div>
                      <p className="text-sm text-gray-700 break-words">
                        {row.comment.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">
                          {formatDateTime(row.comment.createdAt)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            suspectedViolation
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {suspectedViolation
                            ? "Nghi ngờ vi phạm"
                            : "Không có dấu hiệu rõ ràng"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleHideComment(row.postId, row.comment.commentId)
                      }
                      disabled={hidingCommentId === row.comment.commentId}
                      className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {hidingCommentId === row.comment.commentId
                        ? "Đang ẩn..."
                        : "Ẩn bình luận"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="space-y-4">
        {visiblePosts.map((post) => {
          const isExpanded = openPostId === post.postId;
          const comments = commentsByPostId[post.postId] || [];
          const isCommentsLoading = commentsLoadingByPostId[post.postId] || false;

          return (
            <article
              key={post.postId}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-2 min-w-0">
                    <div className="text-sm text-gray-500">
                      Tác giả: <span className="font-semibold text-gray-800">{post.authorName}</span>
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 line-clamp-2">
                      {truncateText(post.content || "(Không có nội dung)", 180)}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{post.likeCount || 0} lượt thích</span>
                      <span>{post.commentCount || 0} bình luận</span>
                      <span>{formatDateTime(post.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void togglePostComments(post.postId)}
                    className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
                  >
                    {isExpanded ? "Ẩn bình luận" : "Xem bình luận"}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="px-5 py-4 space-y-3">
                  {isCommentsLoading ? (
                    <p className="text-sm text-gray-500">Đang tải bình luận...</p>
                  ) : null}

                  {!isCommentsLoading && comments.length === 0 ? (
                    <p className="text-sm text-gray-500">Bài viết này chưa có bình luận nào đang hiển thị.</p>
                  ) : null}

                  {!isCommentsLoading
                    ? comments.map((comment) => (
                        <div
                          key={comment.commentId}
                          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900">
                                {comment.authorName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDateTime(comment.createdAt)}
                              </div>
                              <p className="text-sm text-gray-700 mt-2 break-words">
                                {comment.content}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void handleHideComment(post.postId, comment.commentId)
                              }
                              disabled={hidingCommentId === comment.commentId}
                              className="shrink-0 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                              {hidingCommentId === comment.commentId
                                ? "Đang ẩn..."
                                : "Ẩn bình luận"}
                            </button>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCommunityPostManagementPage;

