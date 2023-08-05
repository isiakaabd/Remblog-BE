import express from "express";
import {
  deleteProfile,
  profile,
  updateProfile,
} from "../controller/profile.js";

const router = express.Router();

router
  .route("/profile")
  .get(profile)
  .patch(updateProfile)
  .delete(deleteProfile);

export default router;
