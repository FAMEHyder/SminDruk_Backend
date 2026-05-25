
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    console.log("Apka token ye hay cookie say aya hy :" , token)

    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // attach user data
    next();

  } catch (error) {
    return res.status(403).json({
      status: false,
      message: "Invalid or expired token",
    });
  }
};


export const isUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({ message: "Users only area" });
  }

  next();
};



export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only area" });
  }

  next();
};