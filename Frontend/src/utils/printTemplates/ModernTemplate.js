export const ModernTemplate = ({
  sale,
  branchDetails,
  currencySymbol,
  subtotal,
  tax,
  discount,
  roundingValue,
  amount,
  staffName,
}) => {
  return `
    <div class="invoice-box modern-style">
      <div class="modern-top-bar"></div>
      <div class="modern-body">
        <div class="modern-header">
          <div class="modern-brand">
            <div class="modern-logo">${branchDetails.name.charAt(0)}</div>
            <div class="modern-brand-info">
              <h2 style="margin: 0; line-height: 1;">${branchDetails.name}</h2>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 0.85rem; font-weight: 600;">${
                branchDetails.branchName
              }</p>
            </div>
          </div>
          <div class="modern-meta">
            <span class="modern-bill-badge">INV-${sale.billNo}</span>
            <p class="modern-date">${sale.formattedDate}</p>
          </div>
        </div>
        
        <div class="modern-contacts">
          <div class="modern-contact-card">
            <h5>FROM</h5>
            <p><strong>${branchDetails.name}</strong></p>
            <p class="sub">${branchDetails.address}</p>
          </div>
          <div class="modern-contact-card">
            <h5>FOR</h5>
            <p><strong>${sale.customerName}</strong></p>
            <p class="sub">${sale.customerPhone}</p>
          </div>
        </div>

        <div class="modern-table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th style="padding-left: 15px;">ITEM</th>
                <th class="text-center">QTY</th>
                <th class="text-right" style="padding-right: 15px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${(sale.products || [])
                .map(
                  (p) => `
                <tr>
                  <td style="padding-left: 15px;">${p.name || "Item"}</td>
                  <td class="text-center">${p.qty || 0}</td>
                  <td class="text-right" style="padding-right: 15px;">${currencySymbol}${Number(
                    p.lineTotal || 0
                  ).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="modern-summary">
          <div class="modern-summary-item"><span>Subtotal</span><span>${currencySymbol}${subtotal.toFixed(
    2
  )}</span></div>
          ${
            discount > 0
              ? `<div class="modern-summary-item"><span>Discount Applied</span><span>-${currencySymbol}${discount.toFixed(
                  2
                )}</span></div>`
              : ""
          }
          <div class="modern-summary-item"><span>GST Amount</span><span>${currencySymbol}${tax.toFixed(
    2
  )}</span></div>
          ${
            Math.abs(roundingValue) > 0.01
              ? `<div class="modern-summary-item"><span>Rounding</span><span>${currencySymbol}${roundingValue.toFixed(
                  2
                )}</span></div>`
              : ""
          }
          <div class="modern-summary-item modern-total"><span>TOTAL PAYABLE</span><span>${currencySymbol}${amount.toFixed(
    2
  )}</span></div>
          <div class="modern-summary-item" style="border-top: 1px dashed #ddd; margin-top: 10px; padding-top: 5px;">
            <span>Billed By:</span>
            <span>${staffName}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};
