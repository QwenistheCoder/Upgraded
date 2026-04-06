import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "@/routes/root-layout";
import Home from "@/routes/home";
import Login from "@/routes/auth/login";
import Register from "@/routes/auth/register";
import GameView from "@/routes/game/game-view";
import GameReplay from "@/routes/game/game-replay";
import LobbyList from "@/routes/lobbies/lobby-list";
import LobbyCreate from "@/routes/lobbies/lobby-create";
import LobbyRoom from "@/routes/lobbies/lobby-room";
import LobbyJoin from "@/routes/lobbies/lobby-join";
import TournamentList from "@/routes/tournaments/tournament-list";
import TournamentView from "@/routes/tournaments/tournament-view";
import Leaderboard from "@/routes/leaderboard";
import PlayerStats from "@/routes/player-stats";
import Profile from "@/routes/profile";
import About from "@/routes/info/about";
import Guide from "@/routes/info/guide";
import Changelog from "@/routes/info/changelog";
import Privacy from "@/routes/info/privacy";
import Terms from "@/routes/info/terms";
import AdminDashboard from "@/routes/admin/admin-dashboard";
import AdminUsers from "@/routes/admin/admin-users";
import AdminGames from "@/routes/admin/admin-games";
import VerifyEmail, { ForgotPassword, ResetPassword } from "@/routes/auth/helpers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="profile" element={<Profile />} />
          <Route path="games/:gameId" element={<GameView />} />
          <Route path="games/:gameId/replay" element={<GameReplay />} />
          <Route path="lobbies" element={<LobbyList />} />
          <Route path="lobbies/create" element={<LobbyCreate />} />
          <Route path="lobbies/join/:code" element={<LobbyJoin />} />
          <Route path="lobbies/:lobbyId" element={<LobbyRoom />} />
          <Route path="tournaments" element={<TournamentList />} />
          <Route path="tournaments/:tournamentId" element={<TournamentView />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="players/:entityKey" element={<PlayerStats />} />
          <Route path="about" element={<About />} />
          <Route path="guide" element={<Guide />} />
          <Route path="changelog" element={<Changelog />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/games" element={<AdminGames />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
