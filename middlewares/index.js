import { expressjwt } from "express-jwt";
import Post from "../models/post";

export const requireSignIn = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

export const canEditDeletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    //console.log("req.params.id: ", req.params.id);
    //console.log("post: ", post);

    if (req.auth._id != post.postedBy) {
      return res.status(400).send("Unauthorized");
    } else {
      next();
    }
  } catch (err) {
    console.log("Can edit delete error ", err);
  }
};
