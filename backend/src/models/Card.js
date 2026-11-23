import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 200 
    },
    description: { 
      type: String, 
      trim: true, 
      default: "" 
    },
    list: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "List", 
      required: true 
    },
    board: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Board", 
      required: true 
    },
    position: { 
      type: Number, 
      required: true 
    },
    assignees: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
  },
  { timestamps: true }
);

cardSchema.index({ list: 1, position: 1 });
cardSchema.index({ board: 1 });

export default mongoose.model("Card", cardSchema);