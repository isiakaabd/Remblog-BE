import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../error/unauthenticated.js";

const authenticationMiddleware = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    throw new UnauthenticatedError("Authentication required");
  }
  try {
    const { id, username } = jwt.verify(token, process.env.JSON_TOKEN);
    req.user = {
      id,
      username,
    };

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};
export { authenticationMiddleware };
