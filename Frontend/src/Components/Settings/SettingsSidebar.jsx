import React from "react";
import { useNavigate } from "react-router-dom";

const SettingsSidebar = ({ activeTab }) => {
  const navigate = useNavigate();

  const tabs = [
    { id: "general", icon: "gear", label: "General" },
    { id: "accounts", icon: "vault", label: "Accounts" },
    { id: "hardware", icon: "print", label: "Hardware & POS" },
    { id: "sync", icon: "sync", label: "Data & Sync" }, // or 'rotate'
    { id: "shortcuts", icon: "keyboard", label: "Shortcuts" },
    // { id: "staff", icon: "user-gear", label: "Staff Settings" },
    { id: "about", icon: "info-circle", label: "About" },
  ];

  return (
    <div className="settings-sidebar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`sidebar-item ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => navigate(`#${tab.id}`)}
        >
          <i className={`fa-solid fa-${tab.icon}`}></i>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SettingsSidebar;
