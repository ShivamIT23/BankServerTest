const { JWT_Secret } = require("./config");
const jwt = require("jsonwebtoken");

module.exports = async function authMiddleware(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: "Unauthorized", error: "No token" });
  }
  const token = authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_Secret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Unauthorized", error: "Invalid token" });
  }
};
