import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { postsApi } from "../api/postsApi";
import { useAuth } from "../auth/useAuth";
import { Icons } from "../ui/icons";
import { notify } from "../ui/toast";
import { SkeletonBlock, SkeletonText } from "../components/Skeleton.jsx";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const I = Icons;
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsBusy, setCommentsBusy] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);
  const [commentInput, setCommentInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [commentBusy, setCommentBusy] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  function requireLogin(actionLabel) {
    notify.info(`Bạn cần đăng nhập để ${actionLabel}. Đang chuyển đến trang đăng nhập...`);
    navigate("/login");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError("");
      try {
        const data = await postsApi.detail(slug);
        if (!cancelled) {
          setPost(data);
          setBookmarked(Boolean(data?.bookmarked));
          setLiked(Boolean(data?.liked));
          setLikeCount(Number(data?.like_count || 0));
          setBookmarkCount(Number(data?.bookmark_count || 0));
          setCommentCount(Number(data?.comment_count || 0));
        }
      } catch (err) {
        const message = err?.response?.data?.message || "Không tải được bài viết";
        if (!cancelled) setError(message);
        notify.error(message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await postsApi.list({
          categoryId: post.category_id || undefined,
          excludeId: post.id,
          limit: 4,
          offset: 0
        });
        if (!cancelled) setRelatedPosts(res?.posts || []);
      } catch {
        if (!cancelled) setRelatedPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.id, post?.category_id]);

  useEffect(() => {
    if (!post || !isAuthenticated) {
      setBookmarked(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const status = await postsApi.bookmarkStatus(post.id);
        if (!cancelled) setBookmarked(Boolean(status));
      } catch {
        if (!cancelled) setBookmarked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.id, isAuthenticated]);

  useEffect(() => {
    if (!post?.id) return;
    loadComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  useEffect(() => {
    if (!post?.id || !isAuthenticated) {
      setLiked(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const status = await postsApi.likeStatus(post.id);
        if (!cancelled) {
          setLiked(Boolean(status?.liked));
          setLikeCount(Number(status?.likeCount || 0));
        }
      } catch {
        if (!cancelled) setLiked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [post?.id, isAuthenticated]);

  const safeHtml = useMemo(() => {
    const html = post?.content_html || "";
    return DOMPurify.sanitize(html);
  }, [post]);

  function BlogDetailSkeleton() {
    return (
      <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10">
        <div className="space-y-3">
          <SkeletonBlock className="h-7 w-4/5" staggerIndex={1} />
          <SkeletonBlock className="h-4 w-2/3" staggerIndex={2} />
          <div className="flex flex-wrap gap-2 pt-1">
            <SkeletonBlock className="h-6 w-24" radius="rounded-full" staggerIndex={3} />
            <SkeletonBlock className="h-6 w-28" radius="rounded-full" staggerIndex={4} />
            <SkeletonBlock className="h-6 w-20" radius="rounded-full" staggerIndex={5} />
          </div>
        </div>
        <SkeletonBlock className="h-64 w-full" radius="rounded-2xl" staggerIndex={6} />
        <div className="space-y-2">
          <SkeletonText lines={3} staggerBase={7} />
          <SkeletonText lines={3} staggerBase={11} />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
          <SkeletonBlock className="h-10 w-40" radius="rounded-xl" staggerIndex={18} />
          <SkeletonBlock className="h-10 w-36" radius="rounded-xl" staggerIndex={19} />
        </div>
      </div>
    );
  }

  async function loadComments(targetPage = commentsPage) {
    if (!post?.id) return;
    setCommentsBusy(true);
    try {
      const res = await postsApi.comments(post.id, { page: targetPage, limit: 10 });
      const list = Array.isArray(res?.comments) ? res.comments : [];
      setComments(list);
      setCommentCount(Number(res?.total || list.length || 0));
      setCommentsPage(Number(res?.page || targetPage));
      setCommentsTotalPages(Math.max(1, Number(res?.totalPages || 1)));
    } catch {
      setComments([]);
      setCommentsTotalPages(1);
    } finally {
      setCommentsBusy(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!post?.id) return;
    if (!isAuthenticated) {
      requireLogin("bình luận");
      return;
    }
    const content = commentInput.trim();
    if (!content) {
      notify.warning("Vui lòng nhập nội dung bình luận");
      return;
    }
    try {
      setCommentBusy(true);
      await postsApi.addComment(post.id, { content, parentId: replyTo || null });
      setCommentInput("");
      setReplyTo(null);
      await loadComments(1);
      notify.success("Đã gửi bình luận");
    } catch (err) {
      notify.error(err?.response?.data?.message || "Không thể gửi bình luận");
    } finally {
      setCommentBusy(false);
    }
  }

  function startEditComment(comment) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || "");
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  async function saveEditComment(commentId) {
    if (!post?.id) return;
    if (!isAuthenticated) {
      requireLogin("sửa bình luận");
      return;
    }
    const content = editingCommentText.trim();
    if (!content) {
      notify.warning("Nội dung bình luận không được để trống");
      return;
    }
    try {
      setCommentBusy(true);
      await postsApi.updateComment(post.id, commentId, { content });
      cancelEditComment();
      await loadComments(commentsPage);
      notify.success("Đã cập nhật bình luận");
    } catch (err) {
      notify.error(err?.response?.data?.message || "Không thể cập nhật bình luận");
    } finally {
      setCommentBusy(false);
    }
  }

  async function removeComment(commentId) {
    if (!post?.id) return;
    if (!isAuthenticated) {
      requireLogin("xoá bình luận");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xoá bình luận này?")) return;
    try {
      setCommentBusy(true);
      await postsApi.deleteComment(post.id, commentId);
      await loadComments(commentsPage);
      notify.success("Đã xoá bình luận");
    } catch (err) {
      notify.error(err?.response?.data?.message || "Không thể xoá bình luận");
    } finally {
      setCommentBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header actions */}
      <div className="mb-4 flex flex-wrap items-center gap-3" data-aos="fade-up">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <I.Back className="text-[14px]" />
          Quay lại
        </button>
        <Link to="/blog" className="btn-secondary">
          <I.Newspaper className="mr-2 text-[14px]" />
          Danh sách bài viết
        </Link>
        <Link to="/" className="btn-secondary">
          <I.Room className="mr-2 text-[14px]" />
          Trang chủ
        </Link>
        {post && (
          <button
            type="button"
            disabled={bookmarkBusy}
            onClick={async () => {
              if (!isAuthenticated) {
                requireLogin("lưu bài viết");
                return;
              }
              try {
                setBookmarkBusy(true);
                if (bookmarked) {
                  await postsApi.bookmarkRemove(post.id);
                  setBookmarked(false);
                  setBookmarkCount((c) => Math.max(0, c - 1));
                  notify.success("Đã bỏ lưu bài viết");
                } else {
                  await postsApi.bookmarkAdd(post.id);
                  setBookmarked(true);
                  setBookmarkCount((c) => c + 1);
                  notify.success("Đã lưu bài viết");
                }
              } catch (err) {
                const message = err?.response?.data?.message || "Không thể cập nhật bookmark";
                notify.error(message);
              } finally {
                setBookmarkBusy(false);
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              bookmarked
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {bookmarked ? (
              <I.Bookmark className="text-[14px] text-amber-500" />
            ) : (
              <I.BookmarkOutline className="text-[14px] text-ink-400" />
            )}
                {bookmarked ? "Đã lưu bài viết" : "Lưu bài viết"}
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{bookmarkCount}</span>
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white/95 shadow-sm" data-aos="fade-up">
        <div className="border-b border-ink-100 bg-linear-to-r from-ink-900 via-ink-800 to-brand-900 px-6 py-6 sm:px-8 sm:py-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-100">
              <I.Reader className="text-[10px]" />
              Bài viết
            </div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{post?.title || "—"}</h1>
            <p className="mt-3 text-sm text-ink-100">
              Tin tức, hướng dẫn và kinh nghiệm thực tế dành cho người thuê trọ và chủ trọ.
            </p>
            {post && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-100/90">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  <I.User className="text-[10px]" />
                  {post.author_full_name || "Admin"}
                </span>
                {post.category_name ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                    <I.Tag className="text-[10px]" />
                    {post.category_name}
                  </span>
                ) : null}
                {post.published_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                    <I.Clock className="text-[10px]" />
                    {new Date(post.published_at).toLocaleDateString("vi-VN")}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  ❤ {likeCount.toLocaleString("vi-VN")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  💬 {commentCount.toLocaleString("vi-VN")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1">
                  🔖 {bookmarkCount.toLocaleString("vi-VN")}
                </span>
              </div>
            )}
          </div>
        </div>

        {busy ? <BlogDetailSkeleton /> : null}
        {error ? (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:m-8">
            {error}
          </div>
        ) : null}

        {!busy && post ? (
          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10">
            {post.cover_image_url ? (
              <div className="overflow-hidden rounded-2xl border border-ink-100">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>
            ) : null}
            <div className="prose max-w-none text-ink-700" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4">
              <button
                type="button"
                disabled={likeBusy}
                onClick={async () => {
                  if (!isAuthenticated) {
                    requireLogin("thích bài viết");
                    return;
                  }
                  try {
                    setLikeBusy(true);
                    if (liked) {
                      const res = await postsApi.likeRemove(post.id);
                      setLiked(false);
                      setLikeCount(Number(res?.likeCount || 0));
                    } else {
                      const res = await postsApi.likeAdd(post.id);
                      setLiked(true);
                      setLikeCount(Number(res?.likeCount || 0));
                    }
                  } catch (err) {
                    notify.error(err?.response?.data?.message || "Không thể cập nhật lượt thích");
                  } finally {
                    setLikeBusy(false);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  liked
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                <span>{liked ? "❤" : "♡"}</span>
                {liked ? "Đã thích" : "Thích bài viết"}
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{likeCount}</span>
              </button>
              <button
                type="button"
                disabled={bookmarkBusy}
                onClick={async () => {
                  if (!isAuthenticated) {
                    requireLogin("lưu bài viết");
                    return;
                  }
                  try {
                    setBookmarkBusy(true);
                    if (bookmarked) {
                      await postsApi.bookmarkRemove(post.id);
                      setBookmarked(false);
                      setBookmarkCount((c) => Math.max(0, c - 1));
                    } else {
                      await postsApi.bookmarkAdd(post.id);
                      setBookmarked(true);
                      setBookmarkCount((c) => c + 1);
                    }
                  } catch (err) {
                    notify.error(err?.response?.data?.message || "Không thể cập nhật lưu bài viết");
                  } finally {
                    setBookmarkBusy(false);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  bookmarked
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                <I.Bookmark className="text-[14px]" />
                {bookmarked ? "Đã lưu" : "Lưu bài viết"}
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{bookmarkCount}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!busy && post ? (
        <section className="mt-8 rounded-3xl border border-ink-200 bg-white/95 p-6 sm:p-8" data-aos="fade-up">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-brand-500">Thảo luận</div>
              <h2 className="mt-1 text-lg font-semibold text-ink-900">
                Bình luận ({commentCount.toLocaleString("vi-VN")})
              </h2>
            </div>
          </div>

          <form onSubmit={submitComment} className="rounded-2xl border border-ink-200 bg-ink-50/50 p-4">
            {replyTo ? (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <span>Đang trả lời bình luận #{replyTo}</span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="font-semibold hover:underline"
                >
                  Huỷ
                </button>
              </div>
            ) : null}
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={isAuthenticated ? "Nhập bình luận của bạn..." : "Đăng nhập để bình luận"}
              className="input-base min-h-24 resize-y"
              disabled={commentBusy}
              onFocus={() => {
                if (!isAuthenticated) requireLogin("bình luận");
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-500">
                Nội dung lịch sự, tôn trọng cộng đồng và liên quan đến bài viết.
              </p>
              <button
                type="submit"
                disabled={commentBusy}
                className="btn-primary"
              >
                {commentBusy ? "Đang gửi..." : "Gửi bình luận"}
              </button>
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {commentsBusy ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`c-sk-${idx}`} className="rounded-2xl border border-ink-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <SkeletonBlock className="h-4 w-32" staggerIndex={idx} />
                      <SkeletonBlock className="h-3 w-24" staggerIndex={idx + 1} />
                    </div>
                    <div className="mt-2">
                      <SkeletonText lines={2} staggerBase={idx + 2} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {!commentsBusy && comments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-5 text-sm text-ink-500">
                Chưa có bình luận nào. Hãy trở thành người đầu tiên thảo luận.
              </div>
            ) : null}
            {comments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-ink-900">{c.user_name || "Người dùng"}</div>
                  <div className="text-xs text-ink-500">
                    {c.created_at ? new Date(c.created_at).toLocaleString("vi-VN") : ""}
                  </div>
                </div>
                {editingCommentId === c.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="input-base min-h-20 resize-y"
                      disabled={commentBusy}
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-primary" disabled={commentBusy} onClick={() => saveEditComment(c.id)}>
                        Lưu
                      </button>
                      <button type="button" className="btn-secondary" disabled={commentBusy} onClick={cancelEditComment}>
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{c.content}</div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    onClick={() => {
                      if (!isAuthenticated) {
                        requireLogin("trả lời bình luận");
                        return;
                      }
                      setReplyTo(c.id);
                    }}
                  >
                    Trả lời
                  </button>
                  {c.can_edit ? (
                    <>
                      <button
                        type="button"
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                        onClick={() => startEditComment(c)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                        onClick={() => removeComment(c.id)}
                      >
                        Xoá
                      </button>
                    </>
                  ) : null}
                </div>
                {Array.isArray(c.replies) && c.replies.length > 0 ? (
                  <div className="mt-3 space-y-2 border-l-2 border-ink-100 pl-3">
                    {c.replies.map((r) => (
                      <div key={r.id} className="rounded-xl border border-ink-200 bg-ink-50/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-ink-900">{r.user_name || "Người dùng"}</div>
                          <div className="text-[11px] text-ink-500">
                            {r.created_at ? new Date(r.created_at).toLocaleString("vi-VN") : ""}
                          </div>
                        </div>
                        {editingCommentId === r.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="input-base min-h-20 resize-y"
                              disabled={commentBusy}
                            />
                            <div className="flex items-center gap-2">
                              <button type="button" className="btn-primary" disabled={commentBusy} onClick={() => saveEditComment(r.id)}>
                                Lưu
                              </button>
                              <button type="button" className="btn-secondary" disabled={commentBusy} onClick={cancelEditComment}>
                                Huỷ
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{r.content}</div>
                        )}
                        {r.can_edit ? (
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                              onClick={() => startEditComment(r)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                              onClick={() => removeComment(r.id)}
                            >
                              Xoá
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {commentsTotalPages > 1 ? (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={commentsBusy || commentsPage <= 1}
                  onClick={() => loadComments(commentsPage - 1)}
                >
                  Trang trước
                </button>
                <span className="text-sm text-ink-600">
                  Trang {commentsPage}/{commentsTotalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={commentsBusy || commentsPage >= commentsTotalPages}
                  onClick={() => loadComments(commentsPage + 1)}
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {relatedPosts.length > 0 && (
        <section className="mt-8 rounded-3xl border border-ink-200 bg-white/95 p-6 sm:p-8" data-aos="fade-up">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-brand-500">Bài viết liên quan</div>
              <h2 className="mt-1 text-lg font-semibold text-ink-900">Có thể bạn cũng quan tâm</h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Xem tất cả
              <I.ArrowRightLong className="text-[11px]" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
              >
                <div className="relative h-32 w-full overflow-hidden bg-ink-50">
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-ink-400">
                      <I.Newspaper className="mr-1 text-[14px]" />
                      Không có ảnh bìa
                    </div>
                  )}
                  {p.category_name ? (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-slate-50 backdrop-blur">
                      <I.Tag className="text-[10px] text-amber-300" />
                      {p.category_name}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                    {p.title}
                  </div>
                  <div className="line-clamp-2 text-xs text-ink-500">{p.excerpt || "—"}</div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-1">
                      <I.User className="text-[10px]" />
                      {p.author_full_name || "Admin"}
                    </span>
                    {p.published_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-1">
                        <I.Clock className="text-[10px]" />
                        {new Date(p.published_at).toLocaleDateString("vi-VN")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

