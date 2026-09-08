import PagePost from "../models/pagePost.model.js";
import logger from "./logger.js";

const recordPagePost = async ({ filter, data }) => {
  if (!filter || !Object.keys(filter).length) return;
  try {
    await PagePost.findOneAndUpdate(filter, { $set: data }, { upsert: true, new: true, setDefaultsOnInsert: true });
  } catch (error) {
    if (error?.code === 11000) {
      try {
        await PagePost.findOneAndUpdate(filter, { $set: data });
        return;
      } catch (retryError) {
        logger.warn(`PagePost upsert skipped after duplicate: ${retryError.message}`);
        return;
      }
    }
    logger.warn(`PagePost record failed: ${error.message}`);
  }
};

export { recordPagePost };
