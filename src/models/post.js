import { Types, Schema, model } from "mongoose";

const PostSchema = new Schema(
  {
    title: {
      type: String,
      minLength: [5, "Enter atleast 5 characters"],
      maxLength: 100,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "sport",
        "news",
        "entertainment",
        "service",
        "love",
        "romantic",
        "tech",
      ],
      required: true,
      default: "news",
    },

    image: {
      type: String,
    },
    author: {
      _id: {
        type: Types.ObjectId,
        ref: "User",
      },
      username: {
        type: String,
      },
    },
    liked: {
      type: Boolean,
      default: false,
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const PostModel = model("post", PostSchema);

export default PostModel;
