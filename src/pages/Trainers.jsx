import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import Modal from "../components/Modal";
import { isValidIndianPhone, formatIndianPhone } from "../utils/formatters";

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerToDelete, setTrainerToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    contact: "",
    email: "",
    assignedMembers: 0,
    experienceYears: 3,
    image: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/trainers");
      setTrainers(res.data || []);
    } catch (err) {
      toast.error("Failed to load trainers list: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to parse numeric years from string like "8 Years"
  const parseExperienceYears = (expStr) => {
    if (!expStr) return 0;
    const num = parseInt(expStr, 10);
    return isNaN(num) ? 0 : Math.min(Math.max(num, 1), 50);
  };

  const handleOpenAddModal = () => {
    setSelectedTrainer(null);
    setFormData({
      name: "",
      specialization: "",
      contact: "",
      email: "",
      assignedMembers: 0,
      experienceYears: 0,
      image: "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (trainer) => {
    setSelectedTrainer(trainer);
    setFormData({
      name: trainer.name || "",
      specialization: trainer.specialization || "",
      contact: trainer.contact || "",
      email: trainer.email || "",
      assignedMembers: trainer.assignedMembers || 0,
      experienceYears: parseExperienceYears(trainer.experience),
      image: trainer.image || "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (trainer) => {
    setTrainerToDelete(trainer);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Trainer name is required";
    if (!formData.specialization.trim())
      errors.specialization = "Specialization is required";

    if (!formData.contact.trim()) {
      errors.contact = "Indian contact number is required";
    } else if (!isValidIndianPhone(formData.contact)) {
      errors.contact = "Enter a valid 10-digit Indian mobile number (+91)";
    }

    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(formData.email.trim())
    ) {
      errors.email = "Enter a valid email address (e.g. rahul.d@fittrack.in)";
    }

    // Assigned Members Validation (Limit: Max 20)
    const membersCount = Number(formData.assignedMembers);
    if (isNaN(membersCount) || membersCount < 0) {
      errors.assignedMembers = "Assigned members cannot be negative";
    } else if (membersCount > 20) {
      errors.assignedMembers =
        "Trainers must have a maximum limit of 20 members only";
    }

    // Experience Validation (Limit: Min 1 year, Max 50 years)
    const expNum = Number(formData.experienceYears);
    if (isNaN(expNum) || expNum < 1) {
      errors.experienceYears =
        "Experience must be at least 1 year (minimum 1 year)";
    } else if (expNum > 50) {
      errors.experienceYears =
        "Experience cannot exceed 50 years (maximum 50 years)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const expYears = Number(formData.experienceYears);
      const payload = {
        name: formData.name.trim(),
        specialization: formData.specialization.trim(),
        contact: formatIndianPhone(formData.contact),
        email: formData.email.trim(),
        assignedMembers: Number(formData.assignedMembers) || 0,
        experience: `${expYears} ${expYears === 1 ? "Year" : "Years"}`,
        image: formData.image || "",
      };

      if (selectedTrainer) {
        const res = await axiosInstance.put(
          `/trainers/${selectedTrainer.id}`,
          payload,
        );
        setTrainers((prev) =>
          prev.map((t) => (t.id === selectedTrainer.id ? res.data : t)),
        );
        toast.success(`Trainer "${payload.name}" updated successfully!`);
      } else {
        const res = await axiosInstance.post("/trainers", payload);
        setTrainers((prev) => [...prev, res.data]);
        toast.success(`New trainer "${payload.name}" added successfully!`);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error("Failed to save trainer: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;
    try {
      await axiosInstance.delete(`/trainers/${trainerToDelete.id}`);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));
      toast.success(`Trainer "${trainerToDelete.name}" removed.`);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete trainer: " + (err.message || ""));
    }
  };

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contact.includes(searchTerm),
  );

  return (
    <div className="trainers-page">
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-body mb-1">Fitness Trainers</h2>
          <p className="text-secondary mb-0">
            Manage certified coaches (Max 20 members limit, 1-50 years
            experience)
          </p>
        </div>
        <button
          className="btn btn-primary rounded-3 fw-bold d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-person-plus-fill fs-5"></i>
          <span>Add Trainer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-body-tertiary">
        <div className="card-body p-3 p-md-4">
          <div className="input-group">
            <span className="input-group-text bg-body border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control bg-body border-start-0 ps-0"
              placeholder="Search trainers by name, specialization, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Trainers Cards / List */}
      {loading ? (
        <div className="py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading trainers...</span>
          </div>
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 py-5 text-center text-muted bg-body-tertiary">
          <i className="bi bi-person-badge fs-1 opacity-50"></i>
          <p className="mt-2 mb-0 fw-semibold">
            No trainers found matching criteria.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredTrainers.map((trainer) => (
            <div className="col-12 col-md-6 col-xl-4" key={trainer.id}>
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-body-tertiary position-relative overflow-hidden">
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      {trainer.image ? (
                        <img
                          src={trainer.image}
                          alt={trainer.name}
                          className="rounded-circle border shadow-sm"
                          style={{
                            width: "54px",
                            height: "54px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4 shadow-sm"
                          style={{ width: "54px", height: "54px" }}
                        >
                          {trainer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h5 className="fw-bold mb-0 text-body">
                          {trainer.name}
                        </h5>
                        <span className="badge bg-info bg-opacity-10 text-info fw-semibold mt-1">
                          {trainer.experience || "3 Years"}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-secondary small fw-bold text-uppercase d-block mb-1">
                        Specialization
                      </span>
                      <p className="fw-semibold text-body mb-0 small">
                        {trainer.specialization}
                      </p>
                    </div>

                    <div className="row g-2 pt-2 border-top small text-muted">
                      <div className="col-6">
                        <i className="bi bi-telephone-fill me-1 text-primary"></i>
                        <span>{trainer.contact}</span>
                      </div>
                      <div className="col-6 text-end">
                        <i className="bi bi-people-fill me-1 text-success"></i>
                        <span
                          className={`fw-bold ${trainer.assignedMembers >= 20 ? "text-danger" : "text-body"}`}
                        >
                          {trainer.assignedMembers}/20
                        </span>{" "}
                        Members
                      </div>
                      {trainer.email && (
                        <div className="col-12 text-truncate">
                          <i className="bi bi-envelope-fill me-1 text-secondary"></i>
                          <span>{trainer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-2 px-3"
                      onClick={() => handleOpenEditModal(trainer)}
                    >
                      <i className="bi bi-pencil-fill me-1"></i> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm rounded-2 px-3"
                      onClick={() => handleOpenDeleteModal(trainer)}
                    >
                      <i className="bi bi-trash-fill me-1"></i> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          selectedTrainer ? "Edit Trainer Profile" : "Add New Certified Trainer"
        }
      >
        <form onSubmit={handleSubmitForm} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Trainer Full Name *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                placeholder="e.g. Rahul Dravid"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              {formErrors.name && (
                <div className="invalid-feedback">{formErrors.name}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Specialization *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.specialization ? "is-invalid" : ""}`}
                placeholder="e.g. Strength & Conditioning"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
              />
              {formErrors.specialization && (
                <div className="invalid-feedback">
                  {formErrors.specialization}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Contact Number (+91) *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.contact ? "is-invalid" : ""}`}
                placeholder="+91 98111 22334"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
              />
              {formErrors.contact && (
                <div className="invalid-feedback">{formErrors.contact}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Email Address *
              </label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
                placeholder="rahul.d@fittrack.in"
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
                Experience (1 - 50 Years) *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className={`form-control ${formErrors.experienceYears ? "is-invalid" : ""}`}
                placeholder="Years (1 to 50)"
                value={formData.experienceYears}
                onChange={(e) =>
                  setFormData({ ...formData, experienceYears: e.target.value })
                }
              />
              {formErrors.experienceYears && (
                <div className="invalid-feedback">
                  {formErrors.experienceYears}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Assigned Members Count
              </label>
              <input
                type="number"
                min="0"
                max="20"
                className={`form-control ${formErrors.assignedMembers ? "is-invalid" : ""}`}
                placeholder="0 - 20 members"
                value={formData.assignedMembers}
                onChange={(e) =>
                  setFormData({ ...formData, assignedMembers: e.target.value })
                }
              />
              {formErrors.assignedMembers && (
                <div className="invalid-feedback">
                  {formErrors.assignedMembers}
                </div>
              )}
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
                    alt="Trainer Preview"
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
                : selectedTrainer
                  ? "Update Trainer"
                  : "Save Trainer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Remove Trainer"
        size="sm"
      >
        <div className="text-center py-2">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
          <p className="mb-1">
            Are you sure you want to remove{" "}
            <strong>&quot;{trainerToDelete?.name}&quot;</strong>?
          </p>
          <p className="text-muted small">
            Assigned member references will need reassignment.
          </p>
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
            onClick={handleDeleteTrainer}
          >
            Yes, Remove
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Trainers;
