import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import Modal from "../components/Modal";
import { formatINR } from "../utils/formatters";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    duration: "1 Month",
    price: "",
    features: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/plans");
      setPlans(res.data || []);
    } catch (err) {
      toast.error("Failed to load membership plans: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedPlan(null);
    setFormData({
      name: "",
      duration: "1 Month",
      price: "",
      features: "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || "",
      duration: plan.duration || "1 Month",
      price: plan.price || "",
      features: plan.features || "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Plan name is required";
    if (!formData.duration.trim()) errors.duration = "Duration is required";
    const priceNum = Number(formData.price);
    if (!formData.price || isNaN(priceNum)) {
      errors.price = "Enter a valid price in Rupees (₹)";
    } else if (priceNum < 1000) {
      errors.price = "Plan price must be at least ₹1,000 (minimum ₹1,000)";
    } else if (priceNum > 30000) {
      errors.price = "Plan price cannot exceed ₹20,000 (maximum ₹20,000)";
    }
    if (!formData.features.trim())
      errors.features = "Features list is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        price: Number(formData.price),
        features: formData.features.trim(),
      };

      if (selectedPlan) {
        const res = await axiosInstance.put(
          `/plans/${selectedPlan.id}`,
          payload,
        );
        setPlans((prev) =>
          prev.map((p) => (p.id === selectedPlan.id ? res.data : p)),
        );
        toast.success(`Membership plan "${payload.name}" updated!`);
      } else {
        const res = await axiosInstance.post("/plans", payload);
        setPlans((prev) => [...prev, res.data]);
        toast.success(`New plan "${payload.name}" created!`);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error("Failed to save plan: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await axiosInstance.delete(`/plans/${planToDelete.id}`);
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
      toast.success(`Plan "${planToDelete.name}" deleted.`);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete plan: " + (err.message || ""));
    }
  };

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
    <div className="plans-page">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-body mb-1">Membership Plans</h2>
          <p className="text-secondary mb-0">
            Configure pricing packages, durations, and included gym features (in
            ₹)
          </p>
        </div>
        <button
          className="btn btn-primary rounded-3 fw-bold d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-plus-circle-fill fs-5"></i>
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading plans...</span>
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 py-5 text-center text-muted bg-body-tertiary">
          <i className="bi bi-card-checklist fs-1 opacity-50"></i>
          <p className="mt-2 mb-0 fw-semibold">No membership plans found.</p>
        </div>
      ) : (
        <div className="row g-4">
          {sortedPlans.map((plan) => {
            const featureItems =
              typeof plan.features === "string"
                ? plan.features.split(",").map((f) => f.trim())
                : Array.isArray(plan.features)
                  ? plan.features
                  : [];

            return (
              <div className="col-12 col-md-6 col-lg-3" key={plan.id}>
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-body-tertiary d-flex flex-column justify-content-between">
                  <div className="card-body p-4">
                    <div className="text-center pb-3 border-bottom mb-3">
                      <h5 className="fw-bold text-primary mb-1">{plan.name}</h5>
                      <span className="badge bg-secondary bg-opacity-10 text-body fw-semibold px-3 py-1 rounded-pill">
                        {plan.duration}
                      </span>
                      <div className="mt-3">
                        <span className="display-6 fw-bold text-body">
                          {formatINR(plan.price)}
                        </span>
                      </div>
                    </div>

                    <h6 className="fw-bold small text-uppercase text-secondary mb-2">
                      Included Features:
                    </h6>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                      {featureItems.map((feat, idx) => (
                        <li
                          key={idx}
                          className="d-flex align-items-start gap-2"
                        >
                          <i className="bi bi-check-circle-fill text-success flex-shrink-0 mt-1"></i>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="card-footer bg-transparent border-top p-3 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-2 px-3"
                      onClick={() => handleOpenEditModal(plan)}
                    >
                      <i className="bi bi-pencil-fill me-1"></i> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm rounded-2 px-3"
                      onClick={() => handleOpenDeleteModal(plan)}
                    >
                      <i className="bi bi-trash-fill me-1"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          selectedPlan ? "Edit Membership Plan" : "Create New Membership Plan"
        }
      >
        <form onSubmit={handleSubmitForm} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Plan Name *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                placeholder="e.g. Pro Fitness"
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
              <label className="form-label fw-semibold small">Duration *</label>
              <select
                className="form-select"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
              >
                <option value="1 Month">1 Month</option>
                <option value="2 Months">2 Months</option>
                <option value="3 Months">3 Months</option>
                <option value="4 Months">4 Months</option>
                <option value="5 Months">5 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="7 Months">7 Months</option>
                <option value="8 Months">8 Months</option>
                <option value="9 Months">9 Months</option>
                <option value="10 Months">10 Months</option>
                <option value="11 Months">11 Months</option>
                <option value="12 Months">12 Months (Annual)</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Price in ₹ (INR)*
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1"
                className={`form-control ${formErrors.price ? "is-invalid" : ""}`}
                placeholder="e.g. 1000 (min ₹1,000 · max ₹30,000)"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
              {formErrors.price && (
                <div className="invalid-feedback">{formErrors.price}</div>
              )}
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold small">
                Features List*
              </label>
              <textarea
                rows="3"
                className={`form-control ${formErrors.features ? "is-invalid" : ""}`}
                placeholder="Full Gym Floor Access, Locker Room, Free Wi-Fi"
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
              ></textarea>
              {formErrors.features && (
                <div className="invalid-feedback">{formErrors.features}</div>
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
                : selectedPlan
                  ? "Update Plan"
                  : "Save Plan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Plan"
        size="sm"
      >
        <div className="text-center py-2">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
          <p className="mb-1">
            Are you sure you want to delete plan{" "}
            <strong>&quot;{planToDelete?.name}&quot;</strong>?
          </p>
          <p className="text-muted small">
            Members on this plan will retain their current subscription.
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
            onClick={handleDeletePlan}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Plans;
