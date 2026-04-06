import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lobbiesApi } from "@/api/lobbies-api";
import { Button } from "@/components/ui/button";

export default function LobbyJoin() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    lobbiesApi.joinByCode(code)
      .then((res) => navigate(`/lobbies/${res.data.id}`))
      .catch(() => { setLoading(false); });
  }, [code, navigate]);

  if (loading) return <div className="text-center py-20 text-surface-500">Joining lobby...</div>;

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="card text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-400">Lobby Not Found</h2>
        <p className="text-surface-400">Could not find a lobby with code "{code}".</p>
        <Button onClick={() => navigate("/lobbies")}>Browse Lobbies</Button>
      </div>
    </div>
  );
}
