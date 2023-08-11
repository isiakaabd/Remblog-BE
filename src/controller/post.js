import { StatusCodes } from "http-status-codes";
import Post from "../models/post.js";
import { checkRequiredParams } from "../utils/index.js";
import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../error/unauthenticated.js";
import { NotFoundError } from "../error/notFound.js";
const createPost = async (req, res) => {
  const { title, message } = req.body;
  const { id } = req.user;
  const params = {
    title,
    image: req.file.path,
    message,
    author: id,
  };
  const requiredParams = ["title", "author", "message"];
  await checkRequiredParams(params, requiredParams);

  const data = await Post.create(params);
  res.json({ post: data, message: "Post Created" }).status(StatusCodes.CREATED);
};
const getPosts = async (req, res) => {
  const { page, limit, author } = req.query;
  const queryObject = {
    ...(author && { author }),
  };
  const { token } = req.cookies;
  const { id, username } = jwt.verify(token, process.env.JSON_TOKEN);
  req.user = {
    id,
    username,
  };
  queryObject.author = id;
  // Create a new query object for counting documents
  const countQuery =
    username === author ? Post.find({ ...queryObject }) : Post.find();

  const totalDocuments = await countQuery.countDocuments();

  const pageN = Number(page) || 1;
  const limitN = Number(limit) || 10;
  const skip = (pageN - 1) * limitN;

  // Fetch data for the current page using skip and limit
  const data = await Post.find(queryObject)
    .populate("author", ["username"])
    .skip(skip)
    .limit(limitN)
    .sort({ createdAt: -1 });

  // Calculate the total number of pages
  const totalPages = Math.ceil(totalDocuments / limitN);

  // Determine if there is a next page and a previous page
  const hasNextPage = pageN < totalPages;
  const hasPreviousPage = pageN > 1;

  res
    .json({
      success: true,
      data: {
        posts: data,
        limit: limitN,
        page: pageN,
        total_page: totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    })
    .status(StatusCodes.OK);
};
const deletePost = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  if (!user) throw new UnauthenticatedError("Unauthorized Request");

  const data = await Post.findOneAndDelete({ _id: id }, { new: true });
  if (!data) throw new NotFoundError("Post not found");
  else {
    res
      .json({ success: true, data: "Post deleted successfully" })
      .status(StatusCodes.OK);
  }
};
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const { title, message, author } = req.body;
  if (!user) throw new UnauthenticatedError("Unauthorized Request");
  const params = {
    title,
    image: req.file.path,
    message,
    author,
  };
  const requiredParams = ["title", "author", "message"];
  await checkRequiredParams(params, requiredParams);

  const data = await Post.findOneAndUpdate({ _id: id }, params, { new: true });

  if (!data) throw new NotFoundError("Post not found");
  else {
    res.json({ success: true, data }).status(StatusCodes.OK);
  }
};
const getPost = async (req, res) => {
  const data = await Post.findOne({ _id: req.params.id }).populate("author", [
    "username",
  ]);
  res
    .json({
      success: true,
      post: data,
    })
    .status(StatusCodes.OK);
};
export { createPost, getPosts, deletePost, updatePost, getPost };
