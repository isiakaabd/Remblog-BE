import express from "express";
import { getComments, createComment } from "../controller/comment.js";

const router = express.Router();

router.route("/comment").post(createComment);
router.route("/comments/:id").get(getComments);
export default router;
