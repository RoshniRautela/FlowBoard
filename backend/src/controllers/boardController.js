import mongoose from "mongoose";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import User from "../models/User.js";

// Finds the board and checks the user may access it.
// Returns null (after sending the error response) if they may not.

const loadBoard = async (req, res, { ownerOnly = false } = {}) => {
  
  const board = await Board.findById(req.params.id);
  if (!mongoose.isValidObjectId(req.params.id) || !board) {
    res.status(404).json({ message: "Board not found" });
    return null;
  }
 
  const isMember = board.members.some((m) => m.equals(req.user._id));
  const isOwner = board.owner.equals(req.user._id);
  if (!isMember || (ownerOnly && !isOwner)) {
    res.status(403).json({ message: "You don't have access to this board" });
    return null;
  }
  return board;
};

export const createBoard = async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  const board = await Board.create({
    title,
    description,
    owner: req.user._id,
    members: [req.user._id],
  });
  res.status(201).json(board);
};

export const getMyBoards = async (req, res) => {
  const boards = await Board.find({ members: req.user._id }).sort({ updatedAt: -1 });
  res.json(boards);
};

export const getBoard = async (req, res) => {
  const board = await loadBoard(req, res);
  if (!board) return;

  await board.populate("members", "name email");
  const [lists, cards] = await Promise.all([
    List.find({ board: board._id }).sort({ position: 1 }),
    Card.find({ board: board._id }).sort({ position: 1 }),
  ]);
  res.json({ board, lists, cards });
};

export const updateBoard = async (req, res) => {
  const board = await loadBoard(req, res, { ownerOnly: true });
  if (!board) return;

  const { title, description } = req.body;
  if (title !== undefined) board.title = title;
  if (description !== undefined) board.description = description;
  await board.save();
  res.json(board);
};

export const deleteBoard = async (req, res) => {
  const board = await loadBoard(req, res, { ownerOnly: true });
  if (!board) return;

  await Card.deleteMany({ board: board._id });
  await List.deleteMany({ board: board._id });
  await board.deleteOne();
  res.json({ message: "Board deleted" });
};

export const addMember = async (req, res) => {
  const board = await loadBoard(req, res, { ownerOnly: true });
  if (!board) return;

  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase().trim() });
  if (!user) return res.status(404).json({ message: "No user with that email" });
  if (board.members.some((m) => m.equals(user._id)))
    return res.status(409).json({ message: "Already a member" });

  board.members.push(user._id);
  await board.save();
  await board.populate("members", "name email");
  res.json(board);
};