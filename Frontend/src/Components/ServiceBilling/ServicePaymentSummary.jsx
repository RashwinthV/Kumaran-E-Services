import React from "react";
import { getCurrencySymbol } from "../../utils/serviceBillingConstants";

const ServicePaymentSummary = ({
  selectedService,
  currentBase,
  currentCharge,
  currentItemTotal,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  isProcessing,
  handleCompleteSale,
  currency,
  detailsDescription,
}) => {
  return (
    <div className="card shadow-sm h-100 d-flex flex-column border-0">
      <div className="card-header bg-success text-white py-2">
        <h5 className="mb-0 fw-bold fs-6">
          <i className="bi bi-cash-coin me-2"></i>Process Transaction
        </h5>
      </div>
      <div className="card-body d-flex flex-column p-3">
        <h6 className="text-muted small fw-bold text-uppercase mb-2">
          Transaction Details
        </h6>
        <div className="mb-auto">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-secondary small">Service</span>
            <span className="fw-bold text-end text-dark small">
              {selectedService}
            </span>
          </div>

          {/* Dynamic Details Display */}
          <div className="mb-2 p-2 bg-light rounded border small">
            <div
              className="fw-bold text-muted mb-1"
              style={{ fontSize: "0.65rem" }}
            >
              DETAILS
            </div>
            <span
              className="d-block text-dark"
              style={{ wordBreak: "break-word", fontSize: "0.85rem" }}
            >
              {detailsDescription}
            </span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span className="text-secondary small">Base Amount</span>
            <span className="fw-bold small">
              {getCurrencySymbol(currency)}
              {currentBase.toFixed(2)}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
            <span className="text-secondary small">Service Charge</span>
            <span className="fw-bold text-success small">
              +{getCurrencySymbol(currency)}
              {currentCharge.toFixed(2)}
            </span>
          </div>

          <div className="d-flex justify-content-between mb-1 p-2 bg-light rounded">
            <span className="fs-6 fw-bold text-dark">Total</span>
            <span className="fs-4 fw-bold text-success">
              {getCurrencySymbol(currency)}
              {currentItemTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <label className="small fw-bold text-muted mb-2 text-uppercase">
            Select Payment Mode
          </label>
          <div className="d-grid gap-2 d-md-flex mb-3">
            {accounts.map((acc) => (
              <button
                key={acc._id}
                onClick={() => setSelectedAccountId(acc._id)}
                className={`btn btn-sm flex-fill fw-bold py-2 ${
                  selectedAccountId === acc._id
                    ? "btn-success shadow"
                    : "btn-outline-secondary border-0 bg-light"
                }`}
              >
                {acc.type === "Upi" ? (
                  <span>
                    <i className="bi bi-qr-code me-1"></i>UPI
                  </span>
                ) : (
                  <span>
                    <i className="bi bi-cash me-1"></i>
                    {acc.type}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={isProcessing}
            className="btn btn-primary w-100 py-3 fw-bold shadow-sm text-uppercase letter-spacing-1"
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <span>
                <i className="bi bi-check-circle-fill me-2"></i>CONFIRM & PAY
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicePaymentSummary;
