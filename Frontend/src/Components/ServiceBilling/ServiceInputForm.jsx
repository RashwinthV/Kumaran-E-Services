import React from "react";
import {
  getCurrencySymbol,
  SERVICE_FIELDS_CONFIG,
} from "../../utils/serviceBillingConstants";

const ServiceInputForm = ({
  selectedModule,
  selectedService,
  formData,
  handleInputChange,
  currency,
}) => {
  const renderDynamicInputs = () => {
    // Ticket Special Case
    if (
      ["Train Ticket", "Bus Ticket", "Flight Ticket"].includes(selectedService)
    ) {
      return (
        <div className="row g-2 mb-2">
          <div className="col-md-2">
            <label className="small text-muted fw-bold">PNR / Ref</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.referenceId}
              onChange={(e) => handleInputChange("referenceId", e.target.value)}
              placeholder="PNR..."
            />
          </div>
          <div className="col-md-3">
            <label className="small text-muted fw-bold">Travel Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={formData.travelDate}
              onChange={(e) => handleInputChange("travelDate", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">From</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.fromLoc}
              onChange={(e) => handleInputChange("fromLoc", e.target.value)}
              placeholder="Origin"
            />
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">To</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.toLoc}
              onChange={(e) => handleInputChange("toLoc", e.target.value)}
              placeholder="Dest"
            />
          </div>
          <div className="col-md-3">
            <label className="small text-muted fw-bold">Trans. Name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.transportName}
              onChange={(e) =>
                handleInputChange("transportName", e.target.value)
              }
              placeholder="Train/Bus Name"
            />
          </div>
          <div className="col-md-4">
            <label className="small text-muted fw-bold">Passenger Name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.customerNameField}
              onChange={(e) =>
                handleInputChange("customerNameField", e.target.value)
              }
              placeholder="Name"
            />
          </div>
          <div className="col-md-2">
            <label className="small text-muted fw-bold">Age</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.passengerAge}
              onChange={(e) =>
                handleInputChange("passengerAge", e.target.value)
              }
              placeholder="Age"
            />
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
          <label className="small text-muted fw-bold">
            {svcConfig.description}
          </label>
          <input
            type="text"
            className="form-control"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
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
        case "SUBSCRIPTION":
          labelConsumer = "User ID";
          labelProvider = "Platform";
          labelPlan = "Plan";
          break;
        case "TRAVEL":
          // Non-ticket travel
          labelConsumer = "Vehicle No";
          labelProvider = "Provider";
          break;
        case "WALLET":
          labelConsumer = "Mobile / UPI ID";
          labelProvider = "Wallet";
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
        {/* Consumer ID Field */}
        {labelConsumer !== false && (
          <div className={`col-md-${showName ? "3" : "4"}`}>
            <label className="small text-muted fw-bold">{labelConsumer}</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.consumerId}
              onChange={(e) => handleInputChange("consumerId", e.target.value)}
            />
          </div>
        )}

        {/* Provider Field */}
        {labelProvider !== false && (
          <div className={`col-md-${showName ? "3" : "4"}`}>
            <label className="small text-muted fw-bold">{labelProvider}</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.providerName}
              onChange={(e) =>
                handleInputChange("providerName", e.target.value)
              }
            />
          </div>
        )}

        {/* Optional Name Field */}
        {showName && (
          <div className="col-md-3">
            <label className="small text-muted fw-bold">{labelName}</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.customerNameField}
              onChange={(e) =>
                handleInputChange("customerNameField", e.target.value)
              }
            />
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
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.planDetails || formData.referenceId} // Support either mapping
              onChange={(e) => {
                if (labelPlan) handleInputChange("planDetails", e.target.value);
                else handleInputChange("referenceId", e.target.value);
              }}
            />
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
          <div className="col-md-4">
            <label className="small fw-bold text-muted text-uppercase mb-1">
              Base Amount
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                className="form-control fw-bold"
                placeholder="0.00"
                value={formData.baseAmount}
                onChange={(e) =>
                  handleInputChange("baseAmount", e.target.value)
                }
              />
            </div>
          </div>
          <div className="col-md-4">
            <label className="small fw-bold text-muted text-uppercase mb-1">
              Service Charge
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="number"
                className="form-control fw-bold"
                placeholder="0.00"
                value={formData.serviceCharge}
                onChange={(e) =>
                  handleInputChange("serviceCharge", e.target.value)
                }
              />
            </div>
          </div>
          <div className="col-md-4">
            <label className="small fw-bold text-muted text-uppercase mb-1">
              Quantity
            </label>
            <input
              type="number"
              className="form-control text-center"
              value={formData.qty}
              onChange={(e) => handleInputChange("qty", e.target.value)}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceInputForm;
