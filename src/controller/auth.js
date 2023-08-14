import { StatusCodes } from "http-status-codes";
import User from "../models/auth.js";
import { checkRequiredParams } from "../utils/index.js";
import { UnauthenticatedError } from "../error/unauthenticated.js";

const login = async (req, res) => {
  const { username, password } = req.body;
  const params = {
    username,
    password,
  };
  const requiredParams = ["username", "password"];
  await checkRequiredParams(params, requiredParams);
  const user = await User.findOne({ username });

  if (!user) throw new UnauthenticatedError("Invalid username or password");
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect)
    throw new UnauthenticatedError("Invalid username or password");
  const token = await user.generateToken();
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .status(StatusCodes.OK)
    .json({ success: true, user: { username: user.username } });
};
const register = async (req, res) => {
  const { password, username } = req.body;
  const params = {
    username,
    password,
  };
  const requiredParams = ["username", "password"];
  await checkRequiredParams(params, requiredParams);
  await User.create(params);
  res
    .status(StatusCodes.CREATED)
    .json({ success: true, message: "User successfully created" });
};
const logout = async (_, res) => {
  await res
    .clearCookie("token")
    .status(StatusCodes.OK)
    .json({ success: true, message: "User logged out" });
};
export { login, register, logout };
