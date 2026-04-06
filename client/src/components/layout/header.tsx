import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-surface-800 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand-400">
          RaiSK <span className="text-surface-400 font-normal">Upgraded</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-surface-300 hover:text-white transition-colors text-sm">
            Home
          </Link>
          <Link to="/lobbies" className="text-surface-300 hover:text-white transition-colors text-sm">
            Lobbies
          </Link>
          <Link to="/tournaments" className="text-surface-300 hover:text-white transition-colors text-sm">
            Tournaments
          </Link>
          <Link to="/leaderboard" className="text-surface-300 hover:text-white transition-colors text-sm">
            Leaderboard
          </Link>

          {user ? (<>
            <Link to="/profile" className="text-surface-300 hover:text-white transition-colors text-sm">
              {user.username}
            </Link>
            {user.role === "admin" &&
              <Link to="/admin" className="text-red-400 hover:text-red-300 transition-colors text-sm">
                Admin
              </Link>
            }
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>) : (<>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/register")}>
              Register
            </Button>
          </>)}
        </div>
      </nav>
    </header>
  );
}
