import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ShieldCheck, ShieldX } from "lucide-react";
import { api } from "../api";
import Skeleton from "../components/Skeleton";
import "./license-page.css";

const VerifyLicensePage = () => {
  const { licenseId: routeLicenseId } = useParams();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(routeLicenseId || searchParams.get("token") || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeLicenseId || searchParams.get("token")));
  const [error, setError] = useState("");

  const runVerify = async (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a License ID or scan QR code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const isToken = /^[a-f0-9]{32}$/i.test(trimmed);
      const res = isToken
        ? await api.verifyLicense(null, trimmed)
        : await api.verifyLicense(trimmed.toUpperCase());
      setResult(res);
    } catch (err) {
      setError(err.message);
      setResult({ valid: false, message: "Invalid License" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeLicenseId || searchParams.get("token")) {
      runVerify(routeLicenseId || searchParams.get("token"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeLicenseId, searchParams]);

  return (
    <main className="page v2-page verify-license-page">
      <h1 className="v2-page-title">Verify License</h1>
      <p className="v2-muted">Search by License ID or QR verification token.</p>

      <section className="card v2-section">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runVerify(query);
          }}
          className="v2-form"
        >
          <label className="v2-label">
            License ID
            <input
              className="v2-input"
              placeholder="AB-BGMI-26-000001"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary v2-btn-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
        {error && <p className="state-text">{error}</p>}
      </section>

      {loading && !result && <Skeleton lines={5} />}

      {result && (
        <section className={`card verify-page-card ${result.valid ? "valid" : "invalid"}`}>
          {result.valid ? (
            <>
              <ShieldCheck size={48} color="#6ee7b7" />
              <h2>Verified Player</h2>
              <div className="verify-result-grid">
                <div>
                  <span className="license-label">Player Name</span>
                  <strong>{result.license.playerName}</strong>
                </div>
                <div>
                  <span className="license-label">License ID</span>
                  <strong>{result.license.licenseId}</strong>
                </div>
                <div>
                  <span className="license-label">Status</span>
                  <strong>{result.license.status}</strong>
                </div>
                <div>
                  <span className="license-label">Tier</span>
                  <strong>{result.license.tier}</strong>
                </div>
                <div>
                  <span className="license-label">Issue Date</span>
                  <strong>{new Date(result.license.issueDate).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="license-label">Matches Completed</span>
                  <strong>{result.license.currentApprovedMatches}</strong>
                </div>
                <div>
                  <span className="license-label">BGMI UID</span>
                  <strong>{result.license.bgmiUid || "—"}</strong>
                </div>
                {result.license.foundingBadge && (
                  <div>
                    <span className="license-label">Badge</span>
                    <strong>{result.license.foundingBadge}</strong>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ShieldX size={48} color="#f87171" />
              <h2>Invalid License</h2>
              <p className="v2-muted">{result.message || "This license could not be verified."}</p>
            </>
          )}
        </section>
      )}
    </main>
  );
};

export default VerifyLicensePage;
