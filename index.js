import express from "express";
import dotenv from "dotenv";
import DataBaseConnection from "./database/database.js";
import cors from "cors";
import userroute from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import facebookRoutes from "./routes/connectedPages.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

// ✅ Body parsers (ONLY ONCE, with limit)
app.use(express.json({ limit: process.env.LIMITS || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.LIMITS || "10mb" }));

// ✅ Cookie parser (MUST be before routes)
app.use(cookieParser());
  
// ✅ CORS (must be before routes)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5678",
  "https://smindruk.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const mediaPath = path.join(_dirname, "..", "media");

app.use("/media", express.static(mediaPath));

// ✅ Routes
app.use("/user", userroute);
app.use("/auth", authRoutes);
app.use("/api", facebookRoutes);

// ✅ Start server AFTER everything
const port = process.env.PORT || 8009;

app.get("/", (req, res) => {
  res.send("✅ check 123");
});

app.listen(port, async () => {
  await DataBaseConnection();
  console.log(`✅ Server running at http://localhost:${port}`);
});
