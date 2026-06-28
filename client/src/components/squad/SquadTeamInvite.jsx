import toast from "react-hot-toast";
import "./squad-team.css";

const SquadTeamInvite = ({ inviteMessage, teamId }) => {
  const message =
    inviteMessage ||
    `🏆 Join my BGMI Squad!\n\nTeam ID:\n${teamId || ""}\n\nOpen:\nhttps://ab-tournament.vercel.app/tournaments`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Invite message copied");
    } catch {
      toast.error("Unable to copy invite message");
    }
  };

  return (
    <div>
      <div className="squad-invite-box">{message}</div>
      <button type="button" className="btn btn-secondary full-width" onClick={handleCopy}>
        Copy Invite Message
      </button>
    </div>
  );
};

export default SquadTeamInvite;
