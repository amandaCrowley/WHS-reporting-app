import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  History,
} from "lucide-react";
import { getUserData } from "../hooks/getUserData";
import { userLogout } from "../hooks/userLogout";
import MobilePageHeading from "../components/MobilePageHeading";
import useMobileNavigation from "../hooks/useMobileNavigation";
import NotificationBell from "../components/NotificationBell";
import UONLogo from "../images/UONLogo White.png";
import "../pages/UserDashboard.css";
import "../styles/AdminReporting.css";
import "./AdminAuditLog.css";

const actionOptions = [
  ["", "All actions"],
  ["ADMIN_PROMOTED", "Admin promoted"],
  ["ADMIN_DEMOTED", "Admin demoted"],
  ["ADMIN_ACCESS_APPROVED", "Admin access approved"],
  ["ADMIN_ACCESS_REJECTED", "Admin access rejected"],
  ["USER_DEIDENTIFICATION_REQUESTED", "De-identification requested"],
  ["USER_DEIDENTIFICATION_FAILED", "De-identification failed"],
  ["USER_DEIDENTIFIED", "User de-identified"],
  ["USER_CREATED", "User created"],
  ["USER_DELETED", "User deleted"],
  ["ISSUE_CREATED", "Issue created"],
  ["ISSUE_UPDATED", "Issue updated"],
  ["ISSUE_ASSIGNED", "Issue assigned"],
  ["ISSUE_UNASSIGNED", "Issue unassigned"],
  ["ISSUE_STATUS_CHANGED", "Issue status changed"],
  ["ISSUE_PRIORITY_CHANGED", "Issue priority changed"],
  ["ISSUE_ARCHIVED", "Issue archived"],
  ["ISSUE_RESTORED", "Issue restored"],
  ["MESSAGE_CREATED", "Message created"],
  ["MESSAGE_DELETED", "Message deleted"],
  ["COMMENT_CREATED", "Comment created"],
];

const formatAction = (action) =>
  action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
};

const detailLabels = {
  issueId: "Issue ID",
  privacyRequestId: "Privacy Request ID",
};

const defaultDetailsByAction = {
  ISSUE_CREATED: "Issue reported.",
  ISSUE_UPDATED: "Issue updated.",
  ISSUE_STATUS_CHANGED: "Issue status changed.",
  ISSUE_PRIORITY_CHANGED: "Issue priority changed.",
  ISSUE_ASSIGNED: "Issue assigned.",
  ISSUE_UNASSIGNED: "Issue unassigned.",
  ISSUE_ARCHIVED: "Issue archived.",
  ISSUE_RESTORED: "Issue restored.",
  COMMENT_CREATED: "Comment added.",
  MESSAGE_CREATED: "Message added.",
  MESSAGE_DELETED: "Message removed.",
  USER_CREATED: "User created.",
  USER_DELETED: "User removed from the system.",
};

const issueFieldLabels = {
  title: "Title",
  issueDescription: "Description",
  location: "Location",
  campus: "Campus",
  dateTimeIssueOccurred: "Incident date and time",
  witnessNames: "Witness names",
  imageURLs: "Issue images",
};

const formatDetails = (details) => {
  if (!details || typeof details !== "object") return "";

  const parts = [];
  if (Array.isArray(details.changedFields)) {
    const fields = details.changedFields.map((field) => issueFieldLabels[field] || field);
    parts.push(`Changed fields: ${fields.join(", ")}`);
  }

  if (details.from !== undefined || details.to !== undefined) {
    parts.push(`From: ${details.from ?? "Unknown"} to ${details.to ?? "Unknown"}`);
  }

  Object.entries(details).forEach(([key, value]) => {
    if (key === "changedFields") return;
    if (key === "from" || key === "to") return;
    if (key === "assignedTo" || key === "previousAssignee" || key === "createdBy") return;
    if (key === "actorName") return;
    if (key === "targetName") return;
    if (key === "assignedToName") {
      parts.push(`Assigned to: ${value}`);
      return;
    }
    if (key === "previousAssigneeName") {
      parts.push(`Previously assigned to: ${value || "Unavailable"}`);
      return;
    }
    if (key === "createdByName") {
      parts.push(`Created by: ${value || "Unavailable"}`);
      return;
    }
    parts.push(`${detailLabels[key] || formatAction(key)}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
  });

  return parts.join(" · ");
};

export default function AdminAuditLog() {
  const mobileNavigation = useMobileNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = userLogout();
  const { userData } = getUserData();
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: "",
    actorType: "",
    outcome: "",
    from: "",
    to: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ firebaseUid: userData?.firebaseUid || "" });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters, userData?.firebaseUid]);

  const fetchLogs = useCallback(async () => {
    if (!userData?.firebaseUid) return;
    setLoading(true);
    setError("");
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error("Your administrator session has expired.");
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:8000/api/admin/audit-logs?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load audit logs.");
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [queryString, userData?.firebaseUid]);

  const printAuditLog = () => window.print();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      actorType: "",
      outcome: "",
      from: "",
      to: "",
      search: "",
    });
  };

  return (
    <div className={`user-dashboard admin-dashboard admin-reporting admin-audit-page ${mobileNavigation.layoutClassName}`} onKeyDown={mobileNavigation.onKeyDown}>
      <aside className="user-dashboard-sidebar" {...mobileNavigation.sidebarProps}>
        <div className="user-dashboard-logo">
          <img src={UONLogo} alt="The University of Newcastle Australia" />
        </div>
        <nav className="user-dashboard-nav" aria-label="Administrator navigation">
          <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/dashboard")}><LayoutDashboard /><span>Dashboard</span></button>
          <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/manageissues")}><ClipboardList /><span>Manage Issues</span></button>
          <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/usermanagement")}><Users /><span>User Management</span></button>
          <button type="button" className="user-dashboard-nav-item" onClick={() => navigate("/admin/reporting")}><BarChart3 /><span>Reporting & Analytics</span></button>
          <button type="button" className={`user-dashboard-nav-item ${location.pathname === "/admin/audit-log" ? "active" : ""}`} onClick={() => navigate("/admin/audit-log")}><ShieldCheck /><span>Audit Log</span></button>
        </nav>
        <div className="user-dashboard-logout-section">
          <button type="button" className="user-dashboard-logout" onClick={logout}><LogOut /><span>Logout</span></button>
        </div>
      </aside>

      <div className="user-dashboard-main">
        <header className="user-dashboard-header">
          <MobilePageHeading title="Audit log" {...mobileNavigation.headingProps} />
          <div className="user-dashboard-header-user">
            <span>Welcome {userData?.firstName || "Admin"}</span>
            <NotificationBell firebaseUid={userData?.firebaseUid} />
          </div>
        </header>
        <main className="user-dashboard-content admin-audit-content">
          <section className="admin-reporting-intro">
            <div className="admin-reporting-intro-content">
              <div className="admin-reporting-intro-icon">
                <History />
              </div>
              <div>
                <p>Review administrator access changes, privacy requests and other WHS actions.</p>
              </div>
            </div>
            <div className="admin-reporting-export">
              <div className="admin-reporting-export-controls">
                <button type="button" onClick={fetchLogs} disabled={loading}>
                  <RefreshCw size={16} /> Refresh
                </button>
                <button type="button" onClick={printAuditLog} disabled={loading}>
                  <Download size={16} /> Save as PDF
                </button>
              </div>
              <span className="admin-reporting-export-hint">Opens the print dialog. Choose Save as PDF.</span>
            </div>
          </section>

          <section className="admin-reporting-filters" aria-label="Audit log filters">
            <div className="admin-reporting-filter">
              <label htmlFor="audit-action-filter">Action</label>
              <select id="audit-action-filter" name="action" value={filters.action} onChange={updateFilter}>{actionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </div>
            <div className="admin-reporting-filter">
              <label htmlFor="audit-actor-filter">Actor type</label>
              <select id="audit-actor-filter" name="actorType" value={filters.actorType} onChange={updateFilter}><option value="">All actors</option><option value="Admin">Admin</option><option value="User">User</option></select>
            </div>
            <div className="admin-reporting-filter">
              <label htmlFor="audit-outcome-filter">Outcome</label>
              <select id="audit-outcome-filter" name="outcome" value={filters.outcome} onChange={updateFilter}><option value="">All outcomes</option><option value="Success">Success</option><option value="Failure">Failure</option></select>
            </div>
            <div className="admin-reporting-filter">
              <label htmlFor="audit-from-filter">Start date</label>
              <input id="audit-from-filter" type="date" name="from" value={filters.from} onChange={updateFilter} />
            </div>
            <div className="admin-reporting-filter">
              <label htmlFor="audit-to-filter">End date</label>
              <input id="audit-to-filter" type="date" name="to" value={filters.to} onChange={updateFilter} />
            </div>
            <div className="admin-reporting-filter">
              <label htmlFor="audit-search-filter">Search</label>
              <input id="audit-search-filter" type="search" name="search" value={filters.search} onChange={updateFilter} placeholder="Action or reason" />
            </div>
            <div className="admin-reporting-filter-actions">
              <button type="button" className="admin-reporting-filter-clear" onClick={clearFilters}>Clear</button>
            </div>
          </section>

          {error && <p className="admin-audit-error" role="alert">{error}</p>}
          <section className="admin-audit-table-card">
            {loading ? <p className="admin-audit-empty">Loading audit events...</p> : logs.length === 0 ? <p className="admin-audit-empty"><Activity size={28} />No audit events match the selected filters.</p> : (
              <div className="admin-audit-table-wrap">
                <table className="admin-audit-table">
                  <thead><tr><th>Date and time</th><th>Action</th><th>Actor</th><th>Target</th><th>Outcome</th><th>Reason / details</th></tr></thead>
                  <tbody>{logs.map((log) => (
                    <tr key={log._id}>
                      <td>{formatDate(log.performedAt)}</td>
                      <td><strong>{log.action}</strong></td>
                      <td><strong>{log.actorName || "Unavailable"}</strong><small>{log.actorType}{log.actorEmail ? ` · ${log.actorEmail}` : ""}</small></td>
                      <td><strong>{log.targetName || log.targetType}</strong><small>{log.targetName ? log.targetType : (log.targetId || "Not specified")}</small></td>
                      <td><span className={`admin-audit-outcome admin-audit-outcome-${log.outcome.toLowerCase()}`}>{log.outcome}</span></td>
                      <td>
                        {log.reason || defaultDetailsByAction[log.action] || "Action recorded."}
                        {log.targetId && <small>{`${log.targetType} ID: ${log.targetId}`}</small>}
                        {formatDetails(log.details) && <small>{formatDetails(log.details)}</small>}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </main>
        <section className="admin-audit-print-sheet">
          <header className="admin-audit-print-header">
            <div>
              <p className="admin-audit-print-eyebrow">UNIVERSITY OF NEWCASTLE</p>
              <h1>WHS Audit Log</h1>
              <p>Workplace Health &amp; Safety Reporting</p>
            </div>
            <div className="admin-audit-print-date">
              <span>Generated</span>
              <strong>{formatDate(new Date())}</strong>
            </div>
          </header>
          <div className="admin-audit-print-summary">
            <div><span>Action</span><strong>{filters.action || "All actions"}</strong></div>
            <div><span>Actor type</span><strong>{filters.actorType || "All actors"}</strong></div>
            <div><span>Outcome</span><strong>{filters.outcome || "All outcomes"}</strong></div>
            <div><span>Date range</span><strong>{filters.from || "Any"} to {filters.to || "Any"}</strong></div>
            <div><span>Search</span><strong>{filters.search || "None"}</strong></div>
            <div><span>Total records</span><strong>{logs.length}</strong></div>
          </div>
          <table className="admin-audit-print-table">
            <thead><tr><th>Date and time</th><th>Action</th><th>Actor</th><th>Target</th><th>Outcome</th><th>Reason / details</th></tr></thead>
            <tbody>{logs.map((log) => (
              <tr key={log._id}>
                <td>{formatDate(log.performedAt)}</td>
                <td>{log.action}</td>
                <td>{log.actorName || "Unavailable"}<small>{log.actorType}{log.actorEmail ? ` · ${log.actorEmail}` : ""}</small></td>
                <td>{log.targetName || log.targetType}<small>{log.targetName ? log.targetType : (log.targetId || "Not specified")}</small></td>
                <td>{log.outcome}</td>
                <td>{log.reason || defaultDetailsByAction[log.action] || "Action recorded."}{log.targetId && <small>{`${log.targetType} ID: ${log.targetId}`}</small>}{formatDetails(log.details) && <small>{formatDetails(log.details)}</small>}</td>
              </tr>
            ))}</tbody>
          </table>
          <footer className="admin-audit-print-footer">Exported copy of the WHS administrator audit log.</footer>
        </section>
      </div>
    </div>
  );
}
