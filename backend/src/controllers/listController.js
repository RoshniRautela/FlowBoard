import mongoose from "mongoose";
import List from "../models/List.js";
import Card from "../models/Card.js";
import { findBoardForMember } from "../utils/boardAccess.js";
import { emitToBoard } from "../socket.js";

const GAP = 1000;

// Finds a list and confirms the user belongs to its board.
const loadList = async (req, res, id = req.params.id) => {
  const notFound = () => {
    res.status(404).json({ message: "List not found" });
    return null;
  };
  if (!mongoose.isValidObjectId(id)) return notFound();
  const list = await List.findById(id);
  if (!list) return notFound();
  const board = await findBoardForMember(list.board, req.user._id);
  if (!board) return notFound();
  return list;
};

export const createList = async (req, res) => {
  const board = await findBoardForMember(req.params.boardId, req.user._id);
  if (!board) return res.status(404).json({ message: "Board not found" });

  const { title } = req.body;
  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  const last = await List.findOne({ board: board._id }).sort({ position: -1 });
  const list = await List.create({
    title,
    board: board._id,
    position: last ? last.position + GAP : GAP,
  });
  emitToBoard(board._id, "list:created", list);
  res.status(201).json(list);
};

export const updateList = async (req, res) => {
  const list = await loadList(req, res);
  if (!list) return;

  const { title, position } = req.body;
  if (title !== undefined) {
    if (!title.trim())
      return res.status(400).json({ message: "Title can't be empty" });
    list.title = title;
  }
  if (position !== undefined) {
    if (!Number.isFinite(position))
      return res.status(400).json({ message: "Position must be a number" });
    list.position = position;
  }
  await list.save();
  emitToBoard(list.board, "list:updated", list);
  res.json(list);
};

export const deleteList = async (req, res) => {
  const list = await loadList(req, res);
  if (!list) return;

  await Card.deleteMany({ list: list._id });
  await list.deleteOne();
  emitToBoard(list.board, "list:deleted", { listId: list._id });
  res.json({ message: "List deleted" });
};

export { loadList };