import express from "express";
import formidable from "express-formidable";

const router = express.Router();

//controller
import {
  createPost,
  uploadImage,
  postsByUser,
  userPost,
  updatePost,
  deletePost,
  newsFeed,
  likepost,
  unlikepost,
  addComment,
  removeComment,
  searchUser,
} from "../controllers/post";

//middleware
import { requireSignIn, canEditDeletePost } from "../middlewares";

router.post("/create-post", requireSignIn, createPost);
router.post(
  "/upload-image",
  requireSignIn,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);
//posts
router.get("/user-posts", requireSignIn, postsByUser);
router.get("/user-post/:id", requireSignIn, userPost);
router.put("/update-post/:id", requireSignIn, canEditDeletePost, updatePost);
router.delete("/delete-post/:id", requireSignIn, canEditDeletePost, deletePost);
router.get("/news-feed", requireSignIn, newsFeed);
router.put("/like-post", requireSignIn, likepost);
router.put("/unlike-post", requireSignIn, unlikepost);
router.put("/add-comment", requireSignIn, addComment);
router.put("/remove-comment", requireSignIn, removeComment);
router.get("/search-user/:query", searchUser);

module.exports = router;
