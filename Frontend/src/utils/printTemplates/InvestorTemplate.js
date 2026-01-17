export const InvestorTemplate = ({
  investor,
  branchDetails,
  currencySymbol = "₹",
  monthlyInterest = 0,
  yearlyInterest = 0,
}) => {
  const certificateNo = `INV-CERT-${Date.now().toString().slice(-6)}`;
  const issuanceDate = new Date(investor.startDate).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  return `
    <div class="investor-receipt professional-style" style="position: relative; border: 8px solid #1e293b; padding: 25px; background: #fff; box-sizing: border-box; overflow: hidden;">
      <!-- Watermark -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 6rem; color: rgba(0,0,0,0.015); font-weight: 900; z-index: 0; pointer-events: none; white-space: nowrap;">
        KUMARAN E-SERVICES
      </div>

      <div style="position: relative; z-index: 1;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 15px;">
          <h1 style="margin: 0; font-size: 2rem; color: #000; letter-spacing: 1px;">${
            branchDetails.name
          }</h1>
          <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">${
            branchDetails.branchName
          }</p>
          
          <div style="margin-top: 12px;">
            <h2 style="margin: 0; font-size: 1.1rem; color: #1e293b; text-transform: uppercase; letter-spacing: 4px; font-weight: 400; border: 1px solid #1e293b; display: inline-block; padding: 6px 20px;">Certificate of Investment</h2>
          </div>
        </div>

        <!-- Meta Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px; text-align: center;">
          <div style="border-right: 1px solid #e2e8f0;">
            <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Certificate Number</div>
            <div style="font-weight: 700; color: #000; font-size: 0.85rem;">${certificateNo}</div>
          </div>
          <div style="border-right: 1px solid #e2e8f0;">
            <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Date of Issuance</div>
            <div style="font-weight: 700; color: #000; font-size: 0.85rem;">${issuanceDate}</div>
          </div>
          <div>
            <div style="font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;">Investment Type</div>
            <div style="font-weight: 700; color: #000; text-transform: uppercase; font-size: 0.85rem;">${
              investor.investorType
            }</div>
          </div>
        </div>

        <!-- Main Content -->
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 15px; margin-bottom: 15px;">
          <!-- Investor Info Card -->
          <div style="background: #f8fafc; padding: 15px; border-radius: 4px; border-left: 4px solid #1e293b;">
            <h5 style="margin: 0 0 8px 0; font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">INVESTOR DETAILS</h5>
            <div style="font-size: 1.35rem; font-weight: 800; color: #000; margin-bottom: 6px;">${
              investor.name
            }</div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 0.85rem;">
              <div style="color: #475569; font-weight: 600;"><span style="color: #94a3b8; font-weight: 400; width: 60px; display: inline-block;">Phone</span> ${
                investor.phone
              }</div>
              ${
                investor.aadharNumber
                  ? `<div style="color: #475569; font-weight: 600;"><span style="color: #94a3b8; font-weight: 400; width: 60px; display: inline-block;">Aadhar</span> ${investor.aadharNumber}</div>`
                  : ""
              }
              ${
                investor.panNumber
                  ? `<div style="color: #475569; font-weight: 600;"><span style="color: #94a3b8; font-weight: 400; width: 60px; display: inline-block;">PAN</span> ${investor.panNumber}</div>`
                  : ""
              }
            </div>
          </div>

          <!-- Amount Card -->
          <div style="background: #1e293b; color: #fff; padding: 15px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; text-align: center;">
            <div style="font-size: 0.7rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">Investment Amount</div>
            <div style="font-size: 2rem; font-weight: 800;">${currencySymbol}${Number(
    investor.principalAmount
  ).toLocaleString()}</div>
            <div style="height: 1px; background: rgba(255,255,255,0.2); width: 60%; margin: 8px auto;"></div>
            <div style="font-size: 0.6rem; opacity: 0.6;">Fully Disbursed Principal</div>
          </div>
        </div>

        <!-- Parameters Table -->
        <div style="margin-bottom: 15px;padding: 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 8px 15px; text-align: left; font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Investment Details</th>
                <th style="padding: 8px 15px; text-align: right; font-size: 0.65rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Value</th>
              </tr>
            </thead>
            <tbody style="font-size: 0.8rem;">
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; color: #475569;">Monthly Interest Rate (per ₹1)</td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #000;">${
                  investor.interestRate
                } Paise</td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; color: #475569;">Methodology</td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #000; text-transform: capitalize;">${
                  investor.interestType
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; color: #475569;">Commencement Date</td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #000;">${issuanceDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; color: #475569;">Verification (KYC)</td>
                <td style="padding: 8px 15px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #000; text-transform: capitalize;">${
                  investor.kycStatus
                }</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Projections -->
        <div style="background: #f1f5f9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <h5 style="margin: 0 0 10px 0; font-size: 0.7rem; color: #1e293b; text-transform: uppercase; letter-spacing: 1.5px; text-align: center;">Profit Projections</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #fff; padding: 12px; border-radius: 4px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="color: #94a3b8; font-size: 0.55rem; text-transform: uppercase; margin-bottom: 4px;">Yield per Month</div>
              <div style="font-size: 1.35rem; font-weight: 800; color: #1e293b;">${currencySymbol}${monthlyInterest.toFixed(
    2
  )}</div>
            </div>
            <div style="background: #fff; padding: 12px; border-radius: 4px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="color: #94a3b8; font-size: 0.55rem; text-transform: uppercase; margin-bottom: 4px;">Yield per Annum</div>
              <div style="font-size: 1.35rem; font-weight: 800; color: #1e293b;">${currencySymbol}${yearlyInterest.toFixed(
    2
  )}</div>
            </div>
          </div>
        </div>

        <!-- signatures -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
          <div style="text-align: center;">
            <div style="height: 35px;"></div>
            <div style="border-top: 1px solid #1e293b; padding-top: 5px;">
              <div style="font-weight: 800; font-size: 0.7rem; text-transform: uppercase;">Investor Signature</div>
              <div style="font-size: 0.6rem; color: #64748b; margin-top: 2px;">Holder: ${
                investor.name
              }</div>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="height: 35px;"></div>
            <div style="border-top: 1px solid #1e293b; padding-top: 5px;">
              <div style="font-weight: 800; font-size: 0.7rem; text-transform: uppercase;">Authorized Authority</div>
              <div style="font-size: 0.6rem; color: #64748b; margin-top: 2px;">On behalf of Kumaran E-Services</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 25px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 10px;">
          <p style="font-size: 0.55rem; color: #94a3b8; line-height: 1.4; max-width: 90%; margin: 0 auto;">
            This document confirms the investment terms as of the issuance date. 
            It is a computer-generated record for verification purposes. 
            Terms apply per the primary investment agreement.
          </p>
        </div>
      </div>
    </div>
  `;
};
