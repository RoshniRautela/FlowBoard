import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { updateList, deleteList } from "../controllers/listController.js";
import { createCard } from "../controllers/cardController.js";

const router = Router();
router.use(protect);

router.route("/:id").put(updateList).delete(deleteList);
router.post("/:listId/cards", createCard);

export default router;