import React from "react";
import CustomerSearch from "../Billing/CustomerSearch";

const ServiceCustomerSelect = ({
  customers,
  selectedCustomerId,
  selectedCustomerName,
  selectedCustomerPhone,
  onSelectCustomer,
  onClearCustomer,
}) => {
  return (
    <div className="card shadow-sm mb-2 flex-shrink-0">
      <div className="card-body p-2">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-person-badge text-primary"></i>
              <h6 className="fw-bold mb-0 small">CUSTOMER SEARCH</h6>
            </div>
            <CustomerSearch
              customers={customers}
              onSelectCustomer={onSelectCustomer}
              onAddNewCustomer={() => {}} // Provide a no-op or handle appropriately if modal is needed
            />
          </div>
          <div className="col-md-7">
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-check-circle text-primary"></i>
              <h6 className="fw-bold mb-0 small">SELECTED CUSTOMER</h6>
            </div>
            {selectedCustomerId ? (
              <div className="card bg-light border-0">
                <div className="card-body p-2 d-flex justify-content-between align-items-center">
                  <div>
                    <span className="fw-bold text-dark me-3">
                      <i className="bi bi-person me-1"></i>
                      {selectedCustomerName.toUpperCase()}
                    </span>
                    <span className="text-muted small">
                      <i className="bi bi-phone me-1"></i>
                      {selectedCustomerPhone}
                    </span>
                  </div>
                  <button
                    className="btn btn-sm btn-link text-danger p-0"
                    onClick={onClearCustomer}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-muted small fst-italic p-2">
                No customer selected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCustomerSelect;
