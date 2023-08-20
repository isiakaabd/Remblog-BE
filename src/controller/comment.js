import { StatusCodes } from "http-status-codes";
import Comment from "../models/comment.js";
import { checkRequiredParams } from "../utils/index.js";
import jwt from "jsonwebtoken";
import { UnauthenticatedError, NotFoundError } from "../error/index.js";
const createComment = async (req, res) => {
  const { postId, message, parentId } = req.body;
  const { id } = req.user;
  //   if (!req.user) new UnauthenticatedError("Unauthorized request");
  const params = {
    postId,
    message,
    sender: id,
    ...(parentId && { parentId }),
  };
  const requiredParams = ["message", "postId", "sender"];
  await checkRequiredParams(params, requiredParams);
  const data = await Comment.create({ ...params });

  res
    .json({ comment: data, message: "Post Created" })
    .status(StatusCodes.CREATED);
};
const getComments = async (req, res) => {
  const { page, limit } = req.query;

  const queryObject = { postId: req.params.id };
  const countQuery = Comment.find(queryObject);

  const totalDocuments = await countQuery.countDocuments();

  const pageN = Number(page) || 1;
  const limitN = Number(limit) || 10;
  const skip = (pageN - 1) * limitN;

  let dataQuery = Comment.find(queryObject);

  dataQuery = dataQuery
    .populate("sender", ["username"])
    .populate({
      path: "responses",
      populate: { path: "sender", select: "username" },
    })
    .skip(skip)
    .limit(limitN)
    .sort({ createdAt: -1 });

  const data = await dataQuery;

  const totalPages = Math.ceil(totalDocuments / limitN);
  const hasNextPage = pageN < totalPages;
  const hasPreviousPage = pageN > 1;

  res.status(StatusCodes.OK).json({
    success: true,
    comments: data,
    limit: limitN,
    page: pageN,
    total_page: totalPages,
    hasNextPage,
    hasPreviousPage,
  });
};

const deleteComment = async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) throw new NotFoundError("Comment not found");
  if (req.user.id !== comment.sender.toString()) {
    throw new UnauthenticatedError("Unauthorized Request");
  }
  await Comment.findOneAndDelete({ _id: id }, { new: true });

  res
    .json({ success: true, message: "Comment deleted successfully" })
    .status(StatusCodes.OK);
};
const updateComment = async (req, res) => {
  const { id } = req.params;
  const { message, postId, parentId } = req.body;
  const params = {
    message,
    postId,
    ...(parentId && { parentId }),
    sender: req.user.id,
  };
  const requiredParams = ["postId", "sender", "message"];
  await checkRequiredParams(params, requiredParams);
  const post = await Comment.findById(id);

  if (req.user.id !== post.sender._id.toString()) {
    throw new UnauthenticatedError("Unauthorized Request");
  }
  const data = await Comment.findOneAndUpdate({ _id: id }, params, {
    new: true,
  });

  if (!data) throw new NotFoundError("Comment not found");
  else {
    res
      .json({ success: true, data, message: "Comment Updated!" })
      .status(StatusCodes.OK);
  }
};

const getComment = async (req, res) => {
  const params = req.params.commentId;

  let userId = null;
  if (req.cookies.token) {
    const { id } = jwt.verify(req.cookies.token, process.env.JSON_TOKEN);
    userId = id;
  }
  const data = await Comment.findOne({ _id: params }).populate("sender", [
    "username",
  ]);

  const newData = {
    ...data._doc, // Include existing item properties
    canModify: !userId ? false : data._doc.sender._id.toString() === userId,
  };

  res
    .json({
      success: true,
      comment: newData,
    })
    .status(StatusCodes.OK);
};

// const likeAndUnLikePost = async (req, res) => {
//   const postId = req.params.id;
//   const userId = req.user.id; // Assuming req.user has the user's id

//   if (!userId) return new UnauthenticatedError("unauthorized");
//   const post = await Post.findById(postId);
//   if (!post) {
//     return res.status(StatusCodes.NOT_FOUND).json({
//       success: false,
//       message: "Post not found",
//     });
//   }

//   const likedIndex = post.likes.findIndex((like) => like.toString() === userId);
//   post.liked = false;
//   let status = 0; // Default status: Not liked

//   if (likedIndex !== -1) {
//     // Already liked, remove like
//     post.likes.splice(likedIndex, 1);
//   } else {
//     status = 1; // Liked status
//     // Not liked, add like
//     post.liked = true;
//     post.likes.push(new Types.ObjectId(userId));
//   }

//   const updatedPost = await post.save();

//   return res.status(StatusCodes.OK).json({
//     success: status === 1 ? "Post liked" : "Post disliked",
//     likes: updatedPost.likes.length,
//     status: status,
//   });
// };

export { createComment, updateComment, getComments, getComment, deleteComment };
