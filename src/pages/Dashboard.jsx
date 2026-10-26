import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import { formatINR, parseDDMMYYYYDate } from "../utils/formatters";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [membersRes, trainersRes, plansRes, paymentsRes, equipmentRes] =
        await Promise.all([
          axiosInstance.get("/members"),
          axiosInstance.get("/trainers"),
          axiosInstance.get("/plans"),
          axiosInstance.get("/payments"),
          axiosInstance.get("/equipment").catch(() => ({ data: [] })),
        ]);

      setMembers(membersRes.data || []);
      setTrainers(trainersRes.data || []);
      setPlans(plansRes.data || []);
      setPayments(paymentsRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (err) {
      toast.error("Failed to load dashboard metrics. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <div
          className="spinner-border text-primary"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="mt-3 text-muted fw-semibold">
          Loading FitTrack Dashboard...
        </p>
      </div>
    );
  }

  // Calculate Metrics
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "Active").length;
  const totalTrainers = trainers.length;

  const totalEquipment = equipment.length;
  const totalRevenue = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Expiring memberships this week
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const expiringThisWeek = members.filter((m) => {
    if (!m.expiryDate) return false;
    const expiry = parseDDMMYYYYDate(m.expiryDate);
    if (!expiry) return false;
    return expiry >= today && expiry <= nextWeek;
  });

  // Recent 5 payments sorted by date descending & insertion order so newly added payments always appear at top
  const recentPayments = [...payments]
    .map((p, idx) => ({ ...p, _originalIdx: idx }))
    .sort((a, b) => {
      const dateA = parseDDMMYYYYDate(a.date) || new Date(0);
      const dateB = parseDDMMYYYYDate(b.date) || new Date(0);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numB - numA;
      }
      return b._originalIdx - a._originalIdx;
    })
    .slice(0, 8);

  // Extract numeric month count from a duration string like "3 Months"
  const getDurationMonths = (durationStr) => {
    if (!durationStr) return 0;
    const match = durationStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Sort plans by duration (ascending months) so cards always display in order
  const sortedPlans = [...plans].sort(
    (a, b) => getDurationMonths(a.duration) - getDurationMonths(b.duration),
  );

  return (
    <div className="dashboard-container">
      <div className="fitness-hero-overlay">
        <div className="row align-items-center">
          <div className="col-12 col-lg-8">
            <span className="badge bg-primary bg-opacity-20 text-dark border border-info border-opacity-30 rounded-pill px-3 py-2 mb-3 fw-bold small uppercase tracking-wider">
              <i className="bi bi-lightning-charge-fill me-2 text-warning "></i>
              FitTrack Pro Gym System
            </span>
            <h1 className="glow-heading display-4 fw-black mb-2">
              PUSH LIMITS.
              <br />
              BUILD POWER.
            </h1>
            <p className="lead text-body-secondary mb-4 max-w-xl">
              Next-generation gym performance tracking, member management,
              trainer analytics, and financial reporting.
            </p>
            <div className="d-flex flex-wrap align-items-center gap-3">
              <Link
                to="/members"
                className="btn btn-glow btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2"
              >
                <i className="bi bi-person-plus-fill fs-5"></i>
                <span>Register Member</span>
              </Link>
              <Link
                to="/payments"
                className="btn btn-outline-info btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2 text-body fw-bold"
              >
                <i className="bi bi-currency-rupee fs-5 text-neon"></i>
                <span>Collect Payment</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-body mb-1">Performance Overview</h3>
          <p className="text-secondary mb-0">
            FitTrack Gym Management Summary — India IST
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
            onClick={fetchDashboardData}
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards with Neon Icons */}
      <div className="row g-3 mb-4">
        {/* Total Members */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-bold text-uppercase">
                  Total Members
                </span>
                <h3 className="fw-bold mb-0 mt-1">{totalMembers}</h3>
              </div>
              <div className="icon-glow-box">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
            </div>
            <div className="mt-3 small text-muted">Registered in system</div>
          </div>
        </div>

        {/* Active Memberships */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-bold text-uppercase">
                  Active Memberships
                </span>
                <h3 className="fw-bold text-success mb-0 mt-1">
                  {activeMembers}
                </h3>
              </div>
              <div
                className="icon-glow-box text-success"
                style={{ color: "var(--ft-glow-secondary)" }}
              >
                <i className="bi bi-check-circle-fill fs-4"></i>
              </div>
            </div>
            <div className="mt-3 small text-success fw-semibold">
              {totalMembers
                ? Math.round((activeMembers / totalMembers) * 100)
                : 0}
              % Active rate
            </div>
          </div>
        </div>

        {/* Total Trainers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-bold text-uppercase">
                  Trainers
                </span>
                <h3 className="fw-bold text-neon mb-0 mt-1">{totalTrainers}</h3>
              </div>
              <div className="icon-glow-box">
                <i className="bi bi-person-badge-fill fs-4"></i>
              </div>
            </div>
            <div className="mt-3 small text-muted">
              Certified Staff &bull; {totalEquipment} Machine Types
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-bold text-uppercase">
                  Revenue (INR)
                </span>
                <h3 className="fw-bold text-warning mb-0 mt-1">
                  {formatINR(totalRevenue)}
                </h3>
              </div>
              <div className="icon-glow-box text-warning">
                <i className="bi bi-currency-rupee fs-4"></i>
              </div>
            </div>
            <div className="mt-3 small text-muted">Total collected revenue</div>
          </div>
        </div>
      </div>

      {/* Expiring Memberships Card Alert */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-header bg-transparent border-0 pt-3 px-4 d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0 text-danger d-flex align-items-center gap-2">
            <i className="bi bi-clock-history"></i>
            <span>
              Expiring Memberships This Week ({expiringThisWeek.length})
            </span>
          </h5>
          <Link
            to="/members"
            className="btn btn-outline-danger btn-sm rounded-pill"
          >
            View All Members
          </Link>
        </div>
        <div className="card-body px-4 pb-4">
          {expiringThisWeek.length === 0 ? (
            <p className="text-muted mb-0">
              No memberships are expiring within the next 7 days. Great job!
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Plan</th>
                    <th>Contact Phone</th>
                    <th>Expiry Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringThisWeek.map((m) => (
                    <tr key={m.id}>
                      <td className="fw-bold">{m.name}</td>
                      <td>
                        <span className="badge plan-badge px-3 py-2 rounded-pill">
                          {m.planName}
                        </span>
                      </td>
                      <td>{m.phone}</td>
                      <td className="text-danger fw-bold">{m.expiryDate}</td>
                      <td>
                        <Link
                          to="/members"
                          className="btn btn-sm btn-glow rounded-pill px-3"
                        >
                          Renew Plan
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lower Grids: Recent Payments & Plans Summary */}
      <div className="row g-4">
        {/* Recent Payments */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-cash-stack text-success"></i>
                <span>Recent Payments</span>
              </h5>
              <Link
                to="/payments"
                className="btn btn-link text-decoration-none btn-sm fw-bold text-neon"
              >
                See All
              </Link>
            </div>
            <div className="card-body px-4 pb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-3">
                          No recent payments recorded.
                        </td>
                      </tr>
                    ) : (
                      recentPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold">
                            {p.memberName || `Member #${p.memberId}`}
                          </td>
                          <td className="fw-bold text-success">
                            {formatINR(p.amount)}
                          </td>
                          <td className="small text-body-secondary">
                            {p.date || "N/A"}
                          </td>
                          <td className="small text-muted">
                            {p.paymentMethod}
                          </td>
                          <td>
                            <span
                              className={`badge ${p.status === "Paid" ? "bg-success" : "bg-warning text-dark"}`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Plans Overview */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-card-checklist text-primary"></i>
                <span>Active Plans</span>
              </h5>
              <Link
                to="/plans"
                className="btn btn-link text-decoration-none btn-sm fw-bold text-neon"
              >
                Manage
              </Link>
            </div>
            <div className="card-body px-4 pb-4">
              <div
                className="d-flex flex-column gap-3 overflow-auto pe-1"
                style={{ maxHeight: "360px" }}
              >
                {sortedPlans.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 border rounded-4 d-flex align-items-center justify-content-between bg-body-tertiary"
                  >
                    <div>
                      <h6 className="fw-bold mb-1">{p.name}</h6>
                      <div className="small text-muted">{p.duration}</div>
                    </div>
                    <div className="fw-bold text-neon fs-5">
                      {formatINR(p.price)}
                    </div>
                  </div>
                ))}
                {sortedPlans.length === 0 && (
                  <p className="text-muted">No plans added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
