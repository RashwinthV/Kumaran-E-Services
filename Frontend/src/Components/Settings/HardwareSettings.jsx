import React, { useState, useEffect } from "react";
import LiveTemplatePreview from "../Billing/LiveTemplatePreview";
import { getSystemPrinters } from "../../utils/printerService";

const HardwareSettings = ({
  settings,
  handleChange,
  handleToggle,
  branchInfo,
}) => {
  const [printers, setPrinters] = useState([]);
  const [loadingPrinters, setLoadingPrinters] = useState(true);

  const dummySale = {
    billNo: "PV-2024-001",
    formattedDate: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    customerName: "JOHN DOE (PREVIEW)",
    customerPhone: "9876543210",
    status: "Paid",
    paymentMode: "Cash",
    amount: 1250.0,
    totalTax: 150.0,
    discount: 50.0,
    products: [
      {
        name: "Professional Service A",
        sku: "PRO-001",
        qty: 2,
        price: 500.0,
        gst: 12,
        lineTotal: 1000.0,
      },
      {
        name: "Standard Product B",
        sku: "STD-002",
        qty: 1,
        price: 250.0,
        gst: 18,
        lineTotal: 250.0,
      },
    ],
  };

  useEffect(() => {
    const fetchPrinters = async () => {
      setLoadingPrinters(true);
      const systemPrinters = await getSystemPrinters();
      setPrinters(systemPrinters);
      setLoadingPrinters(false);

      if (!settings.selectedPrinter && systemPrinters.length > 0) {
        const defaultPrinter =
          systemPrinters.find((p) => p.isDefault) || systemPrinters[0];
        handleChange("selectedPrinter", defaultPrinter.name);
      }
    };

    fetchPrinters();
  }, []);

  return (
    <div className="settings-section">
      <div className="row g-4">
        <div className="col-lg-7">
          <h3 className="settings-section-title mb-4">
            Hardware & POS Configuration
          </h3>

          <div className="settings-card bg-white p-4 rounded-4 shadow-sm border mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
              <i className="bi bi-printer me-2"></i>Output Printer
            </h5>
            <div className="printer-selector">
              {loadingPrinters ? (
                <div className="p-3 text-center border rounded-3 bg-light">
                  <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                  <small>Scanning for system printers...</small>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {printers.map((printer) => (
                    <div
                      key={printer.name}
                      className={`printer-card ${
                        settings.selectedPrinter === printer.name
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleChange("selectedPrinter", printer.name)
                      }
                    >
                      <i
                        className={`bi bi-${
                          printer.name.toLowerCase().includes("pdf")
                            ? "file-pdf"
                            : "printer"
                        } fs-4`}
                      ></i>
                      <div className="printer-details">
                        <span className="printer-name">{printer.name}</span>
                        {printer.isDefault && (
                          <span className="default-badge">DEFAULT</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="settings-card bg-white p-4 rounded-4 shadow-sm border mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h5 className="fw-bold mb-0 text-primary">
                <i className="bi bi-layers-half me-2"></i>Template Mapper
              </h5>
              <div className="text-muted small">
                Assign a default style for each paper size
              </div>
            </div>

            {(() => {
              const sizes = [ "A5"];
              const templatesBySize = {
                A4: [
                  {
                    id: "standard",
                    label: "Standard Invoice",
                    desc: "Classic style",
                  },
                  {
                    id: "professional",
                    label: "Professional",
                    desc: "Bold headers",
                  },
                  {
                    id: "modern",
                    label: "Modern Template",
                    desc: "Minimalist",
                  },
                ],
                A5: [
                  { id: "standard_a5", label: "Compact A5", desc: "Half-page" },
                  {
                    id: "professional_a5",
                    label: "Pro A5",
                    desc: "Corporate A5",
                  },
                  {
                    id: "modern_a5",
                    label: "Modern A5",
                    desc: "Clean A5 style",
                  },
                ],
                Letter: [
                  { id: "standard", label: "US Letter Std", desc: "Standard" },
                  {
                    id: "professional",
                    label: "US Letter Pro",
                    desc: "Professional",
                  },
                ],
              };

              return sizes.map((size) => (
                <div
                  key={size}
                  className="paper-size-mapping-block mb-4 p-3 rounded-4 bg-light bg-opacity-50 border"
                >
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span
                      className="badge bg-primary px-3 py-2 rounded-3"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {size}
                    </span>
                    <span className="text-dark small fw-bold text-uppercase opacity-75">
                      Template Mapper
                    </span>
                  </div>
                  <div className="template-selector-grid">
                    {(templatesBySize[size] || []).map((tmpl) => {
                      const isSelected =
                        (settings.templateMap?.[size] ||
                          (size === "A4" ? "standard" : "")) === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          className={`template-option-v2 ${isSelected ? "active" : ""}`}
                          onClick={() => {
                            const newMap = {
                              ...(settings.templateMap || {}),
                              [size]: tmpl.id,
                            };
                            handleChange("templateMap", newMap);
                            // Set this as active preview
                            handleChange("paperSize", size);
                            handleChange("billTemplate", "dynamic");
                          }}
                        >
                          <div className="tmpl-info">
                            <div className="tmpl-label">{tmpl.label}</div>
                            <div className="tmpl-desc">{tmpl.desc}</div>
                          </div>
                          <i
                            className={`bi bi-${isSelected ? "check-circle-fill text-primary" : "circle text-muted"}`}
                          ></i>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="settings-card bg-white p-4 rounded-4 shadow-sm border mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
              <i className="bi bi-gear-wide-connected me-2"></i>Operation
              Settings
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <div className="setting-toggle-card p-3 rounded-3 border bg-light bg-opacity-25 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold small">Auto-Print</div>
                    <div className="text-muted extra-small">
                      Silent printing on save
                    </div>
                  </div>
                  <div className="form-check form-switch ps-0">
                    <input
                      className="form-check-input ms-0"
                      type="checkbox"
                      checked={settings.autoPrint}
                      onChange={() => handleToggle("autoPrint")}
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="setting-toggle-card p-3 rounded-3 border bg-light bg-opacity-25 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold small">Barcode Scanner</div>
                    <div className="text-muted extra-small">
                      Enable input detection
                    </div>
                  </div>
                  <div className="form-check form-switch ps-0">
                    <input
                      className="form-check-input ms-0"
                      type="checkbox"
                      checked={settings.barcodeScanner}
                      onChange={() => handleToggle("barcodeScanner")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 border rounded-4 bg-white shadow-sm">
              <h6 className="fw-bold small mb-3 text-uppercase text-primary border-bottom pb-2">
                Print Intelligence
              </h6>
              <div className="info-list">
                <div className="info-item">
                  <span className="label">Print Environment:</span>
                  <span className="value">
                    {window.electron ? "Desktop (Silent)" : "Web (Dialog)"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Active Size:</span>
                  <span className="value fw-bold">{settings.paperSize}</span>
                </div>
                <div className="info-item">
                  <span className="label">Mapped Template:</span>
                  <span className="value fw-bold text-primary">
                    {settings.templateMap?.[
                      settings.paperSize
                    ]?.toUpperCase() || "STANDARD"}
                  </span>
                </div>
              </div>
            </div>
        </div>

        <div className="col-5">
          <div className="sticky-top" style={{ top: "1rem", zIndex: 10 }}>
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <h6
                className="fw-bold mb-0 text-uppercase text-muted small"
                style={{ letterSpacing: "1px" }}
              >
                Preview Inspector
              </h6>
              <select
                className="form-select form-select-sm w-auto border-0 bg-transparent fw-bold text-primary"
                value={settings.paperSize}
                onChange={(e) => handleChange("paperSize", e.target.value)}
              >
                <option value="A5">A5</option>
              </select>
            </div>
            <LiveTemplatePreview
              settings={settings}
              sale={dummySale}
              branchInfo={branchInfo}
              scale={0.35}
            />

            
          </div>
        </div>
      </div>

      <style>{`
        .settings-card { transition: all 0.3s ease; }
        .printer-card {
           flex: 1;
           min-width: 160px;
           padding: 12px;
           border: 2px solid #f1f5f9;
           border-radius: 12px;
           cursor: pointer;
           display: flex;
           align-items: center;
           gap: 12px;
           transition: all 0.2s ease;
           background: white;
        }
        .printer-card:hover { border-color: #cbd5e1; background: #f8fafc; }
        .printer-card.active { border-color: #6366f1; background: #f5f3ff; }
        .printer-name { font-size: 0.8rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
        .default-badge { font-size: 0.6rem; color: #6366f1; font-weight: 800; }
        
        .template-selector-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .template-option-v2 { 
           padding: 12px; 
           border: 1px solid #e2e8f0; 
           border-radius: 12px; 
           display: flex; 
           justify-content: space-between; 
           align-items: center; 
           cursor: pointer; 
           background: white;
           transition: all 0.2s ease;
        }
        .template-option-v2:hover { border-color: #6366f1; transform: translateY(-1px); }
        .template-option-v2.active { border-color: #6366f1; background: #f5f3ff; border-width: 2px; padding: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .tmpl-label { font-size: 0.85rem; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
        .tmpl-desc { font-size: 0.7rem; color: #64748b; }
        
        .extra-small { font-size: 0.7rem; }
        .info-list { display: flex; flex-direction: column; gap: 10px; }
        .info-item { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
        .info-item:last-child { border-bottom: none; }
        .info-item .label { font-size: 0.75rem; color: #64748b; }
        .info-item .value { font-size: 0.75rem; font-weight: 600; color: #0f172a; }

        .paper-size-mapping-block { transition: all 0.2s ease; border: 1px solid transparent; }
        .paper-size-mapping-block:hover { border-color: #e2e8f0 !important; background-opacity: 0.8 !important; }
      `}</style>
    </div>
  );
};

export default HardwareSettings;
