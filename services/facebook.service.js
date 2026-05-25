import axios from "axios";

export const postToFacebook = async (post) => {
  const pageId = post.pages[0];
  const token = "PAGE_ACCESS_TOKEN";

  if (post.type === "post") {
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        message: post.text,
        access_token: token,
      }
    );
    return res.data;
  }

  throw new Error("Type not implemented yet");
};
