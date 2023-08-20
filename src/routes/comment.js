import express from "express";
import {
  getComments,
  createComment,
  deleteComment,
  getComment,
  updateComment,
} from "../controller/comment.js";

import { authenticationMiddleware } from "../middleware/auth.js";
const router = express.Router();

router
  .route("/comments/:id")
  .get(getComments)
  .delete(authenticationMiddleware, deleteComment)
  .patch(authenticationMiddleware, updateComment);
router.route("/comment").post(authenticationMiddleware, createComment);
router.route("/comment/:commentId").get(getComment);

export default router;
