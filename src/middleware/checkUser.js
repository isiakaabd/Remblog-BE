import { UnauthenticatedError } from "../error/unauthenticated.js";
import User from "../models/auth.js";

const checkUserExists = async (email, username) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    let x = null;
    if (existingUser.email === email) {
      x = "Email already exists";
    } else {
      x = "Username already exists";
    }
    throw new UnauthenticatedError(x);
  }

  return true;
};

export { checkUserExists };
