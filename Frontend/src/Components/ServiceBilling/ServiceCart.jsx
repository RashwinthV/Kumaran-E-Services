import React from "react";
import { getCurrencySymbol } from "../../utils/serviceBillingConstants";

const ServiceCart = ({
  cart,
  removeFromCart,
  onEditItem,
  editingItemId,
  grandTotal,
  cartTax,
  serviceSettings,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  isProcessing,
  handleCompleteSale,
  currency,
}) => {
  return (
    <div className="card shadow-sm h-100 d-flex flex-column border-0">
      <div className="card-header bg-primary text-white py-2">
        <h5 className="mb-0 fw-bold fs-6">
          <i className="bi bi-cart-check me-2"></i>Ticket Cart
        </h5>
      </div>

      {/* Cart Items List */}
      <div
        className="card-body p-0 d-flex flex-column bg-light overflow-auto"
        style={{ maxHeight: "350px" }}
      >
        {cart.length === 0 ? (
          <div className="text-center text-muted mt-5 p-3">
            <i className="bi bi-ticket-perforated fs-1 d-block mb-2 opacity-50"></i>
            <small>No tickets added</small>
          </div>
        ) : (
          <ul className="list-group list-group-flush small">
            {cart.map((item, idx) => {
              // Extract details for cleaner display
              const {
                toLoc,
                fromLoc,
                travelDate,
                transportName,
                customerNameField,
                passengerAge,
                passengerGender,
              } = item.details;

              return (
                <li
                  key={item.id}
                  onClick={() => onEditItem(item)}
                  className={`list-group-item border-bottom p-2 cursor-pointer transition-all ${
                    editingItemId === item.id
                      ? "bg-warning-subtle border-start border-4 border-warning shadow-sm"
                      : "bg-transparent hover-light"
                  }`}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    {/* Date & Transport Header */}
                    <div>
                      <div className="badge bg-light text-dark border mb-1">
                        {travelDate || "Date N/A"}{" "}
                        {transportName ? `| ${transportName}` : ""}
                      </div>
                      <div className="fw-bold text-dark small">
                        {fromLoc}{" "}
                        <i className="bi bi-arrow-right mx-1 text-muted"></i>{" "}
                        {toLoc}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(idx);
                      }}
                      className="btn btn-link text-danger p-0 ms-2"
                      title="Remove"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>

                  {/* Passenger & Price Footer */}
                  <div
                    className="d-flex justify-content-between text-muted align-items-end"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <div className="d-flex align-items-center gap-1">
                      <i className="bi bi-person-fill"></i>
                      <span className="fw-bold text-secondary">
                        {customerNameField || "Guest"}
                      </span>
                      {(passengerAge || passengerGender) && (
                        <span className="badge bg-secondary-subtle text-secondary px-1 py-0 border">
                          {passengerAge} / {passengerGender}
                        </span>
                      )}
                    </div>
                    <span className="fw-bold text-success fs-6">
                      {getCurrencySymbol(currency)}
                      {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Payment Footer */}
      <div className="card-footer bg-white border-top p-3 mt-auto">
        {/* Totals Breakdown */}
        <div className="mb-3 border-bottom pb-2">
          <div className="d-flex justify-content-between mb-1 small text-muted">
            <span>Subtotal (Base)</span>
            <span>
              {getCurrencySymbol(currency)}
              {cart
                .reduce((sum, i) => sum + (i.baseAmount || 0) * i.qty, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-1 small text-muted">
            <span>Service Charges</span>
            <span>
              +{getCurrencySymbol(currency)}
              {cart
                .reduce((sum, i) => sum + (i.serviceCharge || 0) * i.qty, 0)
                .toFixed(2)}
            </span>
          </div>
          {serviceSettings?.enableServiceTax && (
            <div className="d-flex justify-content-between mb-1 small text-muted">
              <span>Service Tax</span>
              <span className="text-danger">
                +{getCurrencySymbol(currency)}
                {cartTax.toFixed(2)}
              </span>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="fw-bold text-dark">Grand Total</span>
            <span className="fw-bold text-success fs-4">
              {getCurrencySymbol(currency)}
              {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="d-grid gap-2 d-md-flex mb-3">
          {accounts.map((acc) => (
            <button
              key={acc._id}
              onClick={() => setSelectedAccountId(acc._id)}
              className={`btn btn-sm flex-fill fw-bold py-1 transition-all ${
                selectedAccountId === acc._id
                  ? "btn-success shadow-sm border-0"
                  : "btn-light border text-secondary shadow-hover"
              }`}
            >
              {acc.type === "Upi" ? (
                <span>
                  <i className="bi bi-qr-code me-1"></i>UPI
                </span>
              ) : acc.type === "Credits" || acc.type === "Credit" ? (
                <span>
                  <i className="bi bi-person-badge me-1"></i>CREDIT
                </span>
              ) : (
                acc.type
              )}
            </button>
          ))}
        </div>

        {selectedAccountId && (
          <div className="alert alert-secondary border-0 bg-light p-2 rounded-3 mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted small">Account Balance:</small>
              <small className="fw-bold small">
                {getCurrencySymbol(currency)}
                {accounts
                  .find((a) => a._id === selectedAccountId)
                  ?.currentBalance?.toFixed(2) || "0.00"}
              </small>
            </div>
          </div>
        )}

        <div className="d-flex w-100 gap-2">
          <button
            onClick={() => handleCompleteSale(false)}
            disabled={isProcessing || cart.length === 0}
            className="btn btn-primary flex-fill py-2 fw-bold shadow-sm text-uppercase small"
          >
            {isProcessing ? "Processing..." : "Save All"}
          </button>
          <button
            onClick={() => handleCompleteSale(true)}
            disabled={isProcessing || cart.length === 0}
            className="btn btn-success flex-fill py-2 fw-bold shadow-sm text-uppercase small"
          >
            {isProcessing ? "Processing..." : "Save & Print All"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCart;
