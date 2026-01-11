import React from "react";
import { SERVICE_MODULES } from "../../utils/serviceBillingConstants";

const ServiceTypeSelector = ({
  selectedModule,
  selectedService,
  onServiceChange,
}) => {
  return (
    <div className="bg-light border-bottom px-3 py-2">
      <div className="d-flex flex-wrap gap-2">
        {SERVICE_MODULES[selectedModule].services.map((subSvc) => (
          <button
            key={subSvc}
            onClick={() => onServiceChange(subSvc)}
            className={`btn btn-sm rounded-pill px-3 ${
              selectedService === subSvc
                ? "btn-white bg-white text-primary shadow-sm fw-bold border-primary"
                : "btn-outline-secondary border-0"
            }`}
          >
            {subSvc}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceTypeSelector;
