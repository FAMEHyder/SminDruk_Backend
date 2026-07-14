import jwt from "jsonwebtoken";

// Falls back to JWT_SECRET if a dedicated refresh secret isn't configured yet,
// so auth works out of the box even before every optional env var is filled in.
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

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
