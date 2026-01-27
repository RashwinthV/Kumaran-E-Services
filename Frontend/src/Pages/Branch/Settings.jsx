import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../Styles/Settings.css";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import { useBilling } from "../../Context/BillingContext";

// Sub-components
import SettingsSidebar from "../../Components/Settings/SettingsSidebar";
import GeneralSettings from "../../Components/Settings/GeneralSettings";
import AccountsSettings from "../../Components/Settings/AccountsSettings";
import HardwareSettings from "../../Components/Settings/HardwareSettings";
import SyncSettings from "../../Components/Settings/SyncSettings";
import AboutSettings from "../../Components/Settings/AboutSettings";
import { saveEncrypted, getDecrypted } from "../../utils/storage";
import PrintTemplate from "../../Components/Billing/PrintTemplate";
import ShortcutsSettings from "../../Components/Settings/ShortcutsSettings";

function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setActiveTab(hash);
    } else {
      // Default to general if no hash
      navigate("#general", { replace: true });
    }
  }, [location, navigate]);

  const [settings, setSettings] = useState(() => {
    const saved = getDecrypted("app_settings");
    return {
      language:
        saved?.language || localStorage.getItem("setting_lang") || "English",
      currency:
        saved?.currency ||
        localStorage.getItem("setting_currency") ||
        "INR (₹)",
      dateFormat:
        saved?.dateFormat ||
        localStorage.getItem("setting_date_format") ||
        "DD/MM/YYYY",
      paperSize:
        saved?.paperSize || localStorage.getItem("setting_paper_size") || "A4",
      autoPrint:
        saved?.autoPrint ??
        localStorage.getItem("setting_auto_print") === "true",
      printPreview:
        saved?.printPreview ??
        localStorage.getItem("setting_print_preview") === "true",
      barcodeScanner:
        saved?.barcodeScanner ??
        localStorage.getItem("setting_barcode_enabled") === "true",
      rounding: saved?.rounding || "none",
      roundingValue: saved?.roundingValue || 10,
      billTemplate: saved?.billTemplate || "dynamic",
      selectedPrinter: saved?.selectedPrinter || "System Default Printer",
      colorMode: saved?.colorMode || "color",
      printMargin: saved?.printMargin || "default",
      printScale: saved?.printScale || 100,
      showMoreSettings: saved?.showMoreSettings ?? true,
      templateMap: saved?.templateMap || {
        A4: "standard",
        A5: "standard_a5",
        Letter: "standard",
        "80mm": "thermal",
        "58mm": "thermal_compact",
      },
    };
  });

  const handleToggle = (key) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveEncrypted("app_settings", updated);
      return updated;
    });
  };

  const handleChange = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      saveEncrypted("app_settings", updated);
      return updated;
    });
  };

  const saveSettings = () => {
    saveEncrypted("app_settings", settings);
    toast.success("Settings saved securely!");
  };

  const { refreshProducts, refreshCustomers, branchInfo, refreshBranchInfo } =
    useBilling();

  const handleSync = async () => {
    const toastId = toast.loading("Synchronizing data...");
    try {
      await Promise.all([
        refreshProducts ? refreshProducts() : Promise.resolve(),
        refreshCustomers ? refreshCustomers() : Promise.resolve(),
        refreshBranchInfo ? refreshBranchInfo() : Promise.resolve(),
      ]);

      localStorage.setItem("last_sync", new Date().toLocaleString());
      toast.update(toastId, {
        render: "Data synchronized successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast.update(toastId, {
        render: "Sync failed. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="settings-container">
      {/* <div className="settings-header">
        <div>
          <h1>Branch Settings</h1>
          <p>Configure your workspace and hardware preferences</p>
        </div>
      </div> */}

      <div className="settings-grid">
        <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="settings-content">
          {activeTab === "general" && (
            <GeneralSettings
              branchInfo={branchInfo}
              settings={settings}
              handleChange={handleChange}
            />
          )}

          {activeTab === "accounts" && <AccountsSettings />}

          {activeTab === "hardware" && (
            <HardwareSettings
              settings={settings}
              handleChange={handleChange}
              handleToggle={handleToggle}
              branchInfo={branchInfo}
            />
          )}
          {activeTab === "sync" && <SyncSettings handleSync={handleSync} />}

          {activeTab === "shortcuts" && <ShortcutsSettings />}

          {activeTab === "about" && <AboutSettings />}

          {!["accounts", "sync", "shortcuts", "about"].includes(activeTab) && (
            <div className="d-flex justify-content-end">
              <button className="btn-save-settings" onClick={saveSettings}>
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
