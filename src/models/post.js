import { Types, Schema, model } from "mongoose";

const PostSchema = new Schema(
  {
    title: {
      type: String,
      minLength: [5, "Enter atleast 5 characters"],
      maxLength: 50,
    },
    message: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },
    author: {
      type: Types.ObjectId,
      ref: "user",
      required: [true, "Please provide user"],
    },
  },
  { timestamps: true }
);

const PostModel = model("post", PostSchema);

export default PostModel;
