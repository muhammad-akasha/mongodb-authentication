import mongoose from "mongoose";
import Blogs from "../models/blogs.model.js";
import Users from "../models/usermodel.js";
import { uploadImageToCloudinary } from "./users.controller.js";
import jwt from "jsonwebtoken";

const allBlogs = async (req, res) => {
  const allBlogs = await Blogs.find({});
  if (allBlogs.length === 0) {
    return res.status(404).json({
      message: "NO BLOG FOUND!",
    });
  }

  res.status(200).json({
    allBlogs,
  });
};

const addBlog = async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

  // Extract user ID from the decoded token
  const email = decoded.email;

  const { title, description } = req.body;
  if (!title || !description) {
    res.status(400).json({
      message: "All the fields are required",
    });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Profile Picture is also required" });
  }

  const url = await uploadImageToCloudinary(req.file.path);

  if (!url) {
    return res
      .status(500)
      .json({ message: "error occured while uploading image" });
  }
  const user = await Users.findOne({ email });

  const blog = await Blogs.create({
    title,
    description,
    postedBy: user.userName,
    blogImage: url,
  });

  // Update the user document to include the blog ID
  await Users.findByIdAndUpdate(user._id, {
    $push: { blogIds: blog._id },
  });

  res.status(200).json({
    message: "Blog added successfully",
    blog,
    user,
  });
};

const singleBlog = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      message: "Not a Mongodb Id",
    });
  }

  const singleBlog = await Blogs.findById(id);

  if (!singleBlog) {
    return res.status(400).json({
      message: "NO BLOG FOUND!",
    });
  }
  return res.status(200).json({
    singleBlog,
  });
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      message: "ID is not MongoDB ID",
    });
    return;
  }
  const token = req.cookies.refreshToken || req.body.refreshToken;
  console.log(token);
  const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

  // Extract user ID from the decoded token
  const email = decoded.email;
  const user = await Users.findOne({ email });

  try {
    await Users.findByIdAndUpdate(user._id, {
      $pull: { blogIds: id },
    });
    const blog = await Blogs.findByIdAndDelete(id); // same way to delete with findOneAndDelete({_id : id})
    res.status(200).json({
      message: "blog Deleted Successfully",
      blog,
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: error,
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid MongoDB ID",
      });
    }

    // Validate input fields
    if (!title && !description) {
      return res.status(400).json({
        message: "At least one field (title or description) is required",
      });
    }

    // Update blog
    const blog = await Blogs.findByIdAndUpdate(
      id,
      { title, description },
      { new: true, runValidators: true }
    );

    // Check if the blog exists
    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Send success response
    return res.status(200).json({
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { addBlog, updateBlog, deleteBlog, allBlogs, singleBlog };
