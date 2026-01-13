import React from "react";
import "../../Styles/PrintTemplates.css";

const PrintTemplate = ({ sale, settings, branchInfo }) => {
  const { paperSize, billTemplate } = settings;
  const currencySymbol = settings.currency
    ? settings.currency.match(/\(([^)]+)\)/)?.[1] || "₹"
    : "₹";

  const amount = Number(sale.amount || 0);
  const tax = Number(sale.totalTax || 0);
  const discount = Number(sale.discount || 0);

  // Sum of item totals to detect rounding
  const itemsTotal = (sale.products || []).reduce(
    (sum, p) => sum + Number(p.lineTotal || 0),
    0
  );
  const roundingValue = amount - itemsTotal;

  // Subtotal calculation (matches printUtils logic)
  const subtotal = amount - tax + discount - roundingValue;

  const staffName = sale.staffName || sale.staff?.name || "Staff";

  // Address cleanup
  const formattedAddress = branchInfo?.address
    ? typeof branchInfo.address === "string"
      ? branchInfo.address
      : [branchInfo.address.street, branchInfo.address.city]
          .filter((p) => p && p.trim())
          .join(", ")
    : "Local Branch St, City";

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
    };

    switch (billTemplate) {
      case "professional":
        return <ProfessionalInvoice {...props} />;
      case "preview":
        return <ModernPreviewInvoice {...props} />;
      default:
        return <StandardInvoice {...props} />;
    }
  };

  return (
    <div
      className={`print-container ${paperSize.toLowerCase()} template-${billTemplate} color-${
        settings.colorMode || "color"
      }`}
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
}) => (
  <div className="invoice-box standard-style">
    <div className="invoice-header">
      <div className="branch-info">
        <h2>Kumaran E-Services</h2>
        <p>{formattedAddress}</p>
        <p>Ph: {branchInfo?.contact?.phone || branchInfo?.contact}</p>
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
          <th>Item</th>
          <th className="text-center">Qty</th>
          <th className="text-right">Price</th>
          <th className="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {sale.products?.map((p, i) => (
          <tr key={i}>
            <td>{p.name}</td>
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
}) => (
  <div className="invoice-box professional-style">
    <div className="pro-header">
      <div className="pro-logo-section">
        <h1>Kumaran E-Services</h1>
        <p className="pro-tagline">Professional Business Services</p>
      </div>
      <div className="pro-invoice-title">
        <h2 className="title-accent">INVOICE</h2>
        <p className="bill-no-accent">Invoice No: {sale.billNo}</p>
      </div>
    </div>

    <div className="pro-details-grid">
      <div className="pro-detail-col">
        <h4 className="pro-label">OUR DETAILS</h4>
        <p className="fs-5 small">Branch : {branchInfo?.name}</p>
        <p>{formattedAddress}</p>
        <p>Contact: {branchInfo?.contact?.phone || branchInfo?.contact}</p>
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
          <th>DESCRIPTION</th>
          <th className="text-center">QTY</th>
          <th className="text-right">RATE</th>
          <th className="text-right">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {sale.products?.map((p, i) => (
          <tr key={i}>
            <td>
              <div className="pro-item-name">{p.name}</div>
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
          {sale.paymentMode || "Unknown"} - {sale.status || "Paid"}
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
          <span>TOTAL AMOUNT</span>
          <span>
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
}) => (
  <div className="invoice-box modern-style">
    <div className="modern-top-bar"></div>
    <div className="modern-body">
      <div className="modern-header">
        <div className="modern-brand">
          <div className="modern-logo">{branchInfo?.name?.charAt(0)}</div>
          <h4>Kumaran E-Services</h4>
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
                <td>{p.name}</td>
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
        <div
          className="modern-summary-item"
          style={{
            borderTop: "1px dashed #ddd",
            marginTop: "10px",
            paddingTop: "5px",
          }}
        >
          <span>Billed By:</span>
          <span>{staffName}</span>
        </div>
      </div>
    </div>
  </div>
);

export default PrintTemplate;
