import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import Modal from "../components/Modal";

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDay, setSelectedDay] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Form State (Add / Edit Session)
  const [formData, setFormData] = useState({
    title: "",
    trainerId: "",
    trainerName: "",
    day: "Monday",
    startTime: "07:00",
    endTime: "08:00",
    capacity: 10,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Booking Form State
  const [bookingMemberId, setBookingMemberId] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, trainersRes, membersRes] = await Promise.all([
        axiosInstance.get("/sessions"),
        axiosInstance.get("/trainers"),
        axiosInstance.get("/members"),
      ]);
      setSessions(sessionsRes.data || []);
      setTrainers(trainersRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      toast.error("Failed to load training sessions: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // Duration in minutes helper
  const calculateDurationInMinutes = (startTimeStr, endTimeStr) => {
    if (!startTimeStr || !endTimeStr) return 0;
    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    return endTotal - startTotal;
  };

  // Convert 24h format HH:MM to 12h format e.g. 07:00 AM
  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${mStr} ${period}`;
  };

  // Parse existing session "time" string like "07:00 AM - 08:00 AM" back into HH:MM
  const parseTimeSlotTo24 = (timeSlotStr) => {
    if (!timeSlotStr || !timeSlotStr.includes("-")) {
      return { startTime: "07:00", endTime: "08:00" };
    }
    const parts = timeSlotStr.split("-").map((s) => s.trim());
    const convert12to24 = (str12) => {
      const match = str12.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return "07:00";
      let [_, hStr, mStr, period] = match;
      let h = parseInt(hStr, 10);
      if (period) {
        period = period.toUpperCase();
        if (period === "PM" && h < 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
      }
      return `${String(h).padStart(2, "0")}:${mStr}`;
    };

    return {
      startTime: convert12to24(parts[0]),
      endTime: convert12to24(parts[1] || parts[0]),
    };
  };

  const handleOpenAddModal = () => {
    setSelectedSession(null);
    const firstTrainer = trainers[0];
    setFormData({
      title: "",
      trainerId: firstTrainer?.id || "1",
      trainerName: firstTrainer?.name || "",
      day: "Monday",
      startTime: "07:00",
      endTime: "08:00",
      capacity: 10,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (session) => {
    setSelectedSession(session);
    const parsedTime = parseTimeSlotTo24(session.time);
    setFormData({
      title: session.title || "",
      trainerId: session.trainerId || "",
      trainerName: session.trainerName || "",
      day: session.day || "Monday",
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      capacity: session.capacity || 10,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (session) => {
    setSessionToDelete(session);
    setIsDeleteModalOpen(true);
  };

  const handleOpenBookingModal = (session) => {
    setSelectedSession(session);
    const availableMembers = members.filter(
      (m) =>
        !(session.bookedMembers || []).some(
          (bm) => String(bm.id) === String(m.id),
        ),
    );
    setBookingMemberId(availableMembers[0]?.id || "");
    setIsBookingModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Session title is required";
    if (!formData.trainerName.trim())
      errors.trainerName = "Trainer selection is required";

    if (!formData.startTime || !formData.endTime) {
      errors.time = "Both start time and end time are required";
    } else {
      const [startH, startM] = formData.startTime.split(":").map(Number);
      const [endH, endM] = formData.endTime.split(":").map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      const durationMins = endMins - startMins;

      const openMins = 6 * 60; // 06:00 AM (360 mins)
      const closeMins = 22 * 60; // 10:00 PM (1320 mins)

      if (startMins < openMins) {
        errors.time =
          "Start time cannot be earlier than gym opening time (06:00 AM)";
      } else if (endMins > closeMins) {
        errors.time =
          "End time cannot be later than gym closing time (10:00 PM)";
      } else if (durationMins <= 0) {
        errors.time = "End time must be after start time";
      } else if (durationMins < 60) {
        errors.time =
          "Session duration must be at least 1 hour (minimum 1 hour)";
      } else if (durationMins > 180) {
        errors.time =
          "Session duration cannot exceed 3 hours (maximum 3 hours)";
      }
    }

    if (!formData.capacity || Number(formData.capacity) <= 0) {
      errors.capacity = "Capacity must be at least 1 seat";
    } else if (Number(formData.capacity) > 20) {
      errors.capacity = "Capacity cannot exceed 20 seats";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const selectedTrainerObj = trainers.find(
        (t) => String(t.id) === String(formData.trainerId),
      );
      const formattedTime = `${formatTime12Hour(formData.startTime)} - ${formatTime12Hour(formData.endTime)}`;

      const payload = {
        title: formData.title.trim(),
        trainerId: formData.trainerId,
        trainerName: selectedTrainerObj
          ? selectedTrainerObj.name
          : formData.trainerName.trim(),
        day: formData.day,
        time: formattedTime,
        capacity: Number(formData.capacity),
        bookedMembers: selectedSession
          ? selectedSession.bookedMembers || []
          : [],
      };

      if (selectedSession) {
        const res = await axiosInstance.put(
          `/sessions/${selectedSession.id}`,
          payload,
        );
        setSessions((prev) =>
          prev.map((s) => (s.id === selectedSession.id ? res.data : s)),
        );
        toast.success(`Training session "${payload.title}" updated!`);
      } else {
        const res = await axiosInstance.post("/sessions", payload);
        setSessions((prev) => [...prev, res.data]);
        toast.success(`New training session "${payload.title}" created!`);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      toast.error("Failed to save training session: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookMember = async (e) => {
    e.preventDefault();
    if (!selectedSession || !bookingMemberId) return;

    const selectedMemberObj = members.find(
      (m) => String(m.id) === String(bookingMemberId),
    );
    if (!selectedMemberObj) {
      toast.error("Please select a valid member to book");
      return;
    }

    const currentBooked = selectedSession.bookedMembers || [];
    if (currentBooked.length >= selectedSession.capacity) {
      toast.error("This training session is fully booked!");
      return;
    }

    if (
      currentBooked.some((bm) => String(bm.id) === String(selectedMemberObj.id))
    ) {
      toast.error("Member is already booked for this session");
      return;
    }

    setIsBooking(true);
    try {
      const updatedBooked = [
        ...currentBooked,
        { id: String(selectedMemberObj.id), name: selectedMemberObj.name },
      ];
      const res = await axiosInstance.patch(`/sessions/${selectedSession.id}`, {
        bookedMembers: updatedBooked,
      });

      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? res.data : s)),
      );
      toast.success(
        `Member "${selectedMemberObj.name}" booked for ${selectedSession.title}!`,
      );
      setIsBookingModalOpen(false);
    } catch (err) {
      toast.error("Failed to book session: " + (err.message || ""));
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (session, memberIdToCancel) => {
    try {
      const updatedBooked = (session.bookedMembers || []).filter(
        (bm) => String(bm.id) !== String(memberIdToCancel),
      );
      const res = await axiosInstance.patch(`/sessions/${session.id}`, {
        bookedMembers: updatedBooked,
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? res.data : s)),
      );
      toast.success("Session booking cancelled for member.");
    } catch (err) {
      toast.error("Failed to cancel booking: " + (err.message || ""));
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await axiosInstance.delete(`/sessions/${sessionToDelete.id}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      toast.success(`Session "${sessionToDelete.title}" deleted.`);
      setIsDeleteModalOpen(false);
    } catch (err) {
      toast.error("Failed to delete session: " + (err.message || ""));
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesDay = selectedDay === "All" || s.day === selectedDay;
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.trainerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDay && matchesSearch;
  });

  const currentDurationMins = calculateDurationInMinutes(
    formData.startTime,
    formData.endTime,
  );

  return (
    <div className="sessions-page">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-body mb-1">
            Trainer Schedule & Sessions
          </h2>
          <p className="text-secondary mb-0">
            Book workout slots & training sessions with certified trainers (Mon
            - Sat, 1 to 3 hours)
          </p>
        </div>
        <button
          className="btn btn-primary rounded-3 fw-bold d-flex align-items-center gap-2"
          onClick={handleOpenAddModal}
        >
          <i className="bi bi-plus-circle-fill fs-5"></i>
          <span>Add New Session</span>
        </button>
      </div>

      {/* Day Selector Tabs & Search */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-body-tertiary">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn btn-sm rounded-pill fw-semibold px-3 ${
                    selectedDay === "All"
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                  onClick={() => setSelectedDay("All")}
                >
                  All Days
                </button>
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    className={`btn btn-sm rounded-pill fw-semibold px-3 ${
                      selectedDay === day
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="input-group">
                <span className="input-group-text bg-body border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-body border-start-0 ps-0"
                  placeholder="Search session or trainer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading sessions...</span>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 py-5 text-center text-muted bg-body-tertiary">
          <i className="bi bi-calendar-x fs-1 opacity-50"></i>
          <p className="mt-2 mb-0 fw-semibold">
            No training sessions found for{" "}
            {selectedDay === "All" ? "the selected search" : selectedDay}.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredSessions.map((session) => {
            const bookedCount = (session.bookedMembers || []).length;
            const isFull = bookedCount >= session.capacity;
            const matchedTrainer = trainers.find(
              (t) => String(t.id) === String(session.trainerId),
            );

            return (
              <div className="col-12 col-md-6 col-xl-4" key={session.id}>
                <div className="card border-0 shadow-sm rounded-4 h-100 bg-body-tertiary d-flex flex-column justify-content-between">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 rounded-pill">
                        <i className="bi bi-calendar-event me-1"></i>
                        {session.day}
                      </span>
                      <span
                        className={`badge ${isFull ? "bg-danger" : "bg-success"} rounded-pill px-3 py-2 fw-semibold`}
                      >
                        {isFull
                          ? "Fully Booked"
                          : `${session.capacity - bookedCount} Slots Left`}
                      </span>
                    </div>

                    <h5 className="fw-bold text-body mb-2">{session.title}</h5>

                    <div className="d-flex align-items-center gap-2 mb-3 text-secondary small">
                      <i className="bi bi-clock-fill text-primary"></i>
                      <span className="fw-semibold">{session.time}</span>
                    </div>

                    {/* Trainer Info */}
                    <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-body mb-3 border">
                      {matchedTrainer?.image ? (
                        <img
                          src={matchedTrainer.image}
                          alt={session.trainerName}
                          className="rounded-circle border object-fit-cover"
                          style={{ width: "42px", height: "42px" }}
                        />
                      ) : (
                        <div
                          className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 shadow-sm"
                          style={{ width: "42px", height: "42px" }}
                        >
                          {session.trainerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-bold small text-body">
                          {session.trainerName}
                        </div>
                        <div className="fs-8 text-secondary">
                          {matchedTrainer?.specialization || "Certified Coach"}
                        </div>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1 fw-semibold">
                        <span>Booked Capacity</span>
                        <span>
                          {bookedCount} / {session.capacity}
                        </span>
                      </div>
                      <div
                        className="progress rounded-pill"
                        style={{ height: "8px" }}
                      >
                        <div
                          className={`progress-bar rounded-pill ${isFull ? "bg-danger" : "bg-success"}`}
                          role="progressbar"
                          style={{
                            width: `${Math.min((bookedCount / session.capacity) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Booked Members List */}
                    <div>
                      <div className="fs-8 text-uppercase text-secondary fw-bold mb-2">
                        Booked Members:
                      </div>
                      {bookedCount === 0 ? (
                        <span className="fst-italic text-muted small">
                          No members booked yet
                        </span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1">
                          {session.bookedMembers.map((bm) => (
                            <span
                              key={bm.id}
                              className="badge bg-secondary bg-opacity-10 text-body border small d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                            >
                              <span>{bm.name}</span>
                              <i
                                className="bi bi-x-circle-fill text-danger ms-1 cursor-pointer"
                                style={{ cursor: "pointer" }}
                                title="Cancel booking"
                                onClick={() =>
                                  handleCancelBooking(session, bm.id)
                                }
                              ></i>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-footer bg-transparent border-top p-3 d-flex justify-content-between align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm rounded-3 fw-bold d-flex align-items-center gap-1"
                      disabled={isFull}
                      onClick={() => handleOpenBookingModal(session)}
                    >
                      <i className="bi bi-person-plus-fill"></i>
                      <span>{isFull ? "Full" : "Book Member"}</span>
                    </button>

                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-2 me-1"
                        onClick={() => handleOpenEditModal(session)}
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm rounded-2"
                        onClick={() => handleOpenDeleteModal(session)}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Session Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={
          selectedSession
            ? "Edit Training Session"
            : "Create New Training Session"
        }
      >
        <form onSubmit={handleSubmitForm} noValidate>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold small">
                Session Title / Activity *
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.title ? "is-invalid" : ""}`}
                placeholder="e.g. HIIT Power Bootcamp"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              {formErrors.title && (
                <div className="invalid-feedback">{formErrors.title}</div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Assign Trainer *
              </label>
              <select
                className="form-select"
                value={formData.trainerId}
                onChange={(e) => {
                  const tId = e.target.value;
                  const tObj = trainers.find(
                    (t) => String(t.id) === String(tId),
                  );
                  setFormData({
                    ...formData,
                    trainerId: tId,
                    trainerName: tObj ? tObj.name : "",
                  });
                }}
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Day (Monday to Saturday) *
              </label>
              <select
                className="form-select"
                value={formData.day}
                onChange={(e) =>
                  setFormData({ ...formData, day: e.target.value })
                }
              >
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot Clock Pickers */}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Start Time (06:00 AM to 10:00 PM) *
              </label>
              <input
                type="time"
                min="06:00"
                max="22:00"
                className={`form-control ${formErrors.time ? "is-invalid" : ""}`}
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                End Time (06:00 AM to 10:00 PM) *
              </label>
              <input
                type="time"
                min="06:00"
                max="22:00"
                className={`form-control ${formErrors.time ? "is-invalid" : ""}`}
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </div>

            <div className="col-12">
              <div className="p-2 rounded bg-body-secondary border d-flex flex-wrap align-items-center justify-content-between gap-2 small">
                <div>
                  <i className="bi bi-clock me-1 text-primary"></i>
                  <span>Selected Time Slot: </span>
                  <strong className="text-body ms-1">
                    {formatTime12Hour(formData.startTime)} –{" "}
                    {formatTime12Hour(formData.endTime)}
                  </strong>
                  <span className="ms-2 text-secondary fs-8">
                    (Gym hours: 06:00 AM – 10:00 PM)
                  </span>
                </div>
                {currentDurationMins > 0 && (
                  <span
                    className={`badge ${currentDurationMins >= 60 && currentDurationMins <= 180 ? "bg-primary" : "bg-danger"} rounded-pill px-2 py-1`}
                  >
                    Duration: {Math.floor(currentDurationMins / 60)}h{" "}
                    {currentDurationMins % 60}m (Req: 1-3 hrs)
                  </span>
                )}
              </div>
              {formErrors.time && (
                <div className="text-danger small mt-1 fw-semibold">
                  {formErrors.time}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                Capacity (Seats) *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                className={`form-control ${formErrors.capacity ? "is-invalid" : ""}`}
                placeholder="e.g. 10"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
              />
              {formErrors.capacity && (
                <div className="invalid-feedback">{formErrors.capacity}</div>
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
                : selectedSession
                  ? "Update Session"
                  : "Save Session"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Book Member Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Book Session: ${selectedSession?.title || ""}`}
      >
        <form onSubmit={handleBookMember}>
          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Select Member to Book *
            </label>
            {members.filter(
              (m) =>
                !(selectedSession?.bookedMembers || []).some(
                  (bm) => String(bm.id) === String(m.id),
                ),
            ).length === 0 ? (
              <div className="alert alert-warning small mb-0">
                All available members are already booked for this session!
              </div>
            ) : (
              <select
                className="form-select"
                value={bookingMemberId}
                onChange={(e) => setBookingMemberId(e.target.value)}
              >
                {members
                  .filter(
                    (m) =>
                      !(selectedSession?.bookedMembers || []).some(
                        (bm) => String(bm.id) === String(m.id),
                      ),
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone}) - {m.planName}
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary fw-bold px-4"
              disabled={isBooking || !bookingMemberId}
            >
              {isBooking ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Session"
        size="sm"
      >
        <div className="text-center py-2">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
          <p className="mb-1">
            Are you sure you want to delete{" "}
            <strong>&quot;{sessionToDelete?.title}&quot;</strong>?
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
            onClick={handleDeleteSession}
          >
            Yes, Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Sessions;
