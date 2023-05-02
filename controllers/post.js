import Post from "../models/post";
import User from "../models/user";
import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export const createPost = async (req, res) => {
  const { content, image } = req.body;
  if (!content.length) {
    return res.json({
      error: "Content is required",
    });
  }
  try {
    const post = new Post({ content, image, postedBy: req.auth._id });
    post.save();
    res.json(post);
  } catch (err) {
    console.log("err post", err);
    res.sendStatus(400);
  }
};

export const uploadImage = async (req, res) => {
  // console.log(req.files);
  try {
    const result = await cloudinary.uploader.upload(req.files.image.path);
    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.log("Failed to upload to cloudinary", err);
  }
};

export const postsByUser = async (req, res) => {
  try {
    //const posts = await Post.find({ postedBy: req.auth._id })
    const posts = await Post.find()
      .populate("postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(posts);
  } catch (err) {
    console.log("Error getting user posts", err);
  }
};

export const userPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("comments.postedBy", "_id name image")
      .populate("postedBy", "_id name image");
    res.json(post);
  } catch (err) {
    console.log("Error getting user post");
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(post);
  } catch (err) {
    console.log("err updating post", err);
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (post.image && post.image.public_id) {
      const image = await cloudinary.uploader.destroy(post.image.public_id);
    }
    res.json({ data: "ok" });
  } catch (err) {
    console.log("Delete post err", err);
  }
};

export const newsFeed = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    let following = user.following;
    following.push(req.auth._id);

    const posts = await Post.find({ postedBy: { $in: following } })
      .populate("postedBy", "_id name image")
      .populate("comments.postedBy", "_id name image")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(posts);
  } catch (err) {
    console.log("Error getting newsfeed", err);
  }
};

export const likepost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $addToSet: { likes: req.auth._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log("Error liking the post");
  }
};

export const unlikepost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      {
        $pull: { likes: req.auth._id },
      },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.log("Error unliking the post");
  }
};

//addComment,removeComment
export const addComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { text: comment, postedBy: req.auth._id } },
      },
      { new: true }
    )
      .populate("postedBy", "_id name image")
      .populate("comments.postedBy", "_id name image");
    res.json(post);
  } catch (er) {
    console.log("Error adding comment", er);
  }
};

export const removeComment = async (req, res) => {
  try {
    const { postId, comment } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: comment._id } },
      },
      { new: true }
    );
    res.json(post);
  } catch (er) {
    console.log("Error removing comment", er);
  }
};

//ryan
export const searchUser = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) return res.status(404).send({ message: "Invalid " });
    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("-password -secret");
    res.json(user);
  } catch (er) {
    console.log("Error getting users");
  }
};
