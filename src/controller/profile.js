import { StatusCodes } from "http-status-codes";
import User from "../models/auth.js";
import { checkRequiredParams } from "../utils/index.js";

const profile = async (req, res) => {
  const { username } = req.user;
  const user = await User.findOne({ username }).select("-password");
  res.json({ success: true, data: user }).status(StatusCodes.OK);
};
const updateProfile = async (req, res) => {
  const { email, name, address } = req.body;
  const params = { email, name, address };
  params.username = req.user.username;
  const requiredParams = ["username"];
  await checkRequiredParams(params, requiredParams);
  const user = await User.findOneAndUpdate(
    { username: params.username },
    { ...req.body },
    { new: true }
  ).select("-password");
  res.json({ success: true, data: user }).status(StatusCodes.OK);
};

const deleteProfile = async (req, res) => {
  const { username } = req.body;
  const requiredParams = ["username"];
  await checkRequiredParams({ username }, requiredParams);
  await User.findOneAndDelete({ username });
  await res.clearCookie("token");
  res
    .json({ success: true, data: "User Account Successfully deleted" })
    .status(StatusCodes.OK);
};
export { profile, updateProfile, deleteProfile };
