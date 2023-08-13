import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const UserSchema = new Schema({
  name: {
    type: String,
    minLength: [5, "Enter atleast 5 characters"],
    maxLength: 50,
  },
  username: {
    type: String,
    unique: true,
    required: [true, "Enter your Username"],
    minLength: [5, "Enter atleast 5 characters"],
    maxLength: 20,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
    unique: false,
    // validate: {
    //   validator: function (value) {
    //     // Custom email validation logic
    //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //     return emailRegex.test(value);
    //   },
    //   message: "Invalid email address",
    // },
  },
  password: {
    type: String,
    required: [true, "Enter your password"],
    minLength: 6,
  },
});
UserSchema.pre("save", async function (next) {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(this.password, salt);

  this.password = hashedPassword;
  next();
});
UserSchema.methods.generateToken = async function () {
  const token = jwt.sign(
    { id: this._id, username: this.username },
    process.env.JSON_TOKEN,
    { expiresIn: process.env.JWT_LIFE }
  );
  return token;
};
UserSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};
const UserModel = model("user", UserSchema);

export default UserModel;
