import React, { useState } from "react";

const PendingRepairsList = ({
  complaints,
  history,
  selectedComplaintId,
  onSelectComplaint,
  onCancelComplaint,
}) => {
  const [view, setView] = useState("pending");

  const currentList = view === "pending" ? complaints : history;

  return (
    <div
      className="card shadow-sm border-0 mt-2 bg-white"
      style={{ maxHeight: "300px" }}
    >
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <div className="btn-group btn-group-sm">
          <button
            className={`btn ${
              view === "pending" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setView("pending")}
          >
            Pending ({complaints.length})
          </button>
          <button
            className={`btn ${
              view === "history" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setView("history")}
          >
            History ({history.length})
          </button>
        </div>
      </div>
      <div className="card-body p-0 overflow-auto">
        {currentList.length === 0 ? (
          <div className="p-3 text-center text-muted small">
            No {view} repairs found.
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {currentList.map((c) => (
              <div
                key={c.id}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 ${
                  selectedComplaintId === c.id
                    ? "bg-primary bg-opacity-10 border-primary"
                    : ""
                } ${view === "history" ? "opacity-75" : ""}`}
                style={{ cursor: view === "pending" ? "pointer" : "default" }}
                onClick={() => view === "pending" && onSelectComplaint(c)}
              >
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold small text-truncate">
                      {c.formData?.serviceId && (
                        <span className="badge bg-secondary me-2">
                          #{c.formData.serviceId}
                        </span>
                      )}
                      {c.customerName} - {c.formData.providerName}
                    </span>
                    <div className="d-flex align-items-center">
                      {view === "history" && (
                        <span
                          className={`badge me-2 ${
                            c.status === "Completed"
                              ? "bg-success"
                              : "bg-danger text-white"
                          }`}
                          style={{ fontSize: "0.6rem" }}
                        >
                          {c.status}
                        </span>
                      )}
                      <span className="badge bg-warning text-dark ms-2">
                        ₹{c.totalAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="text-muted text-truncate"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <i className="bi bi-gear me-1"></i>
                    {c.formData?.repairItems
                      ?.filter((item) => item.name && item.name !== "Other")
                      .map((item) => item.name)
                      .join(", ")}
                    {c.formData?.repairItems?.some(
                      (item) => item.name === "Other",
                    ) &&
                      `, ${c.formData.repairItems
                        .filter((item) => item.name === "Other")
                        .map((item) => item.customName || "Other")
                        .join(", ")}`}
                  </div>
                </div>
                {view === "pending" && (
                  <div className="ms-2">
                    <button
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelComplaint(c.id);
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingRepairsList;
