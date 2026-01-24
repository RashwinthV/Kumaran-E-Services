import React from "react";

const CustomerTable = ({ data, onViewCustomer, onSettleCredit }) => {
  const getTotalCreditAmount = (customer) => {
    if (!customer.credits || customer.credits.length === 0) return 0;
    return customer.credits.reduce(
      (sum, credit) => sum + credit.totalAmount,
      0,
    );
  };

  const getLatestCreditDate = (customer) => {
    if (!customer.credits || customer.credits.length === 0) return null;
    const dates = customer.credits.map((c) => new Date(c.date));
    return new Date(Math.max(...dates));
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-5 shadow-sm border p-5 text-center my-4 overflow-hidden position-relative">
        <div
          className="position-absolute top-0 start-0 w-100 h-100 bg-primary opacity-5"
          style={{ pointerEvents: "none" }}
        ></div>
        <div className="d-flex flex-column align-items-center position-relative">
          <div className="bg-primary bg-opacity-10 rounded-circle p-4 mb-3">
            <i className="bi bi-people display-5 text-primary"></i>
          </div>
          <p className="mb-0 fw-bold fs-5 text-dark">
            No customers with credits found
          </p>
          <p className="text-muted small">
            All credit accounts are settled! Keep it up!
          </p>
        </div>
      </div>
    );
  }

  // Predefined soft gradient backgrounds for avatars
  const avatarColors = [
    "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
  ];

  return (
    <div className="row g-4 py-3">
      {data.map((customer, index) => {
        const totalCredit = getTotalCreditAmount(customer);
        const latestDate = getLatestCreditDate(customer);
        const creditCount = customer.credits?.length || 0;
        const avatarStyle = {
          background: avatarColors[index % avatarColors.length],
          width: "50px",
          height: "50px",
        };

        return (
          <div key={customer._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
            <div
              className="card h-100 border-0 shadow-sm"
              style={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                transition: "all 0.3s ease",
              }}
            >
              <div className="card-body p-3 d-flex flex-column h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div
                    className="rounded-3 shadow-sm d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{
                      ...avatarStyle,
                      width: "42px",
                      height: "42px",
                      fontSize: "1.2rem",
                      borderRadius: "10px",
                    }}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-end">
                    <span
                      className="badge rounded-pill"
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        letterSpacing: "0.025em",
                      }}
                    >
                      {creditCount} {creditCount === 1 ? "Bill" : "Bills"}
                    </span>
                  </div>
                </div>

                <h6
                  className="fw-bold text-dark mb-1 text-truncate"
                  style={{ fontSize: "1.1rem", letterSpacing: "-0.01em" }}
                >
                  {customer.name.toUpperCase()}
                </h6>
                <div
                  className="d-flex align-items-center justify-content-between mb-3 text-muted"
                  style={{ fontSize: "0.85rem" }}
                >
                  <span>
                    <i className="bi bi-telephone me-2"></i>
                    {customer.phone}
                  </span>
                  {customer.city && (
                    <span
                      className="fw-bold text-primary"
                      style={{ fontSize: "0.75rem" }}
                    >
                      <i className="bi bi-geo-alt-fill me-1"></i>
                      {customer.city.toUpperCase()}
                    </span>
                  )}
                </div>

                <div
                  className="rounded-3 p-3 mb-3 mt-auto"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span
                      className="text-muted small fw-bold text-uppercase"
                      style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
                    >
                      Credit Balance
                    </span>
                  </div>
                  <h3
                    className="fw-bold text-danger mb-0"
                    style={{ fontSize: "1.5rem", letterSpacing: "-0.025em" }}
                  >
                    ₹
                    {totalCredit.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-10">
                    <small
                      className="text-muted d-block"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Last Entry:{" "}
                      <strong className="text-dark">
                        {formatDate(latestDate)}
                      </strong>
                    </small>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary flex-fill fw-bold py-2"
                    onClick={() => onViewCustomer(customer)}
                    style={{ borderRadius: "10px" }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        .customer-card-v2 {
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.03) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .customer-card-v2:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important;
          border-color: rgba(13, 110, 253, 0.1) !important;
        }
        .fw-extrabold { font-weight: 800; }
        .ls-tight { letter-spacing: -0.5px; }
        .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .btn-outline-primary:hover {
          background-color: var(--bs-primary);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default CustomerTable;
