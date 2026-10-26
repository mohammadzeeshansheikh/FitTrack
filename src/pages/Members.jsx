import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import Modal from "../components/Modal";
import {
  isValidIndianPhone,
  formatIndianPhone,
  formatDateDDMMYYYY,
  parseDDMMYYYYDate,
  toISODateString,
  fromISODateString,
  calculateExpiryDate,
  compressImage,
} from "../utils/formatters";

const Members = () => {
  const datePickerRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    planId: "",
    planName: "",
    joinedDate: "",
    expiryDate: "",
    status: "Active",
    image: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, plansRes] = await Promise.all([
        axiosInstance.get("/members"),
        axiosInstance.get("/plans"),
      ]);
      setMembers(membersRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      toast.error("Failed to load members data: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 120, 120, 0.7);
        setFormData((prev) => ({ ...prev, image: compressedDataUrl }));
      } catch (err) {
        toast.error("Failed to process image: " + (err.message || ""));
      }
    }
  };

  // Handle open Add Modal
  const handleOpenAddModal = () => {
    setSelectedMember(null);
    const todayFormatted = formatDateDDMMYYYY(new Date());
    const firstPlan = plans[0];
    const initialExpiry = calculateExpiryDate(
      todayFormatted,
      firstPlan?.duration || "1 Month",
    );
    setFormData({
      name: "",
      email: "",
      phone: "",
      planId: firstPlan?.id || "1",
      planName: firstPlan?.name || "Basic Starter",
      joinedDate: todayFormatted,
      expiryDate: initialExpiry,
      status: "Active",
      image: "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      planId: member.planId || "",
      planName: member.planName || "",
      joinedDate: member.joinedDate || "",
      expiryDate: member.expiryDate || "",
      status: member.status || "Active",
      image: member.image || "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handle open Delete Modal
  const handleOpenDeleteModal = (member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.trim().length > 20) {
      errors.name = "Full name cannot exceed 20 characters (max 20)";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(formData.email.trim())
    ) {
      errors.email = "Enter a valid email address (e.g. aarav@gmail.com)";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Indian mobile number is required";
    } else if (!isValidIndianPhone(formData.phone)) {
      errors.phone = "Enter a valid 10-digit Indian phone (+91 9XXXX XXXXX)";
    }

    if (!formData.joinedDate.trim())
      errors.joinedDate = "Join date is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const formattedPhone = formatIndianPhone(formData.phone);
      const selectedPlanObj = plans.find(
        (p) => String(p.id) === String(formData.planId),
      );
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formattedPhone,
        planName: selectedPlanObj ? selectedPlanObj.name : formData.planName,
      };

      if (selectedMember) {
        // Edit existing
        const res = await axiosInstance.put(
          `/members/${selectedMember.id}`,
          payload,
        );
        setMembers((prev) =>
          prev.map((m) => (m.id === selectedMember.id ? res.data : m)),
        );
        toast.success(`Member "${payload.name}" updated successfully!`);
      } else {
        // Create new with sequential numeric ID
        const maxId = members.reduce(
          (max, m) => Math.max(max, parseInt(m.id, 10) || 0),
          0,
        );
        const newId = String(maxId + 1);
        const res = await axiosInstance.post("/members", {
          ...payload,
          id: newId,
        });
        setMembers((prev) => [...prev, res.data]);
        toast.success(`New member "${payload.name}" added successfully!`);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error("Failed to save member: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete member
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await axiosInstance.delete(`/members/${memberToDelete.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      toast.success(`Member "${memberToDelete.name}" deleted.`);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete member: " + (err.message || ""));
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm);

    const matchesStatus = statusFilter === "All" || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isExpired = (dateStr) => {
    const expDate = parseDDMMYYYYDate(dateStr);
    if (!expDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today;
  };

  return (
    <div className="members-page">
      {/* Page Title & Add Button */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-body mb-1">Members Directory</h2>
          <p className="text-secondary mb-0">
            Manage gym memberships and contact details
          </p>
        </div>
        <button
          className="btn btn-primary rounded-3 fw-bold d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-person-plus-fill fs-5"></i>
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-body-tertiary">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-body border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-body border-start-0 ps-0"
                  placeholder="Search by name, email, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select bg-body"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table / List View */}
      <div className="card border-0 shadow-sm rounded-4 bg-body-tertiary">
        <div className="card-body p-0">
          {loading ? (
            <div className="py-5 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Fetching members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-5 text-center text-muted">
              <i className="bi bi-person-x fs-1 opacity-50"></i>
              <p className="mt-2 mb-0 fw-semibold">
                No members found matching criteria.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-body-secondary border-bottom">
                  <tr>
                    <th className="ps-4">Member Name</th>
                    <th>Email & Contact</th>
                    <th>Membership Plan</th>
                    <th>Join & Expiry Dates</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          {m.image ? (
                            <img
                              src={m.image}
                              alt={m.name}
                              className="rounded-circle border shadow-sm"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              className="bg-primary text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                              style={{ width: "40px", height: "40px" }}
                            >
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{m.name}</div>
                            <div className="small text-muted">ID: #{m.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-medium">{m.email}</div>
                        <div className="small text-muted">{m.phone}</div>
                      </td>
                      <td>
                        <span className="badge plan-badge px-3 py-2 rounded-pill">
                          {m.planName || "Standard"}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold small text-body mb-1">
                          <i className="bi bi-calendar-check text-primary me-1"></i>
                          Joined: <span>{m.joinedDate || "N/A"}</span>
                        </div>
                        <div className="small">
                          <i className="bi bi-calendar-x text-secondary me-1"></i>
                          Expires:{" "}
                          <span
                            className={`badge ${
                              isExpired(m.expiryDate)
                                ? "bg-danger text-white"
                                : "bg-success bg-opacity-10 text-success border border-success-subtle"
                            } fw-bold ms-1`}
                          >
                            {m.expiryDate || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            m.status === "Active"
                              ? "bg-success"
                              : "bg-secondary"
                          } px-3 py-2 rounded-pill`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-2 me-2"
                            title="Edit Member"
                            onClick={() => handleOpenEditModal(m)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm rounded-2"
                            title="Delete Member"
                            onClick={() => handleOpenDeleteModal(m)}
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

      {/* Form Modal (Add / Edit) */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedMember ? "Edit Member Details" : "Add New Gym Member"}
        size="lg"
      >
        <form onSubmit={handleSubmitForm} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Full Name (Max 20 chars) *
              </label>
              <input
                type="text"
                maxLength={20}
                className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                placeholder="e.g. Aarav Patel"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <div className="form-text small text-muted">
                {formData.name.length}/20 characters
              </div>
              {formErrors.name && (
                <div className="invalid-feedback">{formErrors.name}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Email Address *
              </label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                placeholder="e.g. aarav.patel@gmail.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              {formErrors.email && (
                <div className="invalid-feedback">{formErrors.email}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Indian Mobile Number * (+91)
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
                placeholder="+91 98200 12345"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              {formErrors.phone && (
                <div className="invalid-feedback">{formErrors.phone}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Membership Plan
              </label>
              <select
                className="form-select"
                value={formData.planId}
                onChange={(e) => {
                  const pId = e.target.value;
                  const pObj = plans.find((p) => String(p.id) === String(pId));
                  const newExpiry = calculateExpiryDate(
                    formData.joinedDate,
                    pObj?.duration || "1 Month",
                  );
                  setFormData({
                    ...formData,
                    planId: pId,
                    planName: pObj ? pObj.name : "",
                    expiryDate: newExpiry,
                  });
                }}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} (₹{plan.price})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Plan Start / Join Date (DD/MM/YYYY) *
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className={`form-control ${formErrors.joinedDate ? "is-invalid" : ""}`}
                  placeholder="DD/MM/YYYY"
                  value={formData.joinedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const selectedPlanObj = plans.find(
                      (p) => String(p.id) === String(formData.planId),
                    );
                    const newExpiry = calculateExpiryDate(
                      val,
                      selectedPlanObj?.duration || "1 Month",
                    );
                    setFormData({
                      ...formData,
                      joinedDate: val,
                      expiryDate: newExpiry,
                    });
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
                  title="Open Calendar Picker"
                  onClick={() => {
                    if (datePickerRef.current) {
                      if (
                        typeof datePickerRef.current.showPicker === "function"
                      ) {
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
                  value={toISODateString(formData.joinedDate)}
                  onChange={(e) => {
                    const formattedJoined = fromISODateString(e.target.value);
                    const selectedPlanObj = plans.find(
                      (p) => String(p.id) === String(formData.planId),
                    );
                    const newExpiry = calculateExpiryDate(
                      formattedJoined,
                      selectedPlanObj?.duration || "1 Month",
                    );
                    setFormData({
                      ...formData,
                      joinedDate: formattedJoined,
                      expiryDate: newExpiry,
                    });
                  }}
                />
              </div>
              {formErrors.joinedDate && (
                <div className="invalid-feedback d-block">
                  {formErrors.joinedDate}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Plan Expiry Date*
              </label>
              <input
                type="text"
                readOnly
                className="form-control bg-body-secondary fw-semibold text-success"
                value={formData.expiryDate || ""}
                title="Expiry date is automatically calculated based on selected membership plan duration"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small">
                Profile Image (Select from device)
              </label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleImageChange}
              />
              {formData.image && (
                <div className="mt-2 d-flex align-items-center gap-2">
                  <img
                    src={formData.image}
                    alt="Member Preview"
                    className="rounded-circle border shadow-sm"
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image: "" }))
                    }
                  >
                    Remove Image
                  </button>
                </div>
              )}
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
                : selectedMember
                  ? "Update Member"
                  : "Save Member"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Member"
        size="sm"
      >
        <div className="text-center py-2">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
          <p className="mb-1">
            Are you sure you want to delete member{" "}
            <strong>&quot;{memberToDelete?.name}&quot;</strong>?
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
            onClick={handleDeleteMember}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Members;
