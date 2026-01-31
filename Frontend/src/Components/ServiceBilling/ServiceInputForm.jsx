import React from "react";
import {
  getCurrencySymbol,
  SERVICE_FIELDS_CONFIG,
} from "../../utils/serviceBillingConstants";
import MobileServiceInputs from "./MobileServiceInputs";
import LocalServiceInputs from "./LocalServiceInputs";

const ServiceInputForm = ({
  selectedModule,
  selectedService,
  formData,
  handleInputChange,
  currency,
  serviceSettings,
  componentSuggestions = [],
  // New props for Pending Repair sub-service
  complaints = [],
  allComplaints = [],
  onSelectComplaint,
  onCancelComplaint,
  selectedComplaintId,
  complaintHistory = [],
}) => {
  const isRepairService = selectedService === "Mobile Repair";
  const isXeroxPrintScan = ["Xerox", "Printout", "Scan"].includes(
    selectedService,
  );
  const isPhotoLami = ["Photograph", "Lamination"].includes(selectedService);
  // Manual entry disabled if any of these special modes are active
  const isManualBaseDisabled =
    isRepairService || isXeroxPrintScan || isPhotoLami;

  const renderDynamicInputs = () => {
    // Local Service Special Case
    if (selectedModule === "LOCAL") {
      return (
        <LocalServiceInputs
          selectedService={selectedService}
          formData={formData}
          handleInputChange={handleInputChange}
          currency={currency}
          serviceSettings={serviceSettings}
        />
      );
    }

    // Mobile Service Special Case
    if (selectedModule === "MOBILE_SERVICE") {
      return (
        <MobileServiceInputs
          selectedService={selectedService}
          formData={formData}
          handleInputChange={handleInputChange}
          currency={currency}
          componentSuggestions={componentSuggestions}
          complaints={complaints}
          allComplaints={allComplaints}
          onSelectComplaint={onSelectComplaint}
          onCancelComplaint={onCancelComplaint}
          selectedComplaintId={selectedComplaintId}
          complaintHistory={complaintHistory}
        />
      );
    }

    // Ticket Special Case
    if (
      ["Train Ticket", "Bus Ticket", "Flight Ticket"].includes(selectedService)
    ) {
      return (
        <div className="row g-2 mb-2">
          {serviceSettings?.showHelperText && (
            <div className="col-12">
              <div className="alert alert-info py-2 px-3 small border-0 bg-info-subtle text-info-emphasis mb-2 d-flex align-items-center">
                <i className="bi bi-info-circle-fill me-2"></i>
                Enter ticket details accurately. PNR is optional but
                recommended.
              </div>
            </div>
          )}
          <div className="col-md-2">
            <label className="small text-muted fw-bold">PNR / Ref</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.referenceId}
                onChange={(e) =>
                  handleInputChange("referenceId", e.target.value)
                }
                placeholder="PNR..."
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <label className="small text-muted fw-bold">Travel Date</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="date"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.travelDate}
                onChange={(e) =>
                  handleInputChange("travelDate", e.target.value)
                }
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">From</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.fromLoc}
                onChange={(e) => handleInputChange("fromLoc", e.target.value)}
                placeholder="Origin"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">To</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.toLoc}
                onChange={(e) => handleInputChange("toLoc", e.target.value)}
                placeholder="Dest"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <label className="small text-muted fw-bold">Trans. Name</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.transportName}
                onChange={(e) =>
                  handleInputChange("transportName", e.target.value)
                }
                placeholder="Train/Bus Name"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-4">
            <label className="small text-muted fw-bold">Passenger Name</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.customerNameField}
                onChange={(e) =>
                  handleInputChange("customerNameField", e.target.value)
                }
                placeholder="Name"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">Age</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.passengerAge}
                onChange={(e) =>
                  handleInputChange("passengerAge", e.target.value)
                }
                placeholder="Age"
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">Gender</label>
            <select
              className="form-select form-select-sm"
              value={formData.passengerGender}
              onChange={(e) =>
                handleInputChange("passengerGender", e.target.value)
              }
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>
      );
    }

    // --- DYNAMIC CONFIGURATION LOGIC ---
    const svcConfig = SERVICE_FIELDS_CONFIG[selectedService] || {};

    // Defaults if not specified in svcConfig
    let labelConsumer = svcConfig.consumerId; // value or undefined
    let labelProvider = svcConfig.providerName;
    let labelPlan = svcConfig.planDetails;
    let labelName = svcConfig.labelName || "Name";
    let showName = svcConfig.showName;

    // description only mode?
    if (svcConfig.description) {
      return (
        <div className="mb-2">
          {serviceSettings?.showHelperText && (
            <div className="small text-muted mb-2 fst-italic">
              <i className="bi bi-lightbulb me-1 text-warning"></i>
              Tip: Provide a clear description for future reference.
            </div>
          )}
          <label className="small text-muted fw-bold">
            {svcConfig.description}
          </label>
          <div
            className="d-flex align-items-center bg-light rounded-2 px-2"
            style={{ height: "40px" }}
          >
            <input
              type="text"
              className="form-control border-0 bg-transparent p-0 shadow-none"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              style={{ fontSize: "0.9rem" }}
            />
          </div>
        </div>
      );
    }

    // Fallback to Module-level defaults if specialized config is missing logic
    if (labelConsumer === undefined) {
      switch (selectedModule) {
        case "UTILITY":
          labelConsumer = "Consumer No";
          labelProvider = "Biller";
          labelPlan = "Bill Period";
          break;
        case "MOBILE_TV":
          labelConsumer = "Mobile / ID";
          labelProvider = "Operator";
          labelPlan = "Plan";
          break;
        case "FINANCIAL":
          labelConsumer = "Loan / Card No";
          labelProvider = "Bank";
          showName = true;
          break;
        case "GOVT":
          labelConsumer = "ID Number";
          labelProvider = "Department";
          showName = true;
          break;
        case "EDUCATION":
          labelConsumer = "Roll No";
          labelProvider = "Institution";
          showName = true;
          labelPlan = "Fee Details";
          break;

        case "TRAVEL":
          // Non-ticket travel
          labelConsumer = "Vehicle No";
          labelProvider = "Provider";
          break;

        case "LOCAL":
          // Should have been caught by description check above, but fallback:
          return (
            <div className="mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            </div>
          );
        default:
          labelConsumer = "ID / Number";
          labelProvider = "Provider";
          break;
      }
    }

    return (
      <div className="row g-2 mb-2">
        {serviceSettings?.showHelperText && (
          <div className="col-12">
            <div className="d-flex gap-3 small text-muted bg-light p-2 rounded mb-1">
              {labelConsumer !== false && (
                <span>
                  <i className="bi bi-1-circle me-1"></i>Enter ID
                </span>
              )}
              {labelProvider !== false && (
                <span>
                  <i className="bi bi-2-circle me-1"></i>Select Provider
                </span>
              )}
              <span>
                <i className="bi bi-check-circle me-1"></i>Verify Details
              </span>
            </div>
          </div>
        )}
        {/* Consumer ID Field */}
        {labelConsumer !== false && (
          <div className={`col-md-${showName ? "3" : "4"}`}>
            <label className="small text-muted fw-bold">{labelConsumer}</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.consumerId}
                onChange={(e) =>
                  handleInputChange("consumerId", e.target.value)
                }
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
        )}

        {/* Provider Field */}
        {labelProvider !== false && (
          <div className={`col-md-${showName ? "3" : "4"}`}>
            <label className="small text-muted fw-bold">{labelProvider}</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.providerName}
                onChange={(e) =>
                  handleInputChange("providerName", e.target.value)
                }
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
        )}

        {/* Optional Name Field */}
        {showName && (
          <div className="col-md-3">
            <label className="small text-muted fw-bold">{labelName}</label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.customerNameField}
                onChange={(e) =>
                  handleInputChange("customerNameField", e.target.value)
                }
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
        )}

        {/* Plan / Detail or Reference - Unified slot */}
        {(labelPlan ||
          (!labelPlan &&
            !showName &&
            labelConsumer !== false &&
            labelProvider !== false)) && (
          <div className="col-md-3">
            <label className="small text-muted fw-bold">
              {labelPlan || "Reference / Detail"}
            </label>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2"
              style={{ height: "35px" }}
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                value={formData.planDetails || formData.referenceId} // Support either mapping
                onChange={(e) => {
                  if (labelPlan)
                    handleInputChange("planDetails", e.target.value);
                  else handleInputChange("referenceId", e.target.value);
                }}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card-body bg-white py-3 flex-grow-1 d-flex flex-column">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="d-flex flex-column flex-grow-1"
      >
        {/* Dynamic Fields Area - Grows to push financials down */}
        <div className="flex-grow-1">{renderDynamicInputs()}</div>

        {/* Financials Row (Prominent) - Pinned to bottom */}
        <div className="row g-2 mt-2 pt-2 border-top align-items-end mt-auto">
          <div className={selectedModule === "LOCAL" ? "col-md-6" : "col-md-4"}>
            <label className="small fw-bold text-muted text-uppercase mb-1">
              Base Amount
            </label>
            <div
              className="bg-light rounded-3 d-flex align-items-center px-1"
              style={{ height: "50px" }}
            >
              <div
                className="d-flex align-items-center justify-content-center bg-white rounded-2 px-2 ms-1"
                style={{ height: "38px", minWidth: "40px" }}
              >
                <span className="fw-bold text-primary">
                  {getCurrencySymbol(currency)}
                </span>
              </div>
              <input
                type="number"
                className="form-control border-0 bg-transparent shadow-none fs-4 fw-bold text-end"
                placeholder="0.00"
                value={formData.baseAmount}
                onChange={(e) =>
                  handleInputChange("baseAmount", e.target.value)
                }
                style={{ color: "#1e293b" }}
              />
            </div>
          </div>
          <div className={selectedModule === "LOCAL" ? "col-md-6" : "col-md-4"}>
            <label className="small fw-bold text-muted text-uppercase mb-1">
              Service Charge
            </label>
            <div
              className="bg-light rounded-3 d-flex align-items-center px-1"
              style={{ height: "50px" }}
            >
              <div
                className="d-flex align-items-center justify-content-center bg-white rounded-2 px-2 ms-1"
                style={{ height: "38px", minWidth: "40px" }}
              >
                <span className="fw-bold text-primary">
                  {getCurrencySymbol(currency)}
                </span>
              </div>
              <input
                type="number"
                className="form-control border-0 bg-transparent shadow-none fs-4 fw-bold text-end"
                placeholder="0.00"
                value={formData.serviceCharge}
                onChange={(e) =>
                  handleInputChange("serviceCharge", e.target.value)
                }
                style={{ color: "#1e293b" }}
              />
            </div>
          </div>
          {selectedModule !== "LOCAL" && (
            <div className="col-md-4">
              <label className="small fw-bold text-muted text-uppercase mb-1">
                Quantity
              </label>
              <div
                className="d-flex align-items-center bg-light rounded-3 px-2"
                style={{ height: "50px" }}
              >
                <input
                  type="number"
                  className="form-control border-0 bg-transparent shadow-none fs-4 fw-bold text-center"
                  value={formData.qty}
                  onChange={(e) => handleInputChange("qty", e.target.value)}
                  style={{ color: "#1e293b" }}
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ServiceInputForm;
