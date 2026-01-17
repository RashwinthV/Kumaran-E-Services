export const ProfessionalTemplate = ({
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
    <div class="invoice-box professional-style">
      <div class="pro-header">
        <div class="pro-logo-section">
          <h1>${branchDetails.name}</h1>
          <p class="pro-tagline">${branchDetails.branchName}</p>
        </div>
        <div class="pro-invoice-title text-right">
          <h2 class="title-accent">INVOICE</h2>
          <p class="bill-no-accent">Invoice No: ${sale.billNo}</p>
        </div>
      </div>
      
      <div class="pro-details-grid">
        <div class="pro-detail-col">
          <h4 class="pro-label">OUR DETAILS</h4>
          <p>Contact: ${branchDetails.contact}</p>
          ${
            branchDetails.gstNumber
              ? `<p>GSTIN: ${branchDetails.gstNumber}</p>`
              : ""
          }
        </div>
        <div class="pro-detail-col">
          <h4 class="pro-label">BILL TO</h4>
          <p><strong>${sale.customerName}</strong></p>
          <p>${sale.customerPhone}</p>
        </div>
        <div class="pro-detail-col text-right">
          <h4 class="pro-label">DATE</h4>
          <p>${sale.formattedDate}</p>
          <p>${sale.time}</p>
          <p style="margin-top: 10px;"><strong>Billed By:</strong> ${staffName}</p>
        </div>
      </div>

      <table class="pro-table">
        <thead>
          <tr>
            <th style="width: 50%;">DESCRIPTION</th>
            <th class="text-center" style="width: 10%;">QTY</th>
            <th class="text-right" style="width: 20%;">RATE</th>
            <th class="text-right" style="width: 20%;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${(sale.products || [])
            .map(
              (p) => `
            <tr>
              <td>
                <div class="pro-item-name">${p.name || "Item"}</div>
                ${p.sku ? `<small class="pro-item-sku">${p.sku}</small>` : ""}
              </td>
              <td class="text-center">${p.qty || 0}</td>
              <td class="text-right">${currencySymbol}${Number(
                p.price || 0
              ).toFixed(2)}</td>
              <td class="text-right">${currencySymbol}${Number(
                p.lineTotal || 0
              ).toFixed(2)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="pro-footer">
        <div class="pro-payment-info">
          <h4 class="pro-label">PAYMENT METHOD</h4>
          <p>${sale.paymentMode || "Cash"} - ${sale.status || "Paid"}</p>
        </div>
        <div class="pro-totals">
          <div class="pro-total-row"><span>SUB TOTAL</span><span>${currencySymbol}${subtotal.toFixed(
    2
  )}</span></div>
          <div class="pro-total-row"><span>TAX (GST)</span><span>${currencySymbol}${tax.toFixed(
    2
  )}</span></div>
          ${
            discount > 0
              ? `<div class="pro-total-row" style="color: #000;"><span>DISCOUNT (-)</span><span>${currencySymbol}${discount.toFixed(
                  2
                )}</span></div>`
              : ""
          }
          ${
            Math.abs(roundingValue) > 0.01
              ? `<div class="pro-total-row"><span>ROUNDING</span><span>${currencySymbol}${roundingValue.toFixed(
                  2
                )}</span></div>`
              : ""
          }
          <div class="pro-total-row pro-grand-total"><span>TOTAL AMOUNT</span><span>${currencySymbol}${amount.toFixed(
    2
  )}</span></div>
        </div>
      </div>
    </div>
  `;
};
