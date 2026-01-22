export const StandardTemplate = ({
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
    <div class="invoice-box standard-style ${isA5 ? "a5-variant" : ""}">
      <div class="invoice-header">
        <div class="branch-info">
          <h2 style="margin-bottom: 2px;">${branchDetails.name}</h2>
          <h4 style="margin: 0 0 8px 0; color: #444; font-weight: 600;">${
            branchDetails.branchName
          }</h4>
          ${
            branchDetails.gstNumber
              ? `<p><strong>GSTIN: ${branchDetails.gstNumber}</strong></p>`
              : ""
          }
        </div>
        <div class="bill-info text-right">
          <h1>TAX INVOICE</h1>
          <p># ${sale.billNo}</p>
          <p>${sale.formattedDate}</p>
        </div>
      </div>
      <div class="customer-section">
         <div>
           <small class="text-muted d-block uppercase" style="font-size: 0.65rem; color: #666;">BILL TO</small>
           <strong>${sale.customerName}</strong>
           <p>${sale.customerPhone}</p>
         </div>
         <div style="text-align: right;">
           <small class="text-muted d-block uppercase" style="font-size: 0.65rem; color: #666;">PAYMENT</small>
           <strong>${sale.paymentMode || "Unknown"}</strong>
           <p>${sale.status || "Paid"}</p>
           <p style="margin-top: 5px; font-size: 0.8rem; color: #444;">Billed By: ${staffName}</p>
         </div>
      </div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 50%;">Item Description</th>
            <th class="text-center" style="width: 10%;">Qty</th>
            <th class="text-right" style="width: 20%;">Price</th>
            <th class="text-right" style="width: 20%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(sale.products || [])
            .map(
              (p) => `
            <tr>
              <td>
                <div style="font-weight: bold;">${p.name || "Item"}</div>
                ${
                  p.details?.photoId
                    ? `<div style="font-size: 0.75rem; color: #444;">Photo ID: ${p.details.photoId}</div>`
                    : ""
                }
                ${
                  p.details?.summary
                    ? `<div style="font-size: 0.75rem; color: #666;">${p.details.summary.replace(
                        p.name + " | ",
                        "",
                      )}</div>`
                    : ""
                }
              </td>
              <td class="text-center">${p.qty || 0}</td>
              <td class="text-right">${currencySymbol}${Number(
                p.price || 0,
              ).toFixed(2)}</td>
              <td class="text-right">${currencySymbol}${Number(
                p.lineTotal || 0,
              ).toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      <div class="invoice-footer" style="display: flex; justify-content: space-between; margin-top: 30px;">
         <div class="notes" style="width: 50%;">
           <p><b>Terms & Conditions:</b></p>
           <p style="font-size: 0.8rem;">1. Goods once sold will not be taken back.<br>2. Subject to local jurisdiction.</p>
         </div>
         <div class="totals-box">
            <div class="total-row"><span>Subtotal</span><span>${currencySymbol}${subtotal.toFixed(
              2,
            )}</span></div>
            <div class="total-row"><span>GST</span><span>${currencySymbol}${tax.toFixed(
              2,
            )}</span></div>
            ${
              discount > 0
                ? `<div class="total-row"><span>Discount (-)</span><span>${currencySymbol}${discount.toFixed(
                    2,
                  )}</span></div>`
                : ""
            }
            ${
              Math.abs(roundingValue) > 0.01
                ? `<div class="total-row"><span>Rounding</span><span>${currencySymbol}${roundingValue.toFixed(
                    2,
                  )}</span></div>`
                : ""
            }
            <div class="total-row grand-total"><span>GRAND TOTAL</span><span>${currencySymbol}${amount.toFixed(
              2,
            )}</span></div>
         </div>
      </div>
    </div>
  `;
};
