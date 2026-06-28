import { useState } from "react";
import toast from "react-hot-toast";
import CreateTeamModal from "./CreateTeamModal";
import JoinTeamModal from "./JoinTeamModal";
import EditTeamModal from "./EditTeamModal";
import ManageTeamPanel from "./ManageTeamPanel";
import SquadTeamInvite from "./SquadTeamInvite";
import SquadTeamLockedBanner from "./SquadTeamLockedBanner";
import WalletRechargeModal from "../WalletRechargeModal";
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
  const [walletModal, setWalletModal] = useState({ open: false, amount: 100 });

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
      setWalletModal({ open: true, amount: Math.max(entryFee - walletBalance, entryFee) });
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
        <>
          <ManageTeamPanel
            team={team}
            currentUserId={user?._id}
            onUpdate={() => onRefresh?.()}
            onEdit={() => setShowEdit(true)}
          />
          <SquadTeamInvite teamId={team.teamId} />
        </>
      ) : (
        <div className="squad-team-actions">
          <button
            type="button"
            className="btn btn-primary full-width"
            disabled={isLocked || slotsLeft === 0}
            onClick={openCreateFlow}
          >
            {slotsLeft === 0 ? "No Team Slots Left" : "👑 Create Team"}
          </button>
          <button
            type="button"
            className="btn btn-secondary full-width"
            disabled={isLocked}
            onClick={openJoinFlow}
          >
            Join Existing Team
          </button>
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
      <WalletRechargeModal
        isOpen={walletModal.open}
        suggestedAmount={walletModal.amount}
        title={`Add ₹${walletModal.amount} to Wallet`}
        onClose={() => setWalletModal({ open: false, amount: 100 })}
      />
    </>
  );
};

export default SquadTeamActions;
