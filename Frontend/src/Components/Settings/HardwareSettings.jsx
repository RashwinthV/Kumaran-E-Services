import React, { useState, useEffect } from "react";
import PrintTemplate from "../Billing/PrintTemplate";
import { getSystemPrinters } from "../../utils/printerService";

const TemplatePreview = ({ settings, branchInfo }) => {
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

  // Calculate scale based on paper size and orientation to fit the preview container
  let scale = 0.35;
  if (settings.paperSize === "A5") scale = 0.5;
  if (settings.orientation === "landscape") scale = scale * 0.7; // Shrink more for landscape to fit width

  return (
    <div className="mini-preview-container mt-4 p-3 bg-white rounded-4 border shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
          <i className="bi bi-eye me-2 text-primary"></i>Live Template Preview
        </h5>
        <span
          className="badge bg-light text-primary border border-primary-subtle"
          style={{ fontSize: "0.75rem" }}
        >
          {settings.billTemplate?.toUpperCase()}
        </span>
      </div>
      <div
        className="preview-outer shadow-inner"
        style={{
          height: "400px",
          overflow: "auto",
          background: "#f1f5f9",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
          border: "1px inset rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: "fit-content",
            height: "fit-content",
            background: "white",
            boxShadow:
              "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          }}
        >
          <PrintTemplate
            sale={dummySale}
            settings={settings}
            branchInfo={branchInfo}
          />
        </div>
      </div>
      <div
        className="d-flex align-items-center gap-2 mt-3 text-muted"
        style={{ fontSize: "0.75rem" }}
      >
        <i className="bi bi-info-circle-fill text-primary"></i>
        <span>This preview updates instantly when you change settings.</span>
      </div>
    </div>
  );
};

const HardwareSettings = ({
  settings,
  handleChange,
  handleToggle,
  branchInfo,
}) => {
  const [printers, setPrinters] = useState([]);
  const [loadingPrinters, setLoadingPrinters] = useState(true);

  useEffect(() => {
    const fetchPrinters = async () => {
      setLoadingPrinters(true);
      const systemPrinters = await getSystemPrinters();
      setPrinters(systemPrinters);
      setLoadingPrinters(false);

      // If no printer is selected yet, pick the default one
      if (!settings.selectedPrinter && systemPrinters.length > 0) {
        const defaultPrinter =
          systemPrinters.find((p) => p.isDefault) || systemPrinters[0];
        handleChange("selectedPrinter", defaultPrinter.name);
      }
    };

    fetchPrinters();
  }, []);

  const selectedPrinterInfo = printers.find(
    (p) => p.name === settings.selectedPrinter
  );

  return (
    <div className="settings-section">
      <div className="row g-4">
        <div className="col-lg-7">
          <h3 className="settings-section-title mb-4">
            Hardware & POS Settings
          </h3>
          <div className="mt-4 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <label className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-upc-scan text-primary"></i>
                  Barcode Scanner Support
                </label>
                <p className="text-muted small mb-0">
                  Enable automatic detection of barcode scanner input
                </p>
              </div>
              <div className="form-check form-switch fs-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.barcodeScanner}
                  onChange={() => handleToggle("barcodeScanner")}
                />
              </div>
            </div>
          </div>
          <hr className="my-4 opacity-50" />

          <div className="settings-card bg-white p-4 rounded-4 shadow-sm border mb-4">
            <h5 className="fw-bold mb-3 border-bottom pb-2">
              Printing Configuration
            </h5>

            <div className="setting-row-v2 mb-4">
              <div className="setting-info">
                <label className="fw-bold d-block mb-1">
                  Select Output Printer
                </label>
                <p className="text-muted small mb-2">
                  Switch between different connected printers
                </p>
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
            </div>

            <div className="row g-3">
              <div className="col-md-3">
                <label className="fw-bold small text-muted text-uppercase mb-2">
                  Paper Size
                </label>
                <select
                  className="form-select settings-select-v2"
                  value={settings.paperSize}
                  onChange={(e) => handleChange("paperSize", e.target.value)}
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="fw-bold small text-muted text-uppercase mb-2">
                  Color Mode
                </label>
                <select
                  className="form-select settings-select-v2"
                  value={settings.colorMode || "color"}
                  onChange={(e) => handleChange("colorMode", e.target.value)}
                >
                  <option value="color">Color</option>
                  <option value="bw">B&W</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="fw-bold small text-muted text-uppercase mb-2">
                  Margins
                </label>
                <select
                  className="form-select settings-select-v2"
                  value={settings.printMargin || "none"}
                  onChange={(e) => handleChange("printMargin", e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="5mm">Narrow</option>
                  <option value="10mm">Normal</option>
                  <option value="20mm">Wide</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="fw-bold small text-muted text-uppercase mb-2">
                  Orientation
                </label>
                <select
                  className="form-select settings-select-v2"
                  value={settings.orientation || "portrait"}
                  onChange={(e) => handleChange("orientation", e.target.value)}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="setting-row-v2 mb-4">
              <div className="setting-info">
                <label className="fw-bold d-block mb-1">
                  Bill Template Style
                </label>
                <div className="template-selector-grid mt-2">
                  {[
                    {
                      id: "standard",
                      label: "Standard",
                      desc: "Classic layout",
                    },
                    {
                      id: "professional",
                      label: "Professional",
                      desc: "Corporate look",
                    },
                    { id: "preview", label: "Modern", desc: "Clean & fresh" },
                  ].map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className={`template-option ${
                        settings.billTemplate === tmpl.id ? "active" : ""
                      }`}
                      onClick={() => handleChange("billTemplate", tmpl.id)}
                    >
                      <div className="tmpl-label">{tmpl.label}</div>
                      <i
                        className={`bi bi-${
                          settings.billTemplate === tmpl.id
                            ? "check-circle-fill text-primary"
                            : "circle text-muted"
                        }`}
                      ></i>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="setting-row-toggle d-flex justify-content-between align-items-center mb-3">
              <div>
                <label className="fw-bold mb-0">Auto-Print on Save</label>
                <p className="text-muted small mb-0">
                  Bypass print dialog in Electron mode
                </p>
              </div>
              <div className="form-check form-switch fs-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.autoPrint}
                  onChange={() => handleToggle("autoPrint")}
                />
              </div>
            </div>
          </div>

          <div className="printer-info-card bg-primary bg-opacity-10 p-4 rounded-4 border border-primary border-opacity-25">
            <div className="d-flex align-items-center gap-3">
              <div className="printer-icon-bg">
                <i className="bi bi-cpu-fill text-primary fs-3"></i>
              </div>
              <div>
                <h6 className="fw-bold text-primary mb-1">
                  Active Printer Profile
                </h6>
                <p className="mb-0 text-dark opacity-75 small">
                  Using <b>{settings.selectedPrinter}</b> for{" "}
                  <b>{settings.billTemplate}</b> bills.
                  {selectedPrinterInfo && (
                    <span className="ms-2 badge bg-success">
                      {selectedPrinterInfo.status || "Ready"}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <TemplatePreview settings={settings} branchInfo={branchInfo} />

          <div className="mt-4 p-4 border rounded-4 bg-white shadow-sm">
            <h6 className="fw-bold small mb-3 text-uppercase text-primary">
              System Interface Info
            </h6>
            <div className="info-list">
              <div className="info-item">
                <span className="label">Environment:</span>
                <span className="value">
                  {window.electron ? "Desktop App (Electron)" : "Web Browser"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Print Method:</span>
                <span className="value">
                  {window.electron ? "Silent Direct" : "Browser Dialog"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">OS Detection:</span>
                <span className="value">{navigator.platform}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .printer-selector {
           max-height: 200px;
           overflow-y: auto;
           padding: 5px;
        }
        .printer-card {
           flex: 1;
           min-width: 140px;
           padding: 12px;
           border: 2px solid #e2e8f0;
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
        .printer-details { display: flex; flex-direction: column; }
        .printer-name { font-size: 0.8rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
        .default-badge { font-size: 0.6rem; color: #6366f1; font-weight: 800; }
        
        .template-selector-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .template-option { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .template-option.active { border-color: #6366f1; background: #f5f3ff; }
        .tmpl-label { font-size: 0.8rem; font-weight: 600; }
        
        .info-list { display: flex; flex-direction: column; gap: 10px; }
        .info-item { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
        .info-item:last-child { border-bottom: none; }
        .info-item .label { font-size: 0.75rem; color: #64748b; }
        .info-item .value { font-size: 0.75rem; font-weight: 600; color: #0f172a; }

        .printer-icon-bg { width: 48px; height: 48px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .settings-select-v2 { border-radius: 10px; border: 2px solid #e2e8f0; padding: 8px; font-weight: 600; font-size: 0.9rem; }
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); }
      `}</style>
    </div>
  );
};

export default HardwareSettings;
