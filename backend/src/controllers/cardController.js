import mongoose from "mongoose";
import Card from "../models/Card.js";
import List from "../models/List.js";
import { findBoardForMember } from "../utils/boardAccess.js";
import { loadList } from "./listController.js";

const GAP = 1000;

// Finds a card and confirms the user belongs to its board.
const loadCard = async (req, res) => {
  const fail = () => {
    res.status(404).json({ message: "Card not found" });
    return null;
  };
  if (!mongoose.isValidObjectId(req.params.id)) return fail();
  const card = await Card.findById(req.params.id);
  if (!card) return fail();
  const board = await findBoardForMember(card.board, req.user._id);
  if (!board) return fail();
  return { card, board };
};

export const createCard = async (req, res) => {
  const list = await loadList(req, res, req.params.listId);
  if (!list) return;

  const { title, description } = req.body;
  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  const last = await Card.findOne({ list: list._id }).sort({ position: -1 });
  const card = await Card.create({
    title,
    description,
    list: list._id,
    board: list.board,
    position: last ? last.position + GAP : GAP,
  });
  res.status(201).json(card);
};

export const updateCard = async (req, res) => {
  const found = await loadCard(req, res);
  if (!found) return;
  const { card, board } = found;

  const { title, description, assignees } = req.body;
  if (title !== undefined) {
    if (!title.trim())
      return res.status(400).json({ message: "Title can't be empty" });
    card.title = title;
  }
  if (description !== undefined) card.description = description;

  if (assignees !== undefined) {
    const allMembers =
      Array.isArray(assignees) &&
      assignees.every((id) => board.members.some((m) => m.equals(id)));
    if (!allMembers)
      return res
        .status(400)
        .json({ message: "Assignees must be members of the board" });
    card.assignees = assignees;
  }

  await card.save();
  res.json(card);
};

export const deleteCard = async (req, res) => {
  const found = await loadCard(req, res);
  if (!found) return;

  await found.card.deleteOne();
  res.json({ message: "Card deleted" });
};

// Drag and drop: change the list and/or position in one small write.
export const moveCard = async (req, res) => {
  const found = await loadCard(req, res);
  if (!found) return;
  const { card } = found;

  const { listId, position } = req.body;
  if (!Number.isFinite(position))
    return res.status(400).json({ message: "Position must be a number" });

  if (listId && !card.list.equals(listId)) {
    if (!mongoose.isValidObjectId(listId))
      return res.status(400).json({ message: "Invalid list" });
    const target = await List.findById(listId);
    if (!target || !target.board.equals(card.board))
      return res.status(400).json({ message: "Target list is not on this board" });
    card.list = target._id;
  }

  card.position = position;
  await card.save();
  res.json(card);
};