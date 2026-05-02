import { useEffect, useState } from "react";
import PositionCard from "./Components/PositionCard.jsx";
import Dropdown from "../SubmissionsPage/Components/Dropdown";
import API from "../../services/api.js";

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [duration, setDuration] = useState("all");

  useEffect(() => {
    const getLeaderboard = async () => {
      try {
        const res = await API.get("/leaderboard");
        const mapped = Array.isArray(res.data)
          ? res.data.map((user, i) => ({
            position: i + 1,
            username: user.username,
            userpfp: user.avatar_url || "/pfp1.png",
            trophies: user.reputation_score ?? 0,
            analyses: 0,
            reviews: 0,
            avgScore: 0,
          }))
          : [];
        setLeaderboardData(mapped);
      } catch (err) {
        console.error("Could not receive leaderboard data: ", err);
      }
    };

    const getMyPosition = async () => {
      try {
        const res = await API.get("/leaderboard/me");
        const user = res.data;
        console.log("UserData: ", user);
        setCurrentUser({
          position: user.position,
          username: user.username,
          userpfp: user.avatar_url || "/pfp1.png",
          trophies: user.reputation_score ?? 0,
          analyses: 0,
          reviews: 0,
          avgScore: 0,
        });
      } catch (err) {
        console.error("Could not retrieve current user position: ", err);
      }
    };

    getLeaderboard();
    getMyPosition();
  }, []);

  return (
    <div className="min-h-screen bg-abyss text-slate-100 px-6 py-12 md:px-12 lg:px-20">
      <div className="flex flex-row justify-between items-center mb-10 pb-6 border-b border-phantom">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-toxic shadow-[0_0_8px_#22C55E]"></div>
          <h3 className="text-3xl font-black text-slate-100 tracking-tighter uppercase">
            Leaderboard
          </h3>
        </div>
        <div className="ml-6" style={{ minWidth: "140px" }}>
          <Dropdown
            name="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            options={[
              { value: "all", label: "All Time" },
              { value: "month", label: "Monthly" },
              { value: "week", label: "Weekly" },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {leaderboardData.length > 0 ? (
          leaderboardData.map((user) => (
            <PositionCard key={user.position} {...user} />
          ))
        ) : (
          <p className="text-slate-500 font-mono text-sm uppercase text-center py-20">
            Loading leaderboard...
          </p>
        )}
      </div>

      {currentUser && (
        <div className="sticky bottom-0 mt-6 pt-4 bg-abyss">
          <div className="border-t border-phantom/40 pt-4">
            <PositionCard {...currentUser} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
