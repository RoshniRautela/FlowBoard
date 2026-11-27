import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  createBoard,
  getMyBoards,
  getBoard,
  updateBoard,
  deleteBoard,
  addMember,
} from "../controllers/boardController.js";

import { createList } from "../controllers/listController.js";

const router = Router();
router.use(protect); // every board route requires login

router.route("/").post(createBoard).get(getMyBoards);
router.route("/:id").get(getBoard).put(updateBoard).delete(deleteBoard);
router.post("/:id/members", addMember);
router.post("/:boardId/lists", createList);

export default router;