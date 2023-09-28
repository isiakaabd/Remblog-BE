import { StatusCodes } from "http-status-codes";
import Post from "../models/post.js";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { checkRequiredParams } from "../utils/index.js";
import { UnauthenticatedError } from "../error/unauthenticated.js";
import { NotFoundError } from "../error/notFound.js";
import { redis } from "../../index.js";
// import { createClient } from "redis/dist/index.js";

// const client = await createClient({ url: process.env.REDIS_URL })
//   .on("error", (err) => console.log("Redis Client Error", err))
//   .connect();
//  if (client.conn) {
// //   console.log(123);
// //   // Perform Redis operations here
// /}
//else {

//   // Handle the case when the client is not connected
// }
// client.on("error", (err) => {
//   console.error("Redis Error:", err);
// });

const getPosts = (req, res) => {
  const { page, limit, author } = req.query;

  const queryObject = {
    ...(author && { author }),
  };

  const { user } = req;

  if (user?.id && author && user?.username !== author) {
    queryObject.author = user.id;
  }

  // Generate a unique key for this query based on its parameters
  const cacheKey = `posts:${JSON.stringify(queryObject)}:${page}:${limit}`;

  redis.get(cacheKey, async (err, cachedData) => {
    if (err) {
      console.log(err, "err");
    }
    if (cachedData !== null) {
      // If cached data exists, return it
      const parsedData = JSON.parse(cachedData);
      res.status(StatusCodes.OK).json(parsedData);
    } else {
      // If no cached data exists, fetch data from the database
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

      // Store fetched data in the cache with an expiration time (e.g., 1 hour)
      redis.setex(
        cacheKey,
        3600,
        JSON.stringify({
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
      );

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
    }
  });
};

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

  // Generate a unique cache key based on the request parameters
  const cacheKey = `posts:${JSON.stringify(params)}`;

  // Check if the data for the cache key exists in Redis
  redis.get(cacheKey, async (err, cachedData) => {
    if (err) {
      console.error(err);
    }

    if (cachedData !== null) {
      // If cached data exists, return it
      const parsedData = JSON.parse(cachedData);
      res.json(parsedData).status(StatusCodes.OK);
    } else {
      // If no cached data exists, create the post in the database
      const data = await Post.create({ ...params });

      // Store the created post data in the cache with an expiration time (e.g., 1 hour)
      redis.setex(
        cacheKey,
        3600,
        JSON.stringify({
          post: data,
          message: "Post Created",
        })
      );

      res
        .json({ post: data, message: "Post Created" })
        .status(StatusCodes.CREATED);
    }
  });
};
const deletePost = async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  // Check if the user is authenticated
  if (!user) {
    throw new UnauthenticatedError("Unauthorized Request");
  }

  // Find the post by ID
  const post = await Post.findById(id);
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  // Check if the user is the author of the post
  if (req.user.id !== post.author._id.toString()) {
    throw new UnauthenticatedError("Unauthorized Request");
  }

  // Delete the post from the database
  const deletedPost = await Post.findOneAndDelete({ _id: id });

  // Check if the post was found and deleted
  if (!deletedPost) {
    throw new NotFoundError("Post not found");
  }

  // Generate a cache key for the getPosts function based on query parameters
  const cacheKey = `posts:${JSON.stringify(req.query)}`;

  // Remove the cached data for the getPosts function
  redis.del(cacheKey, (err) => {
    if (err) {
      console.error("Error deleting cache:", err);
    }
  });

  res
    .json({ success: true, data: "Post deleted successfully" })
    .status(StatusCodes.OK);
};

const updatePost = async (req, res) => {
  const { id } = req.params;
  const { user } = req;
  const { title, message, category } = req.body;

  // Check if the user is authenticated
  if (!user) {
    throw new UnauthenticatedError("Unauthorized Request");
  }

  // Create an object with the updated post data
  const updatedPostData = {
    title,
    message,
    category,
  };

  // Validate required parameters (title, message)
  const requiredParams = ["title", "message"];
  await checkRequiredParams(updatedPostData, requiredParams);

  // Generate a unique cache key for the post
  const cacheKey = `post:${id}`;

  // Attempt to update the post in the database and populate the author details
  const updatedPost = await Post.findByIdAndUpdate(id, updatedPostData, {
    new: true,
  }).populate("author", ["username"]);

  if (!updatedPost) {
    throw new NotFoundError("Post not found");
  }

  // Update the cache with the modified post data
  redis.setex(cacheKey, 3600, JSON.stringify(updatedPost));

  res
    .json({
      success: true,
      data: {
        _id: updatedPost._id, // Include the post ID
        title: updatedPost.title,
        message: updatedPost.message,
        category: updatedPost.category,
        author: {
          _id: updatedPost.author._id, // Include the author's ID
          username: updatedPost.author.username,
        },
      },
      message: "Post Updated!",
    })
    .status(StatusCodes.OK);
};

const getPost = async (req, res) => {
  const postId = req.params.id;
  let userId = null;

  // Check if the user has a valid token
  if (req.cookies.token) {
    const { id } = jwt.verify(req.cookies.token, process.env.JSON_TOKEN);
    userId = id;
  }

  // Generate a cache key for this specific post
  const cacheKey = `post:${postId}`;

  // Try to get the post data from the cache
  redis.get(cacheKey, async (err, cachedData) => {
    if (err) {
      console.error("Error fetching from cache:", err);
    }

    if (cachedData !== null) {
      // If cached data exists, return it
      const parsedData = JSON.parse(cachedData);
      // 6515d1f40ef331a73434efd4
      // Modify the cached data to include canModify property
      parsedData.canModify = parsedData.author._id.toString() === userId;

      res.status(StatusCodes.OK).json(parsedData);
    } else {
      // If no cached data exists, fetch data from the database
      const data = await Post.findOne({ _id: postId })
        .populate("author", ["username"])
        .populate("likes", ["username"]);

      if (!data) {
        throw new NotFoundError("Post not found");
      }

      // Modify the data to include canModify property
      const newData = {
        ...data._doc,
        canModify: !userId ? false : data._doc.author._id.toString() === userId,
      };

      // Store fetched data in the cache with an expiration time (e.g., 1 hour)
      redis.setex(
        cacheKey,
        3600,
        JSON.stringify({
          success: true,
          post: newData,
        })
      );

      res.status(StatusCodes.OK).json({
        success: true,
        post: newData,
      });
    }
  });
};

const likeAndUnLikePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user?.id;

  // Generate a unique cache key for the post
  const cacheKey = `post:${postId}`;

  // Attempt to retrieve the post from the cache
  redis.get(cacheKey, async (err, cachedData) => {
    if (err) {
      console.error(err);
      throw new Error("Error while retrieving cached data.");
    }

    if (cachedData !== null) {
      // If cached data exists, update likes and return the updated data
      const parsedData = JSON.parse(cachedData);
      const post = { ...parsedData };

      const likedIndex = post.likes.findIndex(
        (like) => like.toString() === userId
      );

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

      // Update the cache with the modified post data
      redis.setex(cacheKey, 3600, JSON.stringify(post));

      res.status(StatusCodes.OK).json({
        success: status === 1 ? "Post liked" : "Post disliked",
        likes: post.likes.length,
        status: status,
      });
    } else {
      // If no cached data exists, fetch the post from the database
      const post = await Post.findById(postId);

      if (!post) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Post not found",
        });
        return;
      }

      const likedIndex = post.likes.findIndex(
        (like) => like.toString() === userId
      );

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

      // Save the modified post data to the database
      await post.save();

      // Update the cache with the modified post data
      redis.setex(cacheKey, 3600, JSON.stringify(post));

      res.status(StatusCodes.OK).json({
        success: status === 1 ? "Post liked" : "Post disliked",
        likes: post.likes.length,
        status: status,
      });
    }
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
