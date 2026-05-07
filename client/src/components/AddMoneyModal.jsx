import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../context/useAuth";

const AddMoneyModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);
  }, [isOpen]);

  if (!isOpen) return null;

  const pay = async () => {
    try {
      setLoading(true);
      const amt = Number(amount);

      const orderRes = await api.createPaymentOrder({ amount: amt });
      if (!orderRes?.orderId || !orderRes?.razorpayKeyId) {
        throw new Error(orderRes?.message || "Payment gateway not configured");
      }

      const options = {
        key: orderRes.razorpayKeyId,
        amount: orderRes.amountPaise,
        currency: orderRes.currency || "INR",
        name: "AB Tournament",
        description: "Wallet top-up",
        order_id: orderRes.orderId,
        prefill: {
          name: user?.username || "User",
          email: user?.email || "",
        },
        theme: { color: "#6d56ff" },
        handler: async (response) => {
          try {
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setUser((prev) => ({ ...prev, walletBalance: verifyRes.walletBalance }));
            toast.success(`Wallet credited: INR ${amt}`);
            onClose();
          } catch (e) {
            toast.error(e.message);
          } finally {
            setLoading(false);
          }
        },
      };

      if (!window.Razorpay || !razorpayReady) {
        throw new Error("Razorpay checkout failed to load");
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setLoading(false);
        toast.error(resp?.error?.description || "Payment failed");
      });
      rzp.open();
    } catch (error) {
      // Fallback to simulated flow if gateway isn't configured.
      try {
        const res = await api.addMoney({ amount: Number(amount) });
        setUser((prev) => ({ ...prev, walletBalance: res.walletBalance }));
        toast.success(`Wallet credited: INR ${amount}`);
        onClose();
        setLoading(false);
      } catch {
        toast.error(error.message);
        setLoading(false);
      }
    } finally {
      // If the Razorpay checkout opened, `setLoading(false)` will happen in handler/payment.failed.
      if (!window.Razorpay || !razorpayReady) setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal card">
        <h3>Add Money</h3>
        <p className="muted">Razorpay checkout</p>
        <input
          type="number"
          min={10}
          max={50000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="row">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="button" onClick={pay} disabled={loading}>
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMoneyModal;
