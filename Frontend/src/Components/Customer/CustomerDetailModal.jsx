import React from "react";

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const totalCreditAmount =
    customer.credits?.reduce((sum, credit) => sum + credit.totalAmount, 0) || 0;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            {/* Header */}
            <div className="modal-header bg-primary bg-opacity-10 border-0">
              <div>
                <h5 className="modal-title fw-bold text-dark mb-1">
                  Credit Details
                </h5>
                <p className="mb-0 small text-muted">
                  Customer: {customer.name}
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4">
              {/* Customer Info */}
              <div className="bg-light rounded-3 p-3 mb-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">Name</small>
                    <strong>{customer.name}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">Phone</small>
                    <strong>{customer.phone}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">City</small>
                    <strong>{customer.city || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="bg-warning bg-opacity-10 rounded-3 p-3 border border-warning border-opacity-10">
                    <small className="text-muted d-block mb-1">
                      Total Credit Entries
                    </small>
                    <h4 className="fw-bold mb-0 text-warning">
                      {customer.credits?.length || 0}
                    </h4>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-danger bg-opacity-10 rounded-3 p-3 border border-danger border-opacity-10">
                    <small className="text-muted d-block mb-1">
                      Total Amount
                    </small>
                    <h4 className="fw-bold mb-0 text-danger">
                      ₹{totalCreditAmount.toFixed(2)}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Credit History */}
              <div>
                <h6 className="fw-bold mb-3">Credit History</h6>
                {customer.credits && customer.credits.length > 0 ? (
                  <div className="list-group">
                    {customer.credits
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((credit, index) => (
                        <div
                          key={index}
                          className="list-group-item border rounded-3 mb-2"
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-1">
                                <i className="bi bi-calendar3 text-muted me-2"></i>
                                <span className="fw-bold text-dark">
                                  {formatDate(credit.date)}
                                </span>
                                <span className="text-muted ms-2 small">
                                  {formatTime(credit.date)}
                                </span>
                                {credit.billNumber && (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary ms-2 border border-secondary border-opacity-25">
                                    Bill: {credit.billNumber}
                                  </span>
                                )}
                              </div>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-box-seam text-muted me-2"></i>
                                <span className="text-muted small">
                                  {credit.products?.length || 0} product(s)
                                </span>
                              </div>
                            </div>
                            <div className="text-end">
                              <h5
                                className={`fw-bold mb-0 ${
                                  credit.totalAmount < 0
                                    ? "text-success"
                                    : "text-danger"
                                }`}
                              >
                                {credit.totalAmount < 0
                                  ? `(Store Credit) ₹${Math.abs(
                                      credit.totalAmount
                                    ).toFixed(2)}`
                                  : `₹${credit.totalAmount.toFixed(2)}`}
                              </h5>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-light rounded-3">
                    <i className="bi bi-inbox display-6 text-muted mb-2"></i>
                    <p className="text-muted mb-0">No credit history</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDetailModal;
