import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const gameCards = [
  {
    title: "Free Fire",
    description: "Join high-energy Battle Royale and clash squad rooms designed for adrenaline and prize pools.",
    icon: Flame,
    tag: "Royal Arena",
  },
  {
    title: "BGMI",
    description: "Compete in tactical TPP/FPP tournaments with premium rewards and leaderboard boosts.",
    icon: ShieldCheck,
    tag: "Elite League",
  },
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
              linear-gradient(180deg, rgba(5, 8, 22, 0.85), rgba(5, 8, 22, 0.22)),
              linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(108, 99, 255, 0.1)),
              url(${bgImage}) center/cover no-repeat`
          }}
        />

        <div className="hero-ambient">
          <span className="glow orb orb-1" />
          <span className="glow orb orb-2" />
          <span className="glow orb orb-3" />
        </div>

        <div className="hero-particles">
          {[...Array(8)].map((_, index) => (
            <span key={index} className={`particle particle-${index + 1}`} />
          ))}
        </div>

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <div className="hero-top">
            <div className="hero-label">Premium Esports Arena</div>
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
          </div>

          <h1>Battle for cash rewards in elite BGMI and Free Fire tournaments.</h1>
          <p>
            Step into a futuristic arena with curated match rooms, glowing leaderboards, and premium
            esports energy.
          </p>

          <div className="hero-cta-group">
            <Link className="btn btn-primary btn-hero" to="/tournaments">
              Explore Matches
              <ArrowRight />
            </Link>
            <Link className="btn btn-secondary btn-ghost" to="/auth">
              Join Now
            </Link>
          </div>

          <div className="hero-badges">
            <span className="hero-badge badge-bgmi">
              <Sparkles className="badge-icon" /> BGMI Elite
            </span>
            <span className="hero-badge badge-ff">
              <Sparkles className="badge-icon" /> Free Fire Royale
            </span>
          </div>
        </motion.div>
      </section>

      <section className="grid game-grid">
        {gameCards.map((game, index) => {
          const Icon = game.icon;
          return (
            <motion.article
              key={game.title}
              className="game-card"
              whileHover={{ y: -8, scale: 1.02 }}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: index * 0.12, ease: "easeOut" }}
            >
              <div className="game-card-top">
                <div className="game-card-icon">
                  <Icon />
                </div>
                <div>
                  <h3>{game.title}</h3>
                  <span className="card-chip">{game.tag}</span>
                </div>
              </div>
              <p>{game.description}</p>
              <div className="card-footer">
                <Link to="/tournaments" className="btn btn-tertiary">
                  Browse rooms
                </Link>
                <span className="card-meta">Next match starts soon</span>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="card upcoming-card">
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
