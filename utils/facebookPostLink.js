/**
 * Builds a clickable Facebook permalink from Graph API post/photo/video ids.
 */
const buildFacebookPostLink = (pageId, postId) => {
  if (!postId) return null;

  const id = String(postId);
  if (id.includes("_")) {
    const [page, ...rest] = id.split("_");
    const storyId = rest.join("_");
    return `https://www.facebook.com/${page}/posts/${storyId}`;
  }

  return `https://www.facebook.com/${pageId}/posts/${id}`;
};

export { buildFacebookPostLink };
