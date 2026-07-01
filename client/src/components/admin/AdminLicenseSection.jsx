import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";

const AdminLicenseSection = () => {
  const [config, setConfig] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [editForm, setEditForm] = useState({
    tier: "Bronze",
    status: "active",
    imageUrl: "",
    instagramUrl: "",
    cdnUrl: "",
    driveUrl: "",
    rejectionReason: "",
  });

  const load = async () => {
    const [configRes, listRes] = await Promise.all([
      api.getAdminLicenseConfig(),
      api.getAdminLicenses("limit=20"),
    ]);
    setConfig(configRes.config);
    setLicenses(listRes.data || []);
  };

  useEffect(() => {
    load().catch((err) => toast.error(err.message));
  }, []);

  const saveConfig = async (event) => {
    event.preventDefault();
    try {
      await api.updateAdminLicenseConfig({
        foundingRequiredMatches: Number(config.foundingRequiredMatches),
        regularRequiredMatches: Number(config.regularRequiredMatches),
        foundingMemberLimit: Number(config.foundingMemberLimit),
        defaultTier: config.defaultTier,
      });
      toast.success("License config saved");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const runSearch = async () => {
    if (!search.trim()) return;
    try {
      const res = await api.searchAdminLicenseUsers(search.trim());
      setSearchResults(res.data || []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const issueLicense = async (userId) => {
    try {
      await api.adminIssueLicense({ userId, tier: config?.defaultTier || "Bronze" });
      toast.success("License issued");
      runSearch();
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openEdit = (license) => {
    setSelectedLicense(license);
    setEditForm({
      tier: license.tier || "Bronze",
      status: license.status || "active",
      imageUrl: license.imageUrl || "",
      instagramUrl: license.instagramUrl || "",
      cdnUrl: license.cdnUrl || "",
      driveUrl: license.driveUrl || "",
      rejectionReason: license.rejectionReason || "",
    });
  };

  const saveLicense = async () => {
    if (!selectedLicense) return;
    try {
      await api.adminUpdateLicense(selectedLicense._id, editForm);
      toast.success("License updated");
      setSelectedLicense(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="card">
      <h3>Verified Gamer License</h3>

      {config && (
        <form className="form-grid" onSubmit={saveConfig} style={{ marginBottom: "1rem" }}>
          <input
            type="number"
            placeholder="Founding member limit"
            value={config.foundingMemberLimit}
            onChange={(e) => setConfig({ ...config, foundingMemberLimit: e.target.value })}
          />
          <input
            type="number"
            placeholder="Founding required matches"
            value={config.foundingRequiredMatches}
            onChange={(e) => setConfig({ ...config, foundingRequiredMatches: e.target.value })}
          />
          <input
            type="number"
            placeholder="Regular required matches (5-10)"
            value={config.regularRequiredMatches}
            onChange={(e) => setConfig({ ...config, regularRequiredMatches: e.target.value })}
          />
          <select
            value={config.defaultTier}
            onChange={(e) => setConfig({ ...config, defaultTier: e.target.value })}
          >
            <option>Bronze</option>
            <option>Silver</option>
            <option>Gold</option>
            <option>Elite</option>
          </select>
          <button type="submit" className="btn btn-primary">Save License Rules</button>
        </form>
      )}

      <div className="form-grid" style={{ marginBottom: "1rem" }}>
        <input
          placeholder="Search user by name, phone, email, license ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn-secondary" onClick={runSearch}>Search User</button>
      </div>

      {searchResults.length > 0 && (
        <div className="table-wrap" style={{ marginBottom: "1rem" }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone/Email</th>
                <th>License</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName || user.username}</td>
                  <td>{user.phoneNumber || user.email || "—"}</td>
                  <td>{user.license?.licenseId || "None"}</td>
                  <td>
                    {user.license ? (
                      <button type="button" className="btn btn-secondary" onClick={() => openEdit(user.license)}>
                        Manage
                      </button>
                    ) : (
                      <button type="button" className="btn btn-primary" onClick={() => issueLicense(user._id)}>
                        Issue License
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLicense && (
        <div className="card" style={{ marginBottom: "1rem", background: "rgba(8,10,20,0.5)" }}>
          <h4>Edit License — {selectedLicense.licenseId}</h4>
          <div className="form-grid">
            <select value={editForm.tier} onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}>
              <option>Bronze</option>
              <option>Silver</option>
              <option>Gold</option>
              <option>Elite</option>
            </select>
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Approve / Active</option>
              <option value="disabled">Disable</option>
              <option value="rejected">Reject</option>
              <option value="pending">Pending</option>
            </select>
            <input placeholder="License Image URL" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} />
            <input placeholder="Instagram Post URL" value={editForm.instagramUrl} onChange={(e) => setEditForm({ ...editForm, instagramUrl: e.target.value })} />
            <input placeholder="CDN URL" value={editForm.cdnUrl} onChange={(e) => setEditForm({ ...editForm, cdnUrl: e.target.value })} />
            <input placeholder="Drive URL" value={editForm.driveUrl} onChange={(e) => setEditForm({ ...editForm, driveUrl: e.target.value })} />
            <input placeholder="Rejection reason (optional)" value={editForm.rejectionReason} onChange={(e) => setEditForm({ ...editForm, rejectionReason: e.target.value })} />
            <button type="button" className="btn btn-primary" onClick={saveLicense}>Save License</button>
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedLicense(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>License ID</th>
              <th>Player</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Founding #</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr><td colSpan="6">No licenses issued yet.</td></tr>
            ) : (
              licenses.map((license) => (
                <tr key={license._id}>
                  <td>{license.licenseId}</td>
                  <td>{license.playerName}</td>
                  <td>{license.tier}</td>
                  <td>{license.status}</td>
                  <td>{license.foundingMemberNumber || "—"}</td>
                  <td>
                    <button type="button" className="btn btn-secondary" onClick={() => openEdit(license)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminLicenseSection;
