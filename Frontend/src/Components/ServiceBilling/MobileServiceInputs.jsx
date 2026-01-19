import React from "react";
import { getCurrencySymbol } from "../../utils/serviceBillingConstants";

const MobileServiceInputs = ({
  selectedService,
  formData,
  handleInputChange,
  currency,
  componentSuggestions = [],
  // New props for Pending Repair sub-service
  complaints = [],
  onSelectComplaint,
  onCancelComplaint,
  selectedComplaintId,
}) => {
  const isRepair = selectedService === "Mobile Repair";

  if (selectedService === "Pending Repair") {
    if (complaints.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-info-circle fs-2 d-block mb-2"></i>
          No pending repairs found.
        </div>
      );
    }
    return (
      <div className="flex-grow-1 overflow-auto">
        <label className="small fw-bold text-muted text-uppercase mb-3 d-block">
          Select a pending repair to process payment
        </label>
        <div className="list-group list-group-flush border rounded">
          {complaints.map((c) => (
            <div
              key={c.id}
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 ${
                selectedComplaintId === c.id
                  ? "bg-primary bg-opacity-10 border-primary"
                  : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectComplaint(c)}
            >
              <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-dark">
                    {c.customerName} - {c.formData.providerName}
                  </span>
                  <span className="badge bg-warning text-dark fs-6">
                    ₹{c.totalAmount.toFixed(0)}
                  </span>
                </div>
                <div className="text-muted small mt-1">
                  <i className="bi bi-phone me-1"></i>
                  {c.description}
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-calendar3 me-1"></i>
                  {new Date(c.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="ms-3">
                <button
                  className="btn btn-sm btn-outline-danger border-0"
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
    );
  }

  if (selectedService === "Recharge") {
    return (
      <div className="row g-2 mb-2">
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Mobile Number</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={formData.consumerId}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              handleInputChange("consumerId", val);
            }}
            placeholder="10-digit number"
          />
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Plan Type</label>
          <select
            className="form-select form-select-sm"
            value={formData.planType || "Prepaid"}
            onChange={(e) => handleInputChange("planType", e.target.value)}
          >
            <option value="Prepaid">Prepaid</option>
            <option value="Postpaid">Postpaid</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Operator & Circle</label>
          <select
            className="form-select form-select-sm"
            value={formData.providerName}
            onChange={(e) => handleInputChange("providerName", e.target.value)}
          >
            <option value="">Select Operator...</option>
            <option value="Jio">Jio</option>
            <option value="Airtel">Airtel</option>
            <option value="Vi (Vodafone Idea)">Vi (Vodafone Idea)</option>
            <option value="BSNL">BSNL</option>
            <option value="Other">Other...</option>
          </select>
          {formData.providerName === "Other" && (
            <input
              type="text"
              className="form-control form-control-sm mt-1"
              placeholder="Specify operator..."
              value={formData.customProvider || ""}
              onChange={(e) =>
                handleInputChange("customProvider", e.target.value)
              }
            />
          )}
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Plan Details</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={formData.planDetails}
            onChange={(e) => handleInputChange("planDetails", e.target.value)}
            placeholder="Validity/Data..."
          />
        </div>
      </div>
    );
  }

  if (isRepair) {
    return (
      <div className="row g-2 mb-2">
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Customer Name</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={formData.customerNameField}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
              handleInputChange("customerNameField", val);
            }}
          />
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Device Model</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={formData.providerName}
            onChange={(e) => handleInputChange("providerName", e.target.value)}
            placeholder="Brand & Model"
          />
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">IMEI / Serial No</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={formData.consumerId}
            onChange={(e) => handleInputChange("consumerId", e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Fault Description</label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={formData.planDetails}
            onChange={(e) => handleInputChange("planDetails", e.target.value)}
          />
        </div>

        {/* Component-wise Repair Pricing */}
        <div className="col-12 mt-3 pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="small fw-bold text-primary text-uppercase">
              Component-wise Repair Pricing
            </label>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary py-0"
              onClick={() => {
                const items = [...(formData.repairItems || [])];
                items.push({ name: "", price: "" });
                handleInputChange("repairItems", items);
              }}
            >
              <i className="bi bi-plus-circle me-1"></i> Add Component
            </button>
          </div>

          <div
            className="repair-items-list overflow-auto pe-2"
            style={{ maxHeight: "150px" }}
          >
            {(formData.repairItems || []).map((item, idx) => (
              <div key={idx} className="row g-2 mb-2 align-items-center">
                <div className="col-7 position-relative">
                  <select
                    className="form-select form-select-sm"
                    value={item.name}
                    onChange={(e) => {
                      const items = [...formData.repairItems];
                      items[idx].name = e.target.value;
                      handleInputChange("repairItems", items);
                    }}
                  >
                    <option value="">Select Component...</option>
                    <option value="Display / LCD">Display / LCD</option>
                    <option value="Battery Replacement">
                      Battery Replacement
                    </option>
                    <option value="Charging Port">Charging Port</option>
                    <option value="Speaker / Mic">Speaker / Mic</option>
                    <option value="Camera Repair">Camera Repair</option>
                    <option value="Motherboard Service">
                      Motherboard Service
                    </option>
                    <option value="Software Flash/Reset">
                      Software Flash/Reset
                    </option>
                    <option value="Body / Back Glass">Body / Back Glass</option>
                    <option value="Network / Wi-Fi">Network / Wi-Fi</option>
                    <option value="Other">Other...</option>
                  </select>
                  {item.name === "Other" && (
                    <input
                      type="text"
                      className="form-control form-control-sm mt-1"
                      placeholder="Specify component..."
                      value={item.customName || ""}
                      onChange={(e) => {
                        const items = [...formData.repairItems];
                        items[idx].customName = e.target.value;
                        handleInputChange("repairItems", items);
                      }}
                    />
                  )}
                </div>
                <div className="col-4">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light text-muted">
                      {getCurrencySymbol(currency)}
                    </span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.]/g, "");
                        const dots = val.match(/\./g);
                        if (dots && dots.length > 1) return;

                        const items = [...formData.repairItems];
                        items[idx].price = val;
                        handleInputChange("repairItems", items);

                        // Sync to base amount
                        const total = items.reduce(
                          (sum, it) => sum + (parseFloat(it.price) || 0),
                          0,
                        );
                        handleInputChange("baseAmount", total > 0 ? total : "");
                      }}
                    />
                  </div>
                </div>
                <div className="col-1 text-center">
                  {formData.repairItems.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => {
                        const items = formData.repairItems.filter(
                          (_, i) => i !== idx,
                        );
                        handleInputChange("repairItems", items);
                        // Sync to base amount
                        const total = items.reduce(
                          (sum, it) => sum + (parseFloat(it.price) || 0),
                          0,
                        );
                        handleInputChange("baseAmount", total > 0 ? total : "");
                      }}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MobileServiceInputs;
