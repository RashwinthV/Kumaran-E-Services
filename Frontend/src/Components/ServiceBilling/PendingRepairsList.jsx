import React from "react";

const PendingRepairsList = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  onCancelComplaint,
}) => {
  if (complaints.length === 0) return null;

  return (
    <div
      className="card shadow-sm border-0 mt-2 bg-white"
      style={{ maxHeight: "200px" }}
    >
      <div className="card-header bg-white border-bottom py-2 d-flex justify-content-between align-items-center">
        <span className="small fw-bold text-muted text-uppercase">
          <i className="bi bi-clock-history me-2 text-warning"></i>
          Pending Repairs ({complaints.length})
        </span>
      </div>
      <div className="card-body p-0 overflow-auto">
        <div className="list-group list-group-flush">
          {complaints.map((c) => (
            <div
              key={c.id}
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 ${
                selectedComplaintId === c.id
                  ? "bg-primary bg-opacity-10 border-primary"
                  : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectComplaint(c)}
            >
              <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between">
                  <span className="fw-bold small text-truncate">
                    {c.customerName} - {c.formData.providerName}
                  </span>
                  <span className="badge bg-warning text-dark ms-2">
                    ₹{c.totalAmount.toFixed(0)}
                  </span>
                </div>
                <div
                  className="text-muted text-truncate"
                  style={{ fontSize: "0.7rem" }}
                >
                  {c.description}
                </div>
              </div>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PendingRepairsList;
