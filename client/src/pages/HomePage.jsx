import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const gameCards = [
  { title: "Free Fire", description: "4v4 Clash Squad and Battle Royale rooms." },
  { title: "BGMI", description: "Classic TPP/FPP custom rooms with prize pool." },
];

const gameTabs = [
  { id: "bgmi", label: "BGMI", image: "/bgmi.jpg" },
  { id: "freefire", label: "Free Fire", image: "/freefire.jpg" },
];

const HomePage = () => {
  const [selectedGame, setSelectedGame] = useState("bgmi");

  const bgImage = useMemo(
    () => (selectedGame === "bgmi" ? "/bgmi.jpg" : "/freefire.jpg"),
    [selectedGame]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedGame((prev) => (prev === "bgmi" ? "freefire" : "bgmi"));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="page">
      <section className="hero-panel dynamic-hero">
        <div
          key={bgImage}
          className="hero-bg-layer"
          style={{
            background: `
              linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.4)),
              url(${bgImage}) center/cover no-repeat
            `,
          }}
        />
        <div className="hero-content">
          <div className="game-switcher" role="tablist" aria-label="Select game">
            {gameTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selectedGame === tab.id}
                className={`game-tab ${selectedGame === tab.id ? "active" : ""}`}
                onClick={() => setSelectedGame(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <h1>Join AB Tournament</h1>
          <p>Compete daily in Free Fire and BGMI tournaments. Win cash and climb leaderboard.</p>
          <Link className="btn btn-primary" to="/tournaments">
            Explore Matches
          </Link>
        </div>
      </section>

      <section className="grid two-col">
        {gameCards.map((game) => (
          <article key={game.title} className="card">
            <h3>{game.title}</h3>
            <p>{game.description}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2>Upcoming Matches</h2>
        <p>Find solo and squad tournaments with instant wallet payout for winners.</p>
        <Link className="btn btn-secondary" to="/tournaments">
          View Schedule
        </Link>
      </section>
    </main>
  );
};

export default HomePage;
