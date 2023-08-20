import { Types, Schema, model } from "mongoose";
import UserModel from "./auth.js";
import PostModel from "./post.js";

const CommentSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    parentId: {
      type: Types.ObjectId,
      ref: "Comment",
      validate: {
        validator: async function (value) {
          if (value) {
            const parentComment = await CommentModel.findById(value);
            return parentComment !== null;
          }
          return true;
        },
        message: "Invalid parentId",
      },
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        validate: {
          validator: async function (value) {
            const user = await UserModel.findById(value);
            return user !== null;
          },
          message: "Invalid sender",
        },
      },
    },
    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
      validate: {
        validator: async function (value) {
          const post = await PostModel.findById(value);
          return post !== null;
        },
        message: `No Post with this id`,
      },
    },
  },
  { timestamps: true }
);

const CommentModel = model("comment", CommentSchema);

export default CommentModel;
