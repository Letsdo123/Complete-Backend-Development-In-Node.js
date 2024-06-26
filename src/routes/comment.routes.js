import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";



// define the router
const router = Router();

// This is the router that will use for all the routes
// This will verify the user that the user is logged-in or not
// If logged-in then it will inject the user details inside the request
router.use(verifyJWT);

router.route("/:videoId").post(addComment).get(getVideoComments);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
