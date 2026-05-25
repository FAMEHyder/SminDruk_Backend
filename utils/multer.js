import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp"); // ✅ Railway safe folder
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "video/mp4",
    "video/mpeg",
    "video/quicktime"
  ];

  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only images & videos allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export default upload;