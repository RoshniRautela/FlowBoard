import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { updateCard, deleteCard, moveCard } from "../controllers/cardController.js";

const router = Router();
router.use(protect);

router.put("/:id/move", moveCard);
router.route("/:id").put(updateCard).delete(deleteCard);

export default router;