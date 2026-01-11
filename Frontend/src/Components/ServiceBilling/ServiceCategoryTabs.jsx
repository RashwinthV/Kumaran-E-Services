import React from "react";
import { SERVICE_MODULES } from "../../utils/serviceBillingConstants";

const ServiceCategoryTabs = ({ selectedModule, onModuleChange }) => {
  return (
    <div className="card-header bg-white pt-2 pb-3 px-2">
      <ul
        className="nav nav-tabs card-header-tabs d-flex flex-wrap"
        style={{ fontSize: "0.85rem" }}
      >
        {Object.entries(SERVICE_MODULES).map(([key, mod]) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link border-0 rounded-top py-2 px-3 ${
                selectedModule === key
                  ? "active bg-primary text-white"
                  : "text-muted"
              }`}
              onClick={() => onModuleChange(key)}
              title={mod.label}
            >
              <i className={`bi ${mod.icon} me-2`}></i>
              {mod.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServiceCategoryTabs;
