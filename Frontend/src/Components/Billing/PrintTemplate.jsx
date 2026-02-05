import React from "react";
import "../../Styles/PrintTemplates.css";

const PrintTemplate = ({ sale, settings, branchInfo }) => {
  const { paperSize } = settings;

  // Dynamic template selection based on map
  const billTemplate =
    settings.billTemplate === "dynamic"
      ? settings.templateMap?.[paperSize] || "standard"
      : settings.billTemplate || "standard";

  // Determine A5 mode: strictly true if paper is A5 OR template key has _a5
  const isA5 = paperSize === "A5" || billTemplate.includes("_a5");

  const currencySymbol = settings.currency
    ? settings.currency.match(/\(([^)]+)\)/)?.[1] || "₹"
    : "₹";

  const amount = Number(sale.amount || 0);
  const tax = Number(sale.totalTax || 0);
  const discount = Number(sale.discount || 0);

  // Sum of item totals to detect rounding
  const itemsTotal = (sale.products || []).reduce(
    (sum, p) => sum + Number(p.lineTotal || 0),
    0,
  );
  const roundingValue = amount - itemsTotal;

  // Subtotal calculation (matches printUtils logic)
  const subtotal = amount - tax + discount - roundingValue;

  const staffName = sale.staffName || sale.staff?.name || "Staff";

  // Robust address and contact formatting for React component
  const getBranchAddress = () => {
    if (!branchInfo?.address) return "Local Branch St, City";
    const addr = branchInfo.address;
    if (typeof addr === "string") return addr;
    return [addr.street, addr.city, addr.state, addr.pincode]
      .filter(Boolean)
      .join(", ");
  };

  const getBranchContact = () => {
    if (branchInfo?.contact?.phone) return branchInfo.contact.phone;
    if (branchInfo?.phone) return branchInfo.phone;
    if (typeof branchInfo?.contact === "string" && branchInfo.contact.trim())
      return branchInfo.contact;
    return "N/A";
  };

  const formattedAddress = getBranchAddress();
  const formattedContact = getBranchContact();

  const paperDimensions = {
    A4: { portrait: ["210mm", "297mm"], landscape: ["297mm", "210mm"] },
    A5: { portrait: ["148mm", "210mm"], landscape: ["210mm", "148mm"] },
    Letter: { portrait: ["216mm", "279mm"], landscape: ["279mm", "216mm"] },
    "80mm": { portrait: ["80mm", "auto"], landscape: ["80mm", "auto"] },
    "58mm": { portrait: ["58mm", "auto"], landscape: ["58mm", "auto"] },
  };

  const currentOrientation = settings.orientation || "portrait";
  const [width, height] = paperDimensions[paperSize]
    ? paperDimensions[paperSize][currentOrientation]
    : paperDimensions["A4"][currentOrientation];

  const paddingValue =
    settings.printMargin === "none" ? "0mm" : settings.printMargin || "0mm";

  const containerStyle = {
    width: width,
    minHeight: height,
    padding: paddingValue,
    "--print-padding": paddingValue, // For negative margins in templates
    position: "relative",
    overflow: "hidden",
  };

  const renderTemplate = () => {
    const props = {
      sale,
      branchInfo,
      currencySymbol,
      amount,
      tax,
      discount,
      roundingValue,
      subtotal,
      staffName,
      formattedAddress,
      formattedContact,
    };

    switch (billTemplate) {
      case "professional":
      case "professional_a5":
        return <ProfessionalInvoice {...props} isA5={isA5} />;
      case "preview":
      case "modern":
      case "modern_a5":
        return <ModernPreviewInvoice {...props} isA5={isA5} />;
      case "standard":
      case "standard_a5":
        return <StandardInvoice {...props} isA5={isA5} />;
      case "thermal":
      case "thermal_compact":
      case "thermal_detailed":
      case "thermal_eco":
        return (
          <ThermalReceipt
            {...props}
            compact={
              billTemplate === "thermal_compact" ||
              billTemplate === "thermal_eco"
            }
            detailed={billTemplate === "thermal_detailed"}
            eco={billTemplate === "thermal_eco"}
          />
        );
      default:
        return <StandardInvoice {...props} isA5={isA5} />;
    }
  };

  return (
    <div
      className={`print-container template-${billTemplate} color-${
        settings.colorMode || "color"
      }`}
      style={containerStyle}
    >
      {renderTemplate()}
    </div>
  );
};

const StandardInvoice = ({
  sale,
  branchInfo,
  currencySymbol,
  amount,
  tax,
  discount,
  roundingValue,
  subtotal,
  staffName,
  formattedAddress,
  formattedContact,
  isA5 = false,
}) => (
  <div className={`invoice-box standard-style ${isA5 ? "a5-variant" : ""}`}>
    <div className="invoice-header">
      <div className="branch-info">
        <h2 style={{ marginBottom: "2px" }}>Kumaran E-Services</h2>
        <h4
          style={{
            margin: "0 0 8px 0",
            color: "#444",
            fontWeight: "600",
            fontSize: "1rem",
          }}
        >
          {branchInfo?.name || "Main Branch"}
        </h4>
        <p>{formattedAddress}</p>
        <p>Ph: {formattedContact}</p>
        {branchInfo?.gstNumber && (
          <p>
            <strong>GSTIN: {branchInfo.gstNumber}</strong>
          </p>
        )}
      </div>
      <div className="bill-info text-right">
        <h1>TAX INVOICE</h1>
        <p># {sale.billNo}</p>
        <p>{sale.formattedDate}</p>
      </div>
    </div>
    <div className="customer-section">
      <div>
        <small className="text-muted d-block uppercase">BILL TO</small>
        <strong>{sale.customerName}</strong>
        <p className="mb-0">{sale.customerPhone}</p>
      </div>
      <div className="text-right">
        <small className="text-muted d-block uppercase">PAYMENT</small>
        <strong>{sale.paymentMode || "Unknown"}</strong>
        <p className="mb-0 status-text">{sale.status || "Paid"}</p>
        <p style={{ marginTop: "5px", fontSize: "0.8rem", color: "#444" }}>
          Billed By: {staffName}
        </p>
      </div>
    </div>
    <table className="items-table">
      <thead>
        <tr>
          <th style={{ width: "50%" }}>Item Description</th>
          <th className="text-center" style={{ width: "10%" }}>
            Qty
          </th>
          <th className="text-right" style={{ width: "20%" }}>
            Price
          </th>
          <th className="text-right" style={{ width: "20%" }}>
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {sale.products?.map((p, i) => (
          <tr key={i}>
            <td>
              <div>{p.name}</div>
              {p.imei && (
                <small
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    display: "block",
                    marginTop: "2px",
                  }}
                >
                  IMEI: {p.imei}
                </small>
              )}
            </td>
            <td className="text-center">{p.qty}</td>
            <td className="text-right">
              {currencySymbol}
              {Number(p.price || 0).toFixed(2)}
            </td>
            <td className="text-right">
              {currencySymbol}
              {Number(p.lineTotal || 0).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="invoice-footer">
      <div className="notes">
        <p>
          <strong>Terms:</strong> Standard business terms apply.
        </p>
      </div>
      <div
        className="invoice-footer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "30px",
          borderTop: "1px solid #eee",
          paddingTop: "15px",
        }}
      >
        <div className="notes" style={{ width: "60%" }}>
          <p
            style={{
              margin: "0 0 5px 0",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: "#444",
            }}
          >
            Terms & Conditions:
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            1. Goods once sold will not be taken back.
            <br />
            2. Warranty if any is provided by the manufacturer.
            <br />
            3. Subject to local jurisdiction.
          </p>
        </div>
        <div className="totals-box">
          <div className="total-row">
            <span>Subtotal</span>
            <span>
              {currencySymbol}
              {subtotal.toFixed(2)}
            </span>
          </div>
          {discount > 0 && (
            <div className="total-row discount-row text-success">
              <span>Discount (-)</span>
              <span>
                {currencySymbol}
                {discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="total-row">
            <span>GST</span>
            <span>
              {currencySymbol}
              {tax.toFixed(2)}
            </span>
          </div>
          {Math.abs(roundingValue) > 0.01 && (
            <div className="total-row">
              <span>Rounding</span>
              <span>
                {currencySymbol}
                {roundingValue.toFixed(2)}
              </span>
            </div>
          )}
          <div className="total-row grand-total">
            <span>GRAND TOTAL</span>
            <span>
              {currencySymbol}
              {amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProfessionalInvoice = ({
  sale,
  branchInfo,
  currencySymbol,
  amount,
  tax,
  discount,
  roundingValue,
  subtotal,
  staffName,
  formattedAddress,
  formattedContact,
  isA5 = false,
}) => (
  <div className={`invoice-box professional-style ${isA5 ? "a5-variant" : ""}`}>
    <div className="pro-header">
      <div className="pro-logo-section">
        <h1>Kumaran E-Services</h1>
        <p className="pro-tagline">{branchInfo?.name || "Main Branch"}</p>
      </div>
      <div className="pro-invoice-title">
        <h2 className="title-accent">INVOICE</h2>
        <p className="bill-no-accent">Invoice No: {sale.billNo}</p>
      </div>
    </div>

    <div className="pro-details-grid">
      <div className="pro-detail-col">
        <h4 className="pro-label">OUR DETAILS</h4>
        <p
          style={{
            textTransform: "uppercase",
            fontWeight: "700",
            marginBottom: "2px",
          }}
        >
          {branchInfo?.name}
        </p>
        <p style={{ marginBottom: "6px" }}>{formattedAddress}</p>
        <p>Contact: {formattedContact}</p>
        {branchInfo?.gstNumber && <p>GSTIN: {branchInfo.gstNumber}</p>}
      </div>
      <div className="pro-detail-col">
        <h4 className="pro-label">BILL TO</h4>
        <p>
          <strong>{sale.customerName}</strong>
        </p>
        <p>{sale.customerPhone}</p>
      </div>
      <div className="pro-detail-col text-right">
        <h4 className="pro-label">DATE</h4>
        <p>{sale.formattedDate}</p>
        <p>{sale.time}</p>
        <p style={{ marginTop: "10px" }}>
          <strong>Billed By:</strong> {staffName}
        </p>
      </div>
    </div>

    <table className="pro-table">
      <thead>
        <tr>
          <th style={{ width: "50%" }}>DESCRIPTION</th>
          <th className="text-center" style={{ width: "10%" }}>
            QTY
          </th>
          <th className="text-right" style={{ width: "20%" }}>
            RATE
          </th>
          <th className="text-right" style={{ width: "20%" }}>
            AMOUNT
          </th>
        </tr>
      </thead>
      <tbody>
        {sale.products?.map((p, i) => (
          <tr key={i}>
            <td>
              <div className="pro-item-name">{p.name}</div>
              {p.imei && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#555",
                    marginTop: "2px",
                  }}
                >
                  IMEI: {p.imei}
                </div>
              )}
              {p.sku && <small className="pro-item-sku">{p.sku}</small>}
            </td>
            <td className="text-center">{p.qty}</td>
            <td className="text-right">
              {currencySymbol}
              {Number(p.price || 0).toFixed(2)}
            </td>
            <td className="text-right">
              {currencySymbol}
              {Number(p.lineTotal || 0).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="pro-footer">
      <div className="pro-payment-info">
        <h4 className="pro-label">PAYMENT METHOD</h4>
        <p>
          {sale.paymentMode || "Cash"} - {sale.status || "Paid"}
        </p>
      </div>
      <div className="pro-terms-preview" style={{ marginTop: "15px" }}>
        <h4
          className="pro-label"
          style={{ fontSize: "0.75rem", color: "#666", marginBottom: "5px" }}
        >
          TERMS & CONDITIONS
        </h4>
        <p
          style={{
            fontSize: "0.7rem",
            color: "#444",
            lineHeight: "1.4",
            margin: 0,
          }}
        >
          1. Goods once sold will not be taken back.
          <br />
          2. Warranty if any is provided by the manufacturer.
          <br />
          3. Subject to local jurisdiction.
        </p>
      </div>
      <div className="pro-totals">
        <div className="pro-total-row">
          <span>SUB TOTAL</span>
          <span>
            {currencySymbol}
            {subtotal.toFixed(2)}
          </span>
        </div>
        {discount > 0 && (
          <div className="pro-total-row discount-row text-success">
            <span>DISCOUNT (-)</span>
            <span>
              {currencySymbol}
              {discount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="pro-total-row">
          <span>TAX (GST)</span>
          <span>
            {currencySymbol}
            {tax.toFixed(2)}
          </span>
        </div>
        {Math.abs(roundingValue) > 0.01 && (
          <div className="pro-total-row">
            <span>ROUNDING</span>
            <span>
              {currencySymbol}
              {roundingValue.toFixed(2)}
            </span>
          </div>
        )}
        <div className="pro-total-row pro-grand-total">
          <span style={{ fontSize: "1.1rem" }}>TOTAL AMOUNT</span>
          <span style={{ fontSize: "1.25rem" }}>
            {currencySymbol}
            {amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const ModernPreviewInvoice = ({
  sale,
  branchInfo,
  currencySymbol,
  amount,
  tax,
  discount,
  roundingValue,
  subtotal,
  staffName,
  formattedAddress,
  formattedContact,
  isA5 = false,
}) => (
  <div className={`invoice-box modern-style ${isA5 ? "a5-variant" : ""}`}>
    <div className="modern-top-bar"></div>
    <div className="modern-body">
      <div className="modern-header">
        <div className="modern-brand">
          <div className="modern-logo">
            {branchInfo?.name?.charAt(0) || "K"}
          </div>
          <div className="modern-brand-info">
            <h4 style={{ margin: 0, lineHeight: 1 }}>
              {branchInfo?.name || "Kumaran E-Services"}
            </h4>
            <p
              style={{
                margin: "5px 0 0 0",
                color: "#666",
                fontSize: "0.85rem",
                fontWeight: "600",
              }}
            >
              {branchInfo?.name || "Main Branch"}
            </p>
          </div>
        </div>
        <div className="modern-meta">
          <span className="modern-bill-badge">INV-{sale.billNo}</span>
          <p className="modern-date">{sale.formattedDate}</p>
        </div>
      </div>

      <div className="modern-contacts">
        <div className="modern-contact-card">
          <h5>FROM</h5>
          <p>
            <strong>{branchInfo?.name}</strong>
          </p>
          <p className="sub">{formattedAddress}</p>
          <p className="sub">Ph: {formattedContact}</p>
        </div>
        <div className="modern-contact-card">
          <h5>FOR</h5>
          <p>
            <strong>{sale.customerName}</strong>
          </p>
          <p className="sub">{sale.customerPhone}</p>
        </div>
      </div>

      <div className="modern-table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th className="text-center">QTY</th>
              <th className="text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {sale.products?.map((p, i) => (
              <tr key={i}>
                <td>
                  <div>{p.name}</div>
                  {p.imei && (
                    <small
                      style={{
                        fontSize: "0.7rem",
                        opacity: 0.8,
                        display: "block",
                      }}
                    >
                      IMEI: {p.imei}
                    </small>
                  )}
                </td>
                <td className="text-center">{p.qty}</td>
                <td className="text-right">
                  {currencySymbol}
                  {Number(p.lineTotal || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="modern-footer-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "20px",
          marginTop: "20px",
          borderTop: "1px solid #eee",
          paddingTop: "15px",
        }}
      >
        <div className="modern-terms">
          <h5
            style={{
              fontSize: "0.85rem",
              margin: "0 0 8px 0",
              color: "#333",
              fontWeight: "700",
            }}
          >
            Terms & Conditions
          </h5>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            1. Goods once sold will be not taken back.
            <br />
            2. Warranty if any is provided by the manufacturer.
            <br />
            3. Subject to local jurisdiction.
          </p>
        </div>
        <div className="modern-summary">
          <div className="modern-summary-item">
            <span>Subtotal</span>
            <span>
              {currencySymbol}
              {subtotal.toFixed(2)}
            </span>
          </div>
          {discount > 0 && (
            <div className="modern-summary-item text-success">
              <span>Discount Applied</span>
              <span>
                -{currencySymbol}
                {discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="modern-summary-item">
            <span>GST Amount</span>
            <span>
              {currencySymbol}
              {tax.toFixed(2)}
            </span>
          </div>
          {Math.abs(roundingValue) > 0.01 && (
            <div className="modern-summary-item">
              <span>Rounding</span>
              <span>
                {currencySymbol}
                {roundingValue.toFixed(2)}
              </span>
            </div>
          )}
          <div className="modern-summary-item modern-total">
            <span>TOTAL PAYABLE</span>
            <span>
              {currencySymbol}
              {amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px dashed #ddd",
          marginTop: "10px",
          paddingTop: "5px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
        }}
      >
        <span>Billed By:</span>
        <span>{staffName}</span>
      </div>
    </div>
  </div>
);

const ThermalReceipt = ({
  sale,
  branchInfo,
  currencySymbol,
  amount,
  tax,
  discount,
  roundingValue,
  subtotal,
  staffName,
  formattedAddress,
  formattedContact,
  compact = false,
  detailed = false,
  eco = false,
}) => (
  <div
    className={`thermal-receipt ${compact ? "compact" : ""} ${eco ? "eco-mode" : ""}`}
  >
    <div className="receipt-header">
      <h3 className="branch-name" style={{ fontSize: eco ? "14px" : "18px" }}>
        Kumaran E-Services
      </h3>
      {!eco && (
        <p className="branch-sub">{branchInfo?.name || "Main Branch"}</p>
      )}
      {!compact && <p className="branch-detail">{formattedAddress}</p>}
      <p className="branch-detail">Ph: {formattedContact}</p>
    </div>

    <div className="receipt-divider"></div>

    <div className="receipt-meta">
      <p>
        <span>INV:</span> <span>{sale.billNo}</span>
      </p>
      <p>
        <span>Date:</span>{" "}
        <span>
          {eco ? sale.formattedDate : `${sale.formattedDate} ${sale.time}`}
        </span>
      </p>
      {!eco && (
        <p>
          <span>Staff:</span> <span>{staffName}</span>
        </p>
      )}
    </div>

    {detailed && (
      <>
        <div className="receipt-divider"></div>
        <div className="receipt-customer">
          <p>
            <span>Client:</span> <span>{sale.customerName}</span>
          </p>
        </div>
      </>
    )}

    <div className="receipt-divider"></div>

    <table className="receipt-table">
      <thead>
        <tr>
          <th className="text-left">{eco ? "Item" : "Description"}</th>
          <th className="text-center">Qty</th>
          <th className="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {sale.products?.map((p, i) => (
          <tr key={i}>
            <td className="text-left">
              <div className="item-name">{p.name}</div>
              {p.imei && (
                <div style={{ fontSize: "10px", marginTop: "2px" }}>
                  IMEI: {p.imei}
                </div>
              )}
              {detailed && p.sku && (
                <small className="item-sku">SKU: {p.sku}</small>
              )}
              {!compact && !eco && (
                <small className="item-price">
                  {p.qty} x {currencySymbol}
                  {Number(p.price || 0).toFixed(2)}
                </small>
              )}
            </td>
            <td className="text-center">{p.qty}</td>
            <td className="text-right">
              {currencySymbol}
              {Number(p.lineTotal || 0).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="receipt-divider"></div>

    <div className="receipt-summary">
      <div className="summary-row">
        <span>Subtotal</span>
        <span>
          {currencySymbol}
          {subtotal.toFixed(2)}
        </span>
      </div>
      {discount > 0 && (
        <div className="summary-row">
          <span>Discount</span>
          <span>
            -{currencySymbol}
            {discount.toFixed(2)}
          </span>
        </div>
      )}
      {!eco && (
        <div className="summary-row">
          <span>Tax</span>
          <span>
            {currencySymbol}
            {tax.toFixed(2)}
          </span>
        </div>
      )}
      <div className="summary-row total">
        <span>TOTAL</span>
        <span>
          {currencySymbol}
          {amount.toFixed(2)}
        </span>
      </div>
    </div>

    <div className="receipt-divider"></div>

    <div className="receipt-footer">
      <p className="text-center" style={{ fontSize: "0.9em" }}>
        {eco ? "Visit again!" : "--- Thank You! Come Again ---"}
      </p>
      {!eco && (
        <p className="powered text-center">Powered by Tharbyte Technologies</p>
      )}
    </div>

    <style>{`
      .thermal-receipt { padding: 4mm; color: #000; font-family: 'monospace'; font-size: 11px; }
      .compact { padding: 2mm; font-size: 10px; }
      .eco-mode { padding: 1mm; font-size: 9px; }
      .receipt-header { text-align: center; }
      .branch-name { margin: 0; text-transform: uppercase; }
      .receipt-divider { border-top: 1px dashed #000; margin: 2mm 0; }
      .receipt-meta p, .summary-row { display: flex; justify-content: space-between; margin: 0.5mm 0; }
      .receipt-table { width: 100%; }
      .item-name { font-weight: bold; }
      .summary-row.total { font-weight: bold; font-size: 1.2em; margin-top: 2mm; border-top: 1px solid #000; padding-top: 1mm; }
      .a5-variant { font-size: 12px; }
      .a5-variant .invoice-header { padding-bottom: 0.5rem; margin-bottom: 1rem; }
      .a5-variant table th, .a5-variant table td { padding: 6px; }
      .a5-variant .pro-header { padding: 1rem; margin-bottom: 1rem; }
    `}</style>
  </div>
);

export default PrintTemplate;
