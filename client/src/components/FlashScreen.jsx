import { useState } from "react";
import { buildAvatarUrl } from "../utils/avatarUrl";

const FlashScreen = ({ user }) => {
  const [brokenAvatar, setBrokenAvatar] = useState(false);

  const hasAvatar = Boolean(user?.avatar) && !brokenAvatar;
  const avatarSrc = hasAvatar ? buildAvatarUrl(user.avatar) : "/default-avatar.svg";

  return (
    <section className="flash-screen" aria-live="polite" aria-busy="true">
      <div className="flash-bg" />
      <div className="flash-content">
        {hasAvatar ? (
          <>
            <div className="flash-avatar-wrap">
              <img
                src={avatarSrc}
                alt="Player avatar"
                className="flash-avatar"
                onError={() => setBrokenAvatar(true)}
              />
            </div>
            <h2>Welcome back, Player 🎮</h2>
          </>
        ) : (
          <>
            <div className="flash-logo">AB Tournament</div>
            <h2>Loading your battleground...</h2>
          </>
        )}

        <div className="flash-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="flash-progress" />
    </section>
  );
};

export default FlashScreen;
