import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600">FlowBoard</Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">{user?.name}</span>
          <button onClick={logout} className="text-slate-600 hover:text-red-600">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}