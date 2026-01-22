import React from "react";
import { handlePrint } from "../../utils/printUtils";

const SaleHistoryTable = ({
  data,
  onViewSale,
  onRefundSale,
  currencySymbol = "₹",
}) => {
  return (
    <div className="premium-card overflow-hidden">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="py-3 ps-4 text-muted small fw-bold text-uppercase border-0">
                Bill No
              </th>
              <th className="py-3 text-muted small fw-bold text-uppercase border-0">
                Date & Time
              </th>
              <th className="py-3 text-muted small fw-bold text-uppercase border-0">
                Customer
              </th>
              <th
                className="py-3 text-muted small fw-bold text-uppercase border-0"
                style={{ minWidth: "200px" }}
              >
                Products
              </th>
              <th className="py-3 text-center text-muted small fw-bold text-uppercase border-0">
                Items
              </th>
              <th className="py-3 text-end text-muted small fw-bold text-uppercase border-0">
                Total Amount
              </th>
              <th className="py-3 text-center text-muted small fw-bold text-uppercase border-0">
                Mode
              </th>
              <th className="py-3 text-center text-muted small fw-bold text-uppercase border-0">
                Status
              </th>
              <th className="py-3 text-end pe-4 text-muted small fw-bold text-uppercase border-0">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((sale) => (
                <tr key={sale.id}>
                  <td className="ps-4 fw-bold text-primary">#{sale.billNo}</td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-dark small">
                        {sale.formattedDate}
                      </span>
                      <small
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {sale.time}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-dark small">
                        {sale.customerName}
                      </span>
                      <small
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {sale.customerPhone}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div
                      className="d-flex flex-wrap gap-1"
                      style={{ maxWidth: "300px" }}
                    >
                      {sale.products?.map((p, idx) => {
                        const isFullyRefunded = p.refundedQty >= p.qty;
                        const isPartiallyRefunded =
                          p.refundedQty > 0 && p.refundedQty < p.qty;

                        return (
                          <div
                            key={idx}
                            className={`small px-2 py-0 rounded border w-100 text-truncate ${
                              isFullyRefunded
                                ? "bg-secondary bg-opacity-10 text-muted text-decoration-line-through"
                                : isPartiallyRefunded
                                  ? "bg-danger bg-opacity-10 border-danger border-opacity-25"
                                  : sale.isService
                                    ? "bg-info bg-opacity-10 border-info border-opacity-25 text-info-emphasis"
                                    : "bg-light text-muted"
                            }`}
                            title={`${p.sku} - ${p.name}`}
                          >
                            <span
                              className={`fw-bold ${
                                isFullyRefunded ? "text-muted" : "text-dark"
                              }`}
                            >
                              {p.sku}
                            </span>{" "}
                            - {p.name}
                            {isPartiallyRefunded && (
                              <span
                                className="ms-1 text-danger fw-bold"
                                style={{ fontSize: "0.65rem" }}
                              >
                                (-{p.refundedQty} ref.)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-light text-dark border">
                      {sale.itemsCount}
                    </span>
                  </td>
                  <td className="text-end fw-bold text-dark">
                    {currencySymbol}
                    {(sale.amount - (sale.totalRefundedAmount || 0)).toFixed(2)}

                    {sale.status !== "Paid" && sale.paidAmount > 0 && (
                      <div
                        className="text-success small fw-normal mt-1"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Paid: {currencySymbol}
                        {sale.paidAmount.toFixed(2)}
                      </div>
                    )}

                    {sale.totalRefundedAmount > 0 && (
                      <div
                        className="text-danger small fw-normal"
                        style={{ fontSize: "0.7rem" }}
                      >
                        (-{sale.totalRefundedAmount.toFixed(2)})
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10">
                      {sale.paymentMode}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        sale.status === "Paid"
                          ? "bg-success bg-opacity-10 text-success border border-success border-opacity-10"
                          : sale.status === "Cancelled"
                            ? "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10"
                            : sale.status === "Refunded"
                              ? "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10"
                              : "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-10"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <button
                      className="btn btn-sm btn-light border me-2"
                      onClick={() => onViewSale(sale)}
                      title="View Details"
                    >
                      <i className="bi bi-eye text-primary"></i>
                    </button>
                    {sale.status !== "Refunded" &&
                      sale.status !== "Cancelled" &&
                      !sale.isService && (
                        <button
                          className="btn btn-sm btn-light border me-2"
                          onClick={() => onRefundSale(sale)}
                          title="Refund"
                        >
                          <i className="bi bi-arrow-counterclockwise text-danger"></i>
                        </button>
                      )}
                    <button
                      className="btn btn-sm btn-light border"
                      onClick={() => handlePrint(sale)}
                      title="Print Invoice"
                    >
                      <i className="bi bi-printer text-secondary"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-5">
                  <div className="d-flex flex-column align-items-center opacity-50">
                    <i className="bi bi-folder2-open display-4 mb-2"></i>
                    <p className="mb-0">No sales found matching your filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SaleHistoryTable;
