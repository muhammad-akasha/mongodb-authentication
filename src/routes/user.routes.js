import express from "express";
import {
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  uploadImage,
} from "../controllers/users.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refreshtoken", refreshToken);
router.post("/uploadimage", upload.single("image"), uploadImage);

export default router;
