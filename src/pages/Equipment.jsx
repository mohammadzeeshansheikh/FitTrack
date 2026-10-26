import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import Modal from "../components/Modal";
import {
  formatDateDDMMYYYY,
  toISODateString,
  fromISODateString,
} from "../utils/formatters";

const Equipment = () => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    condition: "Excellent",
    lastMaintenance: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/equipment");
      setEquipmentList(res.data || []);
    } catch (err) {
      toast.error("Failed to load equipment list: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      quantity: 1,
      condition: "Excellent",
      lastMaintenance: formatDateDDMMYYYY(new Date()),
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || "",
      quantity: item.quantity || 1,
      condition: item.condition || "Excellent",
      lastMaintenance: item.lastMaintenance || "",
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Equipment name is required";
    if (
      formData.quantity === "" ||
      formData.quantity === null ||
      formData.quantity === undefined
    ) {
      errors.quantity = "Quantity is required";
    } else if (Number(formData.quantity) < 0) {
      errors.quantity = "Quantity cannot be less than 0";
    } else if (Number(formData.quantity) > 10) {
      errors.quantity = "Quantity cannot exceed 10 units";
    }
    if (!formData.lastMaintenance.trim())
      errors.lastMaintenance = "Maintenance date is required";

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
        quantity: Number(formData.quantity),
      };

      if (selectedItem) {
        const res = await axiosInstance.put(
          `/equipment/${selectedItem.id}`,
          payload,
        );
        setEquipmentList((prev) =>
          prev.map((e) => (e.id === selectedItem.id ? res.data : e)),
        );
        toast.success(`Equipment "${payload.name}" updated!`);
      } else {
        const res = await axiosInstance.post("/equipment", payload);
        setEquipmentList((prev) => [...prev, res.data]);
        toast.success(`New equipment "${payload.name}" added!`);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error("Failed to save equipment: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!itemToDelete) return;
    try {
      await axiosInstance.delete(`/equipment/${itemToDelete.id}`);
      setEquipmentList((prev) => prev.filter((e) => e.id !== itemToDelete.id));
      toast.success(`Equipment "${itemToDelete.name}" deleted.`);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete equipment: " + (err.message || ""));
    }
  };

  const filteredItems = equipmentList.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCondition =
      conditionFilter === "All" || item.condition === conditionFilter;
    return matchesSearch && matchesCondition;
  });

  return (
    <div className="equipment-page">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-body mb-1">Gym Equipment & Machinery</h2>
          <p className="text-secondary mb-0">
            Track workout machines, stock quantity, and maintenance status
          </p>
        </div>
        <button
          className="btn btn-primary rounded-3 fw-bold d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-plus-circle-fill fs-5"></i>
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Filter */}
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
                  placeholder="Search equipment by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select bg-body"
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
              >
                <option value="All">All Conditions</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Needs Service">Needs Service</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-body-tertiary">
        <div className="card-body p-0">
          {loading ? (
            <div className="py-5 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading equipment...</span>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-5 text-center text-muted">
              <i className="bi bi-tools fs-1 opacity-50"></i>
              <p className="mt-2 mb-0 fw-semibold">
                No equipment found matching criteria.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-body-secondary border-bottom">
                  <tr>
                    <th className="ps-4">Item Name</th>
                    <th>Quantity</th>
                    <th>Condition</th>
                    <th>Last Maintenance</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-4 fw-bold">{item.name}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold">
                          {item.quantity} units
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.condition === "Excellent"
                              ? "bg-success"
                              : item.condition === "Good"
                                ? "bg-info"
                                : "bg-danger"
                          } rounded-pill`}
                        >
                          {item.condition}
                        </span>
                      </td>
                      <td>{item.lastMaintenance}</td>
                      <td className="text-end pe-4">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-2 me-2"
                            onClick={() => handleOpenEditModal(item)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm rounded-2"
                            onClick={() => handleOpenDeleteModal(item)}
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
          selectedItem ? "Edit Equipment Details" : "Add New Gym Equipment"
        }
      >
        <form onSubmit={handleSubmitForm} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Equipment Name *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
                placeholder="e.g. Commercial Treadmill X7"
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
                Quantity (0 - 10) *
              </label>
              <input
                type="number"
                min="0"
                max="10"
                className={`form-control ${formErrors.quantity ? "is-invalid" : ""}`}
                placeholder="0 to 10"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
              {formErrors.quantity && (
                <div className="invalid-feedback">{formErrors.quantity}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">Condition*</label>
              <select
                className="form-select"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Needs Service">Needs Service</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Last Maintenance Date*
              </label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                className={`form-control ${formErrors.lastMaintenance ? "is-invalid" : ""}`}
                value={toISODateString(formData.lastMaintenance)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastMaintenance: fromISODateString(e.target.value),
                  })
                }
              />
              {formErrors.lastMaintenance && (
                <div className="invalid-feedback">
                  {formErrors.lastMaintenance}
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
                : selectedItem
                  ? "Update Equipment"
                  : "Save Equipment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Equipment"
        size="sm"
      >
        <div className="text-center py-2">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
          <p className="mb-1">
            Are you sure you want to delete{" "}
            <strong>&quot;{itemToDelete?.name}&quot;</strong>?
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
            onClick={handleDeleteEquipment}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Equipment;
