import { StatusCodes } from "http-status-codes";
import Post from "../models/post.js";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { checkRequiredParams } from "../utils/index.js";
import { UnauthenticatedError } from "../error/unauthenticated.js";
import { NotFoundError } from "../error/notFound.js";
const createPost = async (req, res) => {
  const { title, message, category } = req.body;
  const { id } = req.user;
  const params = {
    title,
    image: req.file.path,
    message,
    author: id,
    category,
  };
  const requiredParams = ["title", "author", "category", "message"];
  await checkRequiredParams(params, requiredParams);
  const data = await Post.create({ ...params });

  res.json({ post: data, message: "Post Created" }).status(StatusCodes.CREATED);
};
const getPosts = async (req, res) => {
  const { page, limit, author } = req.query;

  const queryObject = {
    ...(author && { author }),
  };

  const { user } = req;

  if (user?.id && author && user?.username !== author) {
    queryObject.author = user.id;
  }

  const countQuery = Post.find(queryObject);

  const totalDocuments = await countQuery.countDocuments();

  const pageN = Number(page) || 1;
  const limitN = Number(limit) || 10;
  const skip = (pageN - 1) * limitN;

  let dataQuery = Post.find(queryObject);

  if (user?.username !== author) {
    dataQuery = dataQuery
      .populate("author", ["username"])
      .skip(skip)
      .limit(limitN)
      .sort({ createdAt: -1 });
  }

  const data = await dataQuery;

  const totalPages = Math.ceil(totalDocuments / limitN);
  const hasNextPage = pageN < totalPages;
  const hasPreviousPage = pageN > 1;

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      posts: data,
      limit: limitN,
      page: pageN,
      total_page: totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  });
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  if (!user) throw new UnauthenticatedError("Unauthorized Request");
  const post = await Post.findById(id);
  if (req.user.id !== post.author._id) {
    throw new UnauthenticatedError("Unauthorized Request");
  }
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
  const { title, message, category } = req.body;
  if (!user) throw new UnauthenticatedError("Unauthorized Request");
  const params = {
    title,
    image: req.file.path,
    message,
    author: req.user.id,
    category,
  };
  const requiredParams = ["title", "author", "message"];
  await checkRequiredParams(params, requiredParams);
  const post = await Post.findById(id);
  if (req.user.id !== post.author._id.toString()) {
    throw new UnauthenticatedError("Unauthorized Request");
  }
  const data = await Post.findOneAndUpdate({ _id: id }, params, { new: true });

  if (!data) throw new NotFoundError("Post not found");
  else {
    res
      .json({ success: true, data, message: "Post Updated!" })
      .status(StatusCodes.OK);
  }
};

const getPost = async (req, res) => {
  const params = req.params.id;
  let userId = null;
  if (req.cookies.token) {
    const { id } = jwt.verify(req.cookies.token, process.env.JSON_TOKEN);
    userId = id;
  }
  const data = await Post.findOne({ _id: params })
    .populate("author", ["username"])
    .populate("likes", ["username"]);

  const newData = {
    ...data._doc, // Include existing item properties
    canModify: !userId ? false : data._doc.author._id.toString() === userId,
  };
  // let text = "Hello";
  // let metaTags = `
  //     <title>${data.title}</title>
  //     <meta name="description" content="${text}" />
  //     <meta property="og:type" content="website" />
  //     <meta property="og:url" content="${req.url}" />
  //     <meta property="og:title" content="${data.title}" />
  //     <meta property="og:description" content="${text}" />
  //     <meta property="og:image" content="${process.env.PORT + data.image}" />
  //     <meta name="twitter:creator" content=${data.author?.username}" />
  //     <meta name="twitter:card" content="website" />
  //     <meta name="twitter:title" content="${data.title}" />
  //     <meta name="twitter:description" content="${text}" />
  //     <meta name="twitter:image" content="${process.env.PORT + data.image}" />\
  //     <link rel="icon" href="${process.env.PORT + data.image}" />
  //     <link
  //       rel="icon"
  //       type="image/png"
  //       sizes="32x32"
  //       href="${process.env.PORT + data.image}"
  //     /></head>`;
  // // splitted[1] = metaTags;
  // // let responseHtml = splitted.join("");
  // res.setHeader(metaTags);
  res
    .json({
      success: true,
      post: newData,
    })
    .status(StatusCodes.OK);
};

const likeAndUnLikePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id; // Assuming req.user has the user's id

  if (!userId) return new UnauthenticatedError("unauthorized");
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Post not found",
    });
  }

  const likedIndex = post.likes.findIndex((like) => like.toString() === userId);
  post.liked = false;
  let status = 0; // Default status: Not liked

  if (likedIndex !== -1) {
    // Already liked, remove like
    post.likes.splice(likedIndex, 1);
  } else {
    status = 1; // Liked status
    // Not liked, add like
    post.liked = true;
    post.likes.push(new Types.ObjectId(userId));
  }

  const updatedPost = await post.save();

  return res.status(StatusCodes.OK).json({
    success: status === 1 ? "Post liked" : "Post disliked",
    likes: updatedPost.likes.length,
    status: status,
  });
};

export {
  createPost,
  getPosts,
  deletePost,
  updatePost,
  getPost,
  likeAndUnLikePost,
};
