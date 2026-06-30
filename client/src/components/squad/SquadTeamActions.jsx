import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import CreateTeamModal from "./CreateTeamModal";
import JoinTeamModal from "./JoinTeamModal";
import EditTeamModal from "./EditTeamModal";
import ManageTeamPanel from "./ManageTeamPanel";
import SquadTeamLockedBanner from "./SquadTeamLockedBanner";
import "./squad-team.css";

const SquadTeamActions = ({
  match,
  user,
  isAuthenticated,
  walletBalance,
  onRefresh,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showInsufficient, setShowInsufficient] = useState(false);

  const team = match.mySquadTeam;
  const entryFee = match.entryFee || 20;
  const isLocked = team?.isLocked || match.status !== "Upcoming" || new Date(match.startTime) <= new Date();
  const hasTeam = Boolean(team);
  const slotsLeft = match.remainingTeamSlots ?? 0;

  const openCreateFlow = () => {
    if (!isAuthenticated) {
      toast.error("Please login first.");
      return;
    }
    if (isLocked) {
      toast.error("Tournament has started — team registration is closed.");
      return;
    }
    if (walletBalance < entryFee) {
      setShowInsufficient(true);
      return;
    }
    setShowCreate(true);
  };

  const openJoinFlow = () => {
    if (!isAuthenticated) {
      toast.error("Please login first.");
      return;
    }
    if (isLocked) {
      toast.error("Tournament has started — team registration is closed.");
      return;
    }
    setShowJoin(true);
  };

  return (
    <>
      {isLocked && hasTeam && <SquadTeamLockedBanner />}

      {hasTeam ? (
        <ManageTeamPanel
          team={team}
          currentUserId={user?._id}
          onUpdate={() => onRefresh?.()}
          onEdit={() => setShowEdit(true)}
        />
      ) : (
        <div className="squad-team-actions">
          <button
            type="button"
            className="btn btn-primary full-width"
            disabled={isLocked || slotsLeft === 0}
            onClick={openCreateFlow}
          >
            {slotsLeft === 0 ? "No Team Slots Left" : "Create Team"}
          </button>
          <button
            type="button"
            className="btn btn-secondary full-width"
            disabled={isLocked}
            onClick={openJoinFlow}
          >
            Join Team
          </button>
        </div>
      )}

      {showInsufficient && (
        <div className="squad-modal-backdrop" onClick={() => setShowInsufficient(false)}>
          <div className="squad-modal squad-insufficient-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Insufficient Balance</h3>
            <p>Please add wallet balance before creating a squad.</p>
            <div className="squad-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInsufficient(false)}>
                Close
              </button>
              <Link to="/profile#wallet" className="btn btn-primary" onClick={() => setShowInsufficient(false)}>
                Add Money
              </Link>
            </div>
          </div>
        </div>
      )}

      <CreateTeamModal
        isOpen={showCreate}
        match={match}
        user={user}
        onClose={() => setShowCreate(false)}
        onSuccess={() => onRefresh?.()}
      />
      <JoinTeamModal
        isOpen={showJoin}
        match={match}
        onClose={() => setShowJoin(false)}
        onSuccess={() => onRefresh?.()}
      />
      <EditTeamModal
        isOpen={showEdit}
        team={team}
        onClose={() => setShowEdit(false)}
        onSuccess={() => onRefresh?.()}
      />
    </>
  );
};

export default SquadTeamActions;
