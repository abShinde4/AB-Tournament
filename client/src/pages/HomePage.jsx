import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <main className="page home-landing-page">
      <section className="home-landing-card" aria-label="AB Tournament landing">
        <div className="home-landing-brand">
          <span className="home-landing-brand-name">AB Tournament</span>
          <span className="home-landing-brand-subtitle">Esports arena</span>
        </div>

        <div className="home-landing-badge">PREMIUM ESPORTS ARENA</div>

        <h1 className="home-landing-title">Join premium BGMI &amp; Free Fire tournaments</h1>

        <p className="home-landing-copy">
          Play matches, join squads, win rewards, and compete in AB Tournament.
        </p>

        <div className="home-landing-actions">
          <Link className="btn btn-primary home-landing-cta" to="/auth">
            Get Started
          </Link>
        </div>

        <div className="home-landing-trust">Fast Joins • Squad Matches • Win Rewards</div>
      </section>
    </main>
  );
};

export default HomePage;
