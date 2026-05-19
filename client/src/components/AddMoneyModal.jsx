import WalletRechargeModal from "./WalletRechargeModal";

const AddMoneyModal = ({ isOpen, onClose }) => (
  <WalletRechargeModal isOpen={isOpen} onClose={onClose} suggestedAmount={100} title="Add Money" />
);

export default AddMoneyModal;
