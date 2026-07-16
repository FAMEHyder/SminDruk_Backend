import ConnectedPage from "../models/connectedPage.model.js";

/**
 * Returns the next available page number for the trending dataset.
 * Existing pages keep their assigned number on reconnect.
 */
const getNextPageNumbers = async (pages) => {
  const existingPages = await ConnectedPage.find({
    pageId: { $in: pages.map((page) => page.id) },
  }).select("pageId pageNumber");

  const existingMap = new Map(existingPages.map((page) => [page.pageId, page.pageNumber]));
  const maxDoc = await ConnectedPage.findOne().sort({ pageNumber: -1 }).select("pageNumber");
  let nextNumber = maxDoc?.pageNumber || 0;

  return pages.map((page) => {
    if (existingMap.has(page.id)) {
      return existingMap.get(page.id);
    }
    nextNumber += 1;
    return nextNumber;
  });
};

export { getNextPageNumbers };
