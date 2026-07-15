import jwt from "jsonwebtoken";
import { getJwtSecret } from "./env.js";

// Falls back to JWT_SECRET if a dedicated refresh secret isn't configured yet,
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET?.trim() || getJwtSecret();

const generateAccessToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());

const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());
const generateAuthTokens = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export { generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateAuthTokens, };
