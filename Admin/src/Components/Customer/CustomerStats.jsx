import React from "react";

const CustomerStats = ({ data }) => {
  const totalCustomers = data.length;
  const totalCreditAmount = data.reduce(
    (sum, customer) =>
      sum +
      (customer.credits?.reduce((s, c) => s + (c.totalAmount || 0), 0) || 0),
    0
  );
  const totalCredits = data.reduce(
    (sum, customer) => sum + (customer.credits?.length || 0),
    0
  );
  const avgCreditPerCustomer =
    totalCustomers > 0 ? totalCreditAmount / totalCustomers : 0;

  const stats = [
    {
      label: "Customers with Credits",
      value: totalCustomers,
      icon: "bi-people-fill",
      color: "warning",
    },
    {
      label: "Total Credits",
      value: `₹${totalCreditAmount.toFixed(2)}`,
      icon: "bi-currency-rupee",
      color: "danger",
    },
    {
      label: "Total Credit Entries",
      value: totalCredits,
      icon: "bi-receipt-cutoff",
      color: "info",
    },
  ];

  return (
    <div className="row g-4 mb-4">
      {stats.map((stat, idx) => (
        <div className="col-12 col-md-4" key={idx}>
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "16px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div
                  className={`bg-${stat.color} bg-opacity-10 rounded-3 p-3 me-3 d-flex align-items-center justify-content-center`}
                  style={{ width: "56px", height: "56px" }}
                >
                  <i className={`bi ${stat.icon} text-${stat.color} fs-3`}></i>
                </div>
                <div>
                  <p
                    className="text-muted small fw-bold text-uppercase mb-1"
                    style={{
                      fontSize: "0.75rem",
                      letterSpacing: "0.025em",
                      color: "#64748b",
                    }}
                  >
                    {stat.label}
                  </p>
                  <h3
                    className="fw-bold text-dark mb-0"
                    style={{ color: "#1e293b" }}
                  >
                    {stat.value}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerStats;
