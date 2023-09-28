import { StatusCodes } from "http-status-codes";
import User from "../models/auth.js";
import { checkRequiredParams } from "../utils/index.js";
import { UnauthenticatedError } from "../error/unauthenticated.js";
import { checkUserExists } from "../middleware/checkUser.js";
import { redis } from "../../index.js";

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
// const register = async (req, res) => {
//   const { password, username, email } = req.body;
//   const params = {
//     username,
//     password,
//     email,
//   };
//   const requiredParams = ["username", "password", "email"];
//   await checkRequiredParams(params, requiredParams);

//   const val = await checkUserExists(email, username);

//   if (val) {
//     const data = {
//       recipient: email,
//       username,
//     };
//     // await sendNewEmail(data);
//     await User.create(params);

//     res
//       .status(StatusCodes.CREATED)
//       .json({ success: true, message: "User successfully created" });
//   }
// };

const register = async (req, res) => {
  const { password, username, email } = req.body;
  const params = {
    username,
    password,
    email,
  };
  console.log(req.body);
  const requiredParams = ["username", "password", "email"];
  await checkRequiredParams(params, requiredParams);

  // Check if the username or email exists in Redis (assuming you store them in sets)
  const usernameExistsInRedis = await checkUserExistsInRedis(
    "usernames",
    username
  );
  const emailExistsInRedis = await checkUserExistsInRedis("emails", email);
  console.log(usernameExistsInRedis, emailExistsInRedis);
  if (usernameExistsInRedis || emailExistsInRedis) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, message: "User already exists" });
    return;
  }
  // await checkRequiredParams(params, requiredParams);

  const val = await checkUserExists(email, username);
  // Store the username and email in Redis sets
  await addToRedisSet("usernames", username);
  await addToRedisSet("emails", email);
  if (val) {
    // const data = {
    //   recipient: email,
    //   username,
    // };
    // await sendNewEmail(data);
    await User.create(params);

    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "User successfully created" });
  }
  // Rest of the registration code...
  // For example, create the user in the database and send a confirmation email
  // You can add your existing registration logic here
};

// Function to check if a value exists in a Redis set
const checkUserExistsInRedis = async (setKey, value) => {
  return new Promise((resolve, reject) => {
    redis.sismember(setKey, value, (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(result === 1);
      }
    });
  });
};

// Function to add a value to a Redis set
const addToRedisSet = async (setKey, value) => {
  return new Promise((resolve, reject) => {
    redis.sadd(setKey, value, (err, result) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

//This code uses Redis to check if a username or email already exists before registration and stores registered usernames and emails in Redis sets to prevent duplicates. It integrates with your existing login and registration logic. Make sure to customize the registration logic as needed for your application.

const logout = async (_, res) => {
  await res
    .clearCookie("token")
    .status(StatusCodes.OK)
    .json({ success: true, message: "User logged out" });
};
export { login, register, logout };
