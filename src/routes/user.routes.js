import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

// Define the POST route correctly
router.post("/register", registerUser);

export default router;
