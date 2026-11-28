import { useState } from "react";

export default function CardItem({ card, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onUpdate(card._id, title);
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={save} className="bg-white rounded-lg shadow-sm p-2 space-y-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <div className="flex gap-2 text-xs">
          <button className="text-indigo-600 font-medium">Save</button>
          <button
            type="button"
            onClick={() => { setTitle(card.title); setEditing(false); }}
            className="text-slate-500"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group bg-white rounded-lg shadow-sm p-3 text-sm flex justify-between gap-2">
      <span className="break-words min-w-0">{card.title}</span>
      <span className="hidden group-hover:flex gap-2 text-xs shrink-0">
        <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-indigo-600">Edit</button>
        <button onClick={() => onDelete(card._id)} className="text-slate-500 hover:text-red-600">Delete</button>
      </span>
    </div>
  );
}