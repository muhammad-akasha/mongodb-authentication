import express from "express";
import {
  addBlog,
  allBlogs,
  deleteBlog,
  singleBlog,
  updateBlog,
} from "../controllers/blogs.controller.js";
import { upload } from "../middleware/multer.middleware.js";
// import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();
router.get("/allblogs", allBlogs);
router.get("/singleblog/:id", singleBlog);
router.post("/addblog", upload.single("blogImage"), addBlog);
router.delete("/deleteblog/:id", deleteBlog);
router.put("/updateblog/:id", updateBlog);

export default router;
