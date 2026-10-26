import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import Modal from "../components/Modal";
import {
  formatINR,
  formatDateDDMMYYYY,
  parseDDMMYYYYDate,
  toISODateString,
  fromISODateString,
  calculateExpiryDate,
} from "../utils/formatters";

const Payments = () => {
  const datePickerRef = useRef(null);
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    memberId: "",
    memberName: "",
    planName: "",
    amount: "",
    date: "",
    status: "Paid",
    paymentMethod: "UPI (GPay)",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, membersRes, plansRes] = await Promise.all([
        axiosInstance.get("/payments"),
        axiosInstance.get("/members"),
        axiosInstance.get("/plans"),
      ]);
      setPayments(paymentsRes.data || []);
      setMembers(membersRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      toast.error("Failed to load payments history: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedPayment(null);
    const firstMember = members[0];
    const firstPlan = plans[0];
    const initialPlanPrice = firstPlan ? firstPlan.price : 5999;
    setFormData({
      memberId: firstMember?.id || "1",
      memberName: firstMember?.name || "",
      planName: firstPlan?.name || "Pro Fitness",
      amount: initialPlanPrice,
      date: formatDateDDMMYYYY(new Date()),
      status: "Paid",
      paymentMethod: "UPI (GPay)",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (payment) => {
    setSelectedPayment(payment);
    const matchedPlan = plans.find((p) => p.name === payment.planName);
    const amountVal = matchedPlan ? matchedPlan.price : payment.amount;
    setFormData({
      memberId: payment.memberId || "",
      memberName: payment.memberName || "",
      planName: payment.planName || "",
      amount: amountVal || "",
      date: payment.date || formatDateDDMMYYYY(new Date()),
      status: payment.status || "Paid",
      paymentMethod: payment.paymentMethod || "UPI (GPay)",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.memberName.trim())
      errors.memberName = "Member selection or name is required";
    if (!formData.planName.trim())
      errors.planName = "Plan selection is required";

    // Amount must match selected plan price
    const selectedPlanObj = plans.find((p) => p.name === formData.planName);
    if (
      selectedPlanObj &&
      Number(formData.amount) !== Number(selectedPlanObj.price)
    ) {
      errors.amount = `Payment amount must match the selected plan price (₹${selectedPlanObj.price})`;
    } else if (
      !formData.amount ||
      isNaN(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      errors.amount = "Enter a valid amount in ₹";
    }

    if (!formData.date.trim()) errors.date = "Payment date is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const selectedPlanObj = plans.find((p) => p.name === formData.planName);
      const exactAmount = selectedPlanObj
        ? Number(selectedPlanObj.price)
        : Number(formData.amount);

      const payload = {
        ...formData,
        amount: exactAmount,
        memberName: formData.memberName.trim(),
        planName: formData.planName.trim(),
      };

      let memberSyncSuccess = false;
      // Sync changes to the member record in /members database
      if (formData.memberId) {
        const calculatedExpiry = calculateExpiryDate(
          formData.date,
          selectedPlanObj ? selectedPlanObj.duration : '1 Month'
        );

        const memberPayload = {
          name: formData.memberName.trim(),
          planName: formData.planName.trim(),
          joinedDate: formData.date,
          expiryDate: calculatedExpiry,
          ...(selectedPlanObj ? { planId: String(selectedPlanObj.id) } : {})
        };
        try {
          await axiosInstance.patch(`/members/${formData.memberId}`, memberPayload);
          setMembers((prev) =>
            prev.map((m) =>
              String(m.id) === String(formData.memberId)
                ? { ...m, ...memberPayload }
                : m
            )
          );
          memberSyncSuccess = true;
        } catch (mErr) {
          console.error('Failed to sync update to members section:', mErr);
        }
      }

      if (selectedPayment) {
        const res = await axiosInstance.put(
          `/payments/${selectedPayment.id}`,
          payload,
        );
        setPayments((prev) =>
          prev.map((p) => (p.id === selectedPayment.id ? res.data : p)),
        );
        toast.success(
          memberSyncSuccess
            ? `Payment record updated & member section synced!`
            : `Payment record updated!`
        );
      } else {
        const maxId = payments.reduce(
          (max, p) => Math.max(max, parseInt(p.id, 10) || 0),
          0,
        );
        const newId = String(maxId + 1);
        const res = await axiosInstance.post("/payments", {
          ...payload,
          id: newId,
        });
        setPayments((prev) => [...prev, res.data]);
        toast.success(
          memberSyncSuccess
            ? `New payment created & member section synced!`
            : `New payment record created!`,
        );
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error("Failed to save payment record: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      await axiosInstance.delete(`/payments/${paymentToDelete.id}`);
      setPayments((prev) => prev.filter((p) => p.id !== paymentToDelete.id));
      toast.success("Payment record deleted.");
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete payment record: " + (err.message || ""));
    }
  };

  const filteredPayments = payments
    .map((p, idx) => ({ ...p, _originalIdx: idx }))
    .filter((p) => {
      const nameStr = p.memberName || `Member #${p.memberId}`;
      const matchesSearch =
        nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesMethod =
        methodFilter === "All" || p.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    })
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
    });

  return (
    <div className="payments-page">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-body mb-1">Fee & Payment Records</h2>
          <p className="text-secondary mb-0">
            Track fee collections, payment methods, and transaction receipts (in
            ₹)
          </p>
        </div>
        <button
          className="btn btn-primary rounded-3 fw-bold d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-cash-coin fs-5"></i>
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-body-tertiary">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-body border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-body border-start-0 ps-0"
                  placeholder="Search payments by member, plan, or method..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select bg-body"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select bg-body"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="All">All Methods</option>
                <option value="UPI (GPay)">UPI (GPay)</option>
                <option value="UPI (PhonePe)">UPI (PhonePe)</option>
                <option value="Credit Card (HDFC)">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking (SBI)">Net Banking</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="card border-0 shadow-sm rounded-4 bg-body-tertiary">
        <div className="card-body p-0">
          {loading ? (
            <div className="py-5 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading payments...</span>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-5 text-center text-muted">
              <i className="bi bi-receipt fs-1 opacity-50"></i>
              <p className="mt-2 mb-0 fw-semibold">No payment records found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-body-secondary border-bottom">
                  <tr>
                    <th className="ps-4">Transaction ID</th>
                    <th>Member Name</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="ps-4 font-monospace text-muted small">
                        #TXN-{p.id}
                      </td>
                      <td className="fw-bold">
                        {p.memberName || `Member #${p.memberId}`}
                      </td>
                      <td>
                        <span className="badge plan-badge px-3 py-2 rounded-pill">
                          {p.planName}
                        </span>
                      </td>
                      <td className="fw-bold text-success fs-6">
                        {formatINR(p.amount)}
                      </td>
                      <td>{p.date}</td>
                      <td>
                        <span className="badge bg-body-secondary text-body fw-normal border">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${p.status === "Paid" ? "bg-success" : "bg-warning text-dark"} rounded-pill`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm me-2 rounded-2"
                            title="Edit Payment"
                            onClick={() => handleOpenEditModal(p)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm rounded-2"
                            title="Delete Payment"
                            onClick={() => handleOpenDeleteModal(p)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          selectedPayment ? "Edit Payment Record" : "Record New Gym Fee Payment"
        }
      >
        <form onSubmit={handleSubmitForm} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Select Member *
              </label>
              <select
                className="form-select"
                value={formData.memberId}
                onChange={(e) => {
                  const mId = e.target.value;
                  const mObj = members.find(
                    (m) => String(m.id) === String(mId),
                  );
                  const matchedPlan = mObj
                    ? plans.find((p) => p.name === mObj.planName || String(p.id) === String(mObj.planId))
                    : null;
                  setFormData({
                    ...formData,
                    memberId: mId,
                    memberName: mObj ? mObj.name : formData.memberName,
                    planName: mObj && mObj.planName ? mObj.planName : formData.planName,
                    amount: matchedPlan ? matchedPlan.price : formData.amount,
                  });
                }}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Member Name *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.memberName ? "is-invalid" : ""}`}
                value={formData.memberName}
                onChange={(e) =>
                  setFormData({ ...formData, memberName: e.target.value })
                }
              />
              {formErrors.memberName && (
                <div className="invalid-feedback">{formErrors.memberName}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Selected Membership Plan *
              </label>
              <select
                className="form-select"
                value={formData.planName}
                onChange={(e) => {
                  const pName = e.target.value;
                  const pObj = plans.find((p) => p.name === pName);
                  setFormData({
                    ...formData,
                    planName: pName,
                    amount: pObj ? pObj.price : formData.amount,
                  });
                }}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} (₹{p.price})
                  </option>
                ))}
              </select>
              {formErrors.planName && (
                <div className="invalid-feedback">{formErrors.planName}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Amount Paid (₹)*
              </label>
              <input
                type="number"
                readOnly
                className={`form-control bg-body-secondary ${formErrors.amount ? "is-invalid" : ""}`}
                value={formData.amount}
                title="Amount is automatically matched to the selected membership plan price"
              />
              {formErrors.amount && (
                <div className="invalid-feedback">{formErrors.amount}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Payment Date (DD/MM/YYYY) *
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className={`form-control ${formErrors.date ? "is-invalid" : ""}`}
                  placeholder="DD/MM/YYYY"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
                  title="Open Calendar Picker"
                  onClick={() => {
                    if (datePickerRef.current) {
                      if (typeof datePickerRef.current.showPicker === "function") {
                        datePickerRef.current.showPicker();
                      } else {
                        datePickerRef.current.click();
                      }
                    }
                  }}
                >
                  <i className="bi bi-calendar3"></i>
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  tabIndex={-1}
                  max={new Date().toISOString().split("T")[0]}
                  className="position-absolute opacity-0 pointer-events-none"
                  style={{ width: 0, height: 0, bottom: 0, right: 0 }}
                  value={toISODateString(formData.date)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: fromISODateString(e.target.value),
                    })
                  }
                />
              </div>
              {formErrors.date && (
                <div className="invalid-feedback d-block">{formErrors.date}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Payment Method*
              </label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              >
                <option value="UPI (GPay)">UPI (GPay)</option>
                <option value="UPI (PhonePe)">UPI (PhonePe)</option>
                <option value="Credit Card (HDFC)">Credit Card (HDFC)</option>
                <option value="Net Banking (SBI)">Net Banking (SBI)</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">Status*</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary fw-bold px-4"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : selectedPayment
                  ? "Update Record"
                  : "Save Payment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Payment"
        size="sm"
      >
        <div className="text-center py-2">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
          <p className="mb-1">
            Are you sure you want to delete this payment record?
          </p>
          <p className="text-muted small">This action cannot be undone.</p>
        </div>
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger fw-bold"
            onClick={handleDeletePayment}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Payments;
