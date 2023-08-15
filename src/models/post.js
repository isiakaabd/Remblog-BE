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
      type: Types.ObjectId,
      ref: "user",
    },
    liked: {
      type: Boolean,
      default: false,
    },
    likes: [{ type: Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);

const PostModel = model("post", PostSchema);

export default PostModel;
