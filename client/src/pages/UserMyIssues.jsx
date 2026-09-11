/**
 * UserMyIssues.jsx
 *
 * This page lists all issues submitted by the currently logged in user.
 * Users can search for a specific issue by description, location or campus.
 * They can also filter their issues by status.
 *
 * Author/s: Grish Gautam
 * Date: 09/09/26
 */

import "./UserMyIssues.css";
import "./UserDashboard.css";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

import { userLogout } from "../hooks/userLogout";
import { getUserData } from "../hooks/getUserData";

import UONLogo from "../images/UONLogo White.png";

import {
  LayoutDashboard,
  FilePlus2,
  CircleAlert,
  UserRound,
  LogOut,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  ClipboardList,
} from "lucide-react";

export default function UserMyIssues() {
  const navigate = useNavigate();
  const logout = userLogout();
  const { userData } = getUserData();

  const displayName = userData?.firstName || userData?.name || "User";

  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const ISSUES_PER_PAGE = 5;
  const sortIssuesByDate = (issueList) => {
    return [...issueList].sort((a, b) => {
      const timeA = new Date(
        a.dateTimeReported || a.createdAt || 0
      ).getTime();

      const timeB = new Date(
        b.dateTimeReported || b.createdAt || 0
      ).getTime();

      return sortOrder === "oldest"
        ? timeA - timeB
        : timeB - timeA;
    });
  };

  /**
   * Fetch all issues submitted by current user
   */
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setError("No user is currently logged in.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:8000/api/issues/user/${user.uid}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch issues from server.");
        }

        const data = await res.json();
        const sortedData = sortIssuesByDate(data);

        setIssues(sortedData);
        setFilteredIssues(sortedData);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
        setError("Failed to load your issues.");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [sortOrder]);

  /**
   * Search and filter
   */
  useEffect(() => {
    let temp = [...issues];

    if (statusFilter === "Active") {
      temp = temp.filter(
        (issue) =>
          issue.status === "Open" ||
          issue.status === "In Progress"
      );
    } else if (statusFilter !== "All") {
      temp = temp.filter(
        (issue) => issue.status === statusFilter
      );
    }
    if (search.trim()) {
      const searchLower = search.toLowerCase();

      temp = temp.filter(
        (issue) =>
          issue._id?.toLowerCase().includes(searchLower) ||
          issue.title?.toLowerCase().includes(searchLower) ||
          issue.issueDescription
            ?.toLowerCase()
            .includes(searchLower) ||
          issue.campus?.toLowerCase().includes(searchLower) ||
          issue.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredIssues(sortIssuesByDate(temp));
    setCurrentPage(1);
  }, [search, statusFilter, issues, sortOrder]);

  const getStatusClass = (status) => {
    if (status === "Open") {
      return "user-my-issues-status-open";
    }

    if (status === "In Progress") {
      return "user-my-issues-status-progress";
    }

    if (status === "Closed") {
      return "user-my-issues-status-resolved";
    }

    return "";
  };

  const totalPages = Math.ceil(
    filteredIssues.length / ISSUES_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ISSUES_PER_PAGE;

  const currentIssues = filteredIssues.slice(
    startIndex,
    startIndex + ISSUES_PER_PAGE
  );

  const formatReportedDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    return new Date(dateValue).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) =>
      Math.min(page + 1, totalPages)
    );
  };

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  if (loading) {
    return (
      <div className="user-my-issues-loading-screen">
        Loading your issues...
      </div>
    );
  }

  // Build initials for avatar
  const initials =
    `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="user-dashboard">

      {/* =========================
          SHARED DASHBOARD SIDEBAR
      ========================== */}

      <aside className="user-dashboard-sidebar">

        <div className="user-dashboard-logo">
          <img
            src={UONLogo}
            alt="University of Newcastle Australia"
          />
        </div>

        <nav className="user-dashboard-nav">

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/userdashboard")}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/reportissue")}
          >
            <FilePlus2 />
            <span>Report Issues</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item active"
          >
            <CircleAlert />
            <span>My Issues</span>
          </button>

          <button
            type="button"
            className="user-dashboard-nav-item"
            onClick={() => navigate("/profile")}
          >
            <UserRound />
            <span>Profile</span>
          </button>

        </nav>

        <div className="user-dashboard-logout-section">

          <button
            type="button"
            className="user-dashboard-logout"
            onClick={logout}
          >
            <LogOut />
            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================== */}

      <main className="user-dashboard-main">

        {/* HEADER */}

        <header className="user-dashboard-header">

          <h1>My issues</h1>

          <div className="user-dashboard-header-user">
            <span>
              Welcome {displayName}
            </span>

            <div className="profile-avatar">
              <span>{initials}</span>
            </div>
          </div>

        </header>

        {/* CONTENT */}

        <section className="user-my-issues-content">


          <div className="user-my-issues-panel">

            {error && (
              <div className="user-my-issues-error">
                {error}
              </div>
            )}

            {/* SEARCH AND FILTERS */}

            <div className="user-my-issues-controls">

              <div className="user-my-issues-search-group">

                <div className="user-my-issues-search-box">

                  <Search />

                  <input
                    type="text"
                    placeholder="Search by issue ID, title, description, campus or location"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />

                </div>

              </div>

              <div className="user-my-issues-filter-group">

                <label htmlFor="statusFilter">
                  Filter by Status
                </label>

                <div className="user-my-issues-select-wrap">

                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">
                      In Progress
                    </option>
                    <option value="Closed">Closed</option>
                  </select>

                  <ChevronDown />

                </div>

              </div>

              <div className="user-my-issues-filter-group">

                <label htmlFor="sortOrder">
                  Sort by Date
                </label>

                <div className="user-my-issues-select-wrap">

                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value)
                    }
                  >
                    <option value="newest">
                      Newest first
                    </option>

                    <option value="oldest">
                      Oldest first
                    </option>
                  </select>

                  <ChevronDown />

                </div>

              </div>

            </div>

            {/* ISSUE LIST */}

            <div className="user-my-issues-list">

              {currentIssues.length === 0 ? (

                <div className="user-my-issues-empty">

                  <div className="user-my-issues-empty-icon">
                    <ClipboardList />
                  </div>

                  <h3>No issues found.</h3>

                  <p>
                    You haven't reported any issues yet.
                  </p>

                </div>

              ) : (

                currentIssues.map((issue) => (

                  <div
                    key={issue._id}
                    className="user-my-issues-card"
                    onClick={() =>
                      navigate(`/issue/${issue._id}`, {
                        state: { from: "myissues" },
                      })
                    }
                  >

                    <div className="user-my-issues-card-left">

                      <h2>
                        {issue.title}
                      </h2>

                      {issue.additionalDetails ? (
                        <p>{issue.additionalDetails}</p>
                      ) : (
                        <p>{issue.issueDescription}</p>
                      )}

                      <div className="user-my-issues-meta">
                        <div className="user-my-issues-meta-item">

                          <MapPin />

                          <span>
                            {issue.location ||
                              "Unknown location"}
                          </span>

                        </div>

                        <div className="user-my-issues-meta-item">

                          <Building2 />

                          <span>
                            {issue.campus ||
                              "Unknown campus"}
                          </span>

                        </div>


                      </div>

                    </div>

                    <div className="user-my-issues-card-right">

                      <div>

                        <p className="user-my-issues-card-right-label">
                          Status
                        </p>

                        <span
                          className={`user-my-issues-status-badge ${getStatusClass(
                            issue.status
                          )}`}
                        >
                          {issue.status}
                        </span>

                      </div>

                      <div className="user-my-issues-date-block">

                        <p className="user-my-issues-date-title">
                          Date Reported
                        </p>

                        <p className="user-my-issues-date-value">
                          {formatReportedDate(
                            issue.dateTimeReported
                          )}
                        </p>

                      </div>

                    </div>

                    <ChevronRight className="user-my-issues-card-arrow" />

                  </div>

                ))

              )}

            </div>

            {/* FOOTER */}
            {filteredIssues.length > ISSUES_PER_PAGE && (
              <div className="user-my-issues-footer">

                <div className="user-my-issues-count">
                  <div className="user-my-issues-count">
                    Page {currentPage} of {totalPages} · {filteredIssues.length} issues total
                  </div>
                </div>

                <div className="user-my-issues-pagination">

                  {/* Previous page button */}
                  <button
                    type="button"
                    className="user-my-issues-page-btn"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft />
                  </button>

                  {/* Page number buttons */}
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`user-my-issues-page-btn ${currentPage === pageNumber ? "active" : ""
                        }`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  {/* Next page button */}
                  <button
                    type="button"
                    className="user-my-issues-page-btn"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight />
                  </button>

                </div>

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}