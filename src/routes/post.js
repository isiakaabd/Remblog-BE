import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  deletePost,
  updatePost,
} from "../controller/post.js";
import multer from "multer";
import { authenticationMiddleware } from "../middleware/auth.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the directory where files should be saved
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use a unique filename for each uploaded file
  },
});
const upload = multer({ storage: storage });
// const upload = multer({ dest: "uploads/" });

router.route("/posts").get(getPosts);
router
  .route("/post")
  .post(authenticationMiddleware, upload.single("image"), createPost);

router
  .route("/post/:id")
  .get(getPost)
  .delete(authenticationMiddleware, deletePost)
  .patch(authenticationMiddleware, upload.single("image"), updatePost);
export default router;
