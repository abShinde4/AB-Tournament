import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api";
import "./legacy-user-migration.css";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const LegacyUserMigration = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) params.set("search", search.trim());
      const res = await api.getAdminLegacyUsers(params.toString());
      setUsers(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1, limit: 15 });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAssignPhone = async (userId) => {
    const phone = window.prompt("Enter 10-digit phone number for this user:");
    if (!phone) return;
    setActionId(userId);
    try {
      await api.assignUserPhone(userId, phone.replace(/\D/g, "").slice(-10));
      toast.success("Phone assigned");
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionId("");
    }
  };

  const handleResetPassword = async (userId) => {
    const password = window.prompt("Enter new password (min 6 characters):");
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setActionId(userId);
    try {
      await api.resetUserPassword(userId, password);
      toast.success("Password reset");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionId("");
    }
  };

  const handleDeactivate = async (userId, name) => {
    if (!window.confirm(`Deactivate ${name}? They will not be able to sign in.`)) return;
    setActionId(userId);
    try {
      await api.deactivateUser(userId);
      toast.success("User deactivated");
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionId("");
    }
  };

  return (
    <section className="card legacy-migration-card">
      <div className="legacy-migration-header">
        <div>
          <h3>Legacy User Migration</h3>
          <p className="muted">
            Users missing a phone number cannot sign in. Assign a phone to restore access.
          </p>
        </div>
        <span className="legacy-migration-count">{pagination.total} missing phone</span>
      </div>

      <form
        className="legacy-migration-search"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          load();
        }}
      >
        <input
          type="search"
          placeholder="Search name, username, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      {loading ? (
        <p className="state-text">Loading legacy users...</p>
      ) : users.length === 0 ? (
        <p className="state-text">No legacy users missing phone numbers.</p>
      ) : (
        <div className="legacy-migration-table-wrap">
          <table className="legacy-migration-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Old Email</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName || "—"}</td>
                  <td>{u.username}</td>
                  <td className="legacy-email">{u.email || "—"}</td>
                  <td>{u.phoneNumber || "Not set"}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="legacy-migration-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={actionId === u._id}
                        onClick={() => handleAssignPhone(u._id)}
                      >
                        Assign Phone
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={actionId === u._id}
                        onClick={() => handleResetPassword(u._id)}
                      >
                        Reset Password
                      </button>
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm legacy-deactivate"
                          disabled={actionId === u._id}
                          onClick={() => handleDeactivate(u._id, u.fullName || u.username)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="legacy-migration-pagination">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default LegacyUserMigration;
