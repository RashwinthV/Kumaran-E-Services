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
  isA5 = false,
}) => {
  return `
    <div class="invoice-box modern-style ${isA5 ? "a5-variant" : ""}">
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
            <p><strong>${branchDetails.branchName}</strong></p>
            <p class="sub">${branchDetails.address}</p>
            <p class="sub">Ph: ${branchDetails.contact}</p>
            <div class="modern-staff-tag">
              <span>Billed By: ${staffName}</span>
            </div>
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
                <td style="padding-left: 15px;">
                  <div style="font-weight: 700;">${p.name || "Item"}</div>
                  ${
                    p.details?.photoId
                      ? `<div style="font-size: 0.7rem; color: #444;">ID: ${p.details.photoId}</div>`
                      : ""
                  }
                  ${
                    p.details?.summary
                      ? `<div style="font-size: 0.75rem; color: #666; font-weight: 400;">${p.details.summary.replace(
                          p.name + " | ",
                          "",
                        )}</div>`
                      : ""
                  }
                </td>
                  <td class="text-center">${p.qty || 0}</td>
                  <td class="text-right" style="padding-right: 15px;">${currencySymbol}${Number(
                    p.lineTotal || 0,
                  ).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="modern-footer-grid">
          <div class="modern-terms">
             <h5>Terms & Conditions</h5>
             <p>1. Goods once sold will not be taken back or exchanged.<br>
                2. Warranty, if any, will be provided by the manufacturer directly.<br>
                3. Subject to local jurisdiction.</p>
          </div>
          <div class="modern-summary">
            <div class="modern-summary-item"><span>Subtotal</span><span>${currencySymbol}${subtotal.toFixed(
              2,
            )}</span></div>
            <div class="modern-summary-item"><span>GST Amount</span><span>${currencySymbol}${tax.toFixed(
              2,
            )}</span></div>
            ${
              discount > 0
                ? `<div class="modern-summary-item"><span>Discount Applied</span><span>-${currencySymbol}${discount.toFixed(
                    2,
                  )}</span></div>`
                : ""
            }
            ${
              Math.abs(roundingValue) > 0.01
                ? `<div class="modern-summary-item"><span>Rounding</span><span>${currencySymbol}${roundingValue.toFixed(
                    2,
                  )}</span></div>`
                : ""
            }
            <div class="modern-summary-item modern-total"><span>TOTAL </span><span>${currencySymbol}${amount.toFixed(
              2,
            )}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
};
