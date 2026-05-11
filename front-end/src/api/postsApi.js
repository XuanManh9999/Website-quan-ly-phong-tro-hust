import { http } from "./http";

export const postsApi = {
  /** @returns {{ posts: any[], total: number, limit: number, offset: number }} */
  async list(params) {
    const res = await http.get("/posts", { params });
    return {
      posts: res.data.posts,
      total: res.data.total ?? 0,
      limit: res.data.limit,
      offset: res.data.offset
    };
  },
  async bookmarkStatus(postId) {
    const res = await http.get(`/posts/${postId}/bookmarks`);
    return res.data.bookmarked;
  },
  async bookmarkAdd(postId) {
    const res = await http.post(`/posts/${postId}/bookmarks`);
    return res.data;
  },
  async bookmarkRemove(postId) {
    const res = await http.delete(`/posts/${postId}/bookmarks`);
    return res.data;
  },
  async likeStatus(postId) {
    const res = await http.get(`/posts/${postId}/likes`);
    return res.data;
  },
  async likeAdd(postId) {
    const res = await http.post(`/posts/${postId}/likes`);
    return res.data;
  },
  async likeRemove(postId) {
    const res = await http.delete(`/posts/${postId}/likes`);
    return res.data;
  },
  async comments(postId, params) {
    const res = await http.get(`/posts/${postId}/comments`, { params });
    return res.data;
  },
  async addComment(postId, payload) {
    const res = await http.post(`/posts/${postId}/comments`, payload);
    return res.data;
  },
  async updateComment(postId, commentId, payload) {
    const res = await http.patch(`/posts/${postId}/comments/${commentId}`, payload);
    return res.data;
  },
  async deleteComment(postId, commentId) {
    const res = await http.delete(`/posts/${postId}/comments/${commentId}`);
    return res.data;
  },
  /** @param {{ page?: number, limit?: number }} [params] */
  async myBookmarks(params) {
    const res = await http.get("/posts/me/bookmarks", { params });
    return res.data;
  },
  /** @param {{ page?: number, limit?: number }} [params] */
  async myLikes(params) {
    const res = await http.get("/posts/me/likes", { params });
    return res.data;
  },
  async detail(slug) {
    const res = await http.get(`/posts/${slug}`);
    return res.data.post;
  },
  async adminList(params) {
    const res = await http.get("/posts/admin/list", { params });
    return res.data;
  },
  async adminDetail(id) {
    const res = await http.get(`/posts/admin/${id}`);
    return res.data.post;
  },
  async adminCreate(payload) {
    const res = await http.post("/posts/admin", payload);
    return res.data.post;
  },
  async adminUpdate(id, payload) {
    const res = await http.put(`/posts/admin/${id}`, payload);
    return res.data.post;
  },
  async adminRemove(id) {
    const res = await http.delete(`/posts/admin/${id}`);
    return res.data;
  },
  async adminPublish(id) {
    const res = await http.patch(`/posts/admin/${id}/publish`);
    return res.data;
  },
  async adminUnpublish(id) {
    const res = await http.patch(`/posts/admin/${id}/unpublish`);
    return res.data;
  },
  async categories() {
    const res = await http.get("/post-categories");
    return res.data.categories;
  },
  async adminCategories() {
    const res = await http.get("/post-categories/admin/list");
    return res.data.categories;
  },
  async tags() {
    const res = await http.get("/post-tags");
    return res.data.tags;
  },
  async adminTags() {
    const res = await http.get("/post-tags/admin/list");
    return res.data.tags;
  },
  async adminCreateTag(payload) {
    const res = await http.post("/post-tags/admin", payload);
    return res.data.tag;
  },
  async adminUpdateTag(id, payload) {
    const res = await http.put(`/post-tags/admin/${id}`, payload);
    return res.data.tag;
  },
  async adminRemoveTag(id) {
    const res = await http.delete(`/post-tags/admin/${id}`);
    return res.data;
  },
  async adminCreateCategory(payload) {
    const res = await http.post("/post-categories/admin", payload);
    return res.data.category;
  },
  async adminUpdateCategory(id, payload) {
    const res = await http.put(`/post-categories/admin/${id}`, payload);
    return res.data.category;
  },
  async adminRemoveCategory(id) {
    const res = await http.delete(`/post-categories/admin/${id}`);
    return res.data;
  }
};

