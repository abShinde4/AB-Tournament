import React from "react";

const RefundPolicyPage = () => {
  return (
    <main className="page">
      <section className="card">
        <h1>Refund Policy</h1>
        <p><strong>Effective Date:</strong> [May 10, 2026]</p>

        <h2>1. General Refund Policy</h2>
        <p>AB Tournament aims to provide fair and transparent refund policies for our tournament platform. Please read this policy carefully before participating.</p>

        <h2>2. Tournament Entry Fees</h2>
        <h3>Non-Refundable Fees</h3>
        <ul>
          <li>Tournament entry fees are generally non-refundable once the tournament begins</li>
          <li>Entry fees paid for completed tournaments are not refundable</li>
          <li>Fees for tournaments you voluntarily withdraw from are not refundable</li>
        </ul>

        <h3>Refundable Scenarios</h3>
        <ul>
          <li>Tournament cancellation by AB Tournament due to technical issues</li>
          <li>Tournament cancellation due to insufficient participants</li>
          <li>Duplicate or erroneous charges (subject to verification)</li>
        </ul>

        <h2>3. Wallet Transactions</h2>
        <ul>
          <li>Add-money transactions are non-refundable</li>
          <li>Refunds for cancelled tournaments will be credited back to your wallet</li>
          <li>Processing fees may apply for external withdrawals</li>
        </ul>

        <h2>4. Refund Process</h2>
        <ol>
          <li>Contact our support team with your refund request</li>
          <li>Provide tournament ID and reason for refund</li>
          <li>Verification may be required</li>
          <li>Approved refunds processed within 5-7 business days</li>
        </ol>

        <h2>5. Exceptions</h2>
        <ul>
          <li>Refunds not available for account suspensions due to violations</li>
          <li>No refunds for technical issues on your end</li>
          <li>Force majeure events may affect refund availability</li>
        </ul>

        <h2>6. Contact for Refunds</h2>
        <p>For refund requests, please contact our support team at [contact information] with detailed information about your case.</p>

        <h2>7. Policy Updates</h2>
        <p>This refund policy may be updated periodically. Users will be notified of significant changes.</p>
      </section>
    </main>
  );
};

export default RefundPolicyPage;