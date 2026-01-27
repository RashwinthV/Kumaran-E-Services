import React from "react";
import { SERVICE_MODULES } from "../../utils/serviceBillingConstants";

const ServiceTypeSelector = ({
  selectedModule,
  selectedService,
  onServiceChange,
  serviceCounts = {}, // New Prop for counts
}) => {
  return (
    <div className="bg-light border-bottom px-3 py-2">
      <div className="d-flex flex-wrap gap-2">
        {SERVICE_MODULES[selectedModule].services.map((subSvc) => (
          <button
            key={subSvc}
            onClick={() => onServiceChange(subSvc)}
            className={`btn btn-sm rounded-pill px-3 d-flex align-items-center ${
              selectedService === subSvc
                ? "btn-white bg-white text-primary shadow-sm fw-bold border-primary"
                : "btn-outline-secondary border-0"
            }`}
          >
            {subSvc}
            {serviceCounts[subSvc] > 0 && (
              <span
                className={`badge rounded-pill ms-2 ${
                  selectedService === subSvc
                    ? "bg-primary text-white"
                    : "bg-secondary bg-opacity-25 text-dark"
                }`}
                style={{ fontSize: "0.7rem", padding: "0.25em 0.6em" }}
              >
                {serviceCounts[subSvc]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceTypeSelector;
