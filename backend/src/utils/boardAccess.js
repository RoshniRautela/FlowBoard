import mongoose from "mongoose";
import Board from "../models/Board.js";

// Returns the board if it exists and the user is a member, otherwise null.
export const findBoardForMember = async (boardId, userId) => {
  if (!mongoose.isValidObjectId(boardId)) return null;
  const board = await Board.findById(boardId);
  if (!board || !board.members.some((m) => m.equals(userId))) return null;
  return board;
};