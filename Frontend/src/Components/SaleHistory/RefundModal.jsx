import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const RefundModal = ({
  isOpen,
  onClose,
  sale,
  onRefund,
  currencySymbol = "₹",
}) => {
  const [itemsToRefund, setItemsToRefund] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [surplusConfirmed, setSurplusConfirmed] = useState(false);

  const totalRefundAmount = itemsToRefund.reduce((acc, item) => {
    if (item.qtyToRefund <= 0) return acc;
    return acc + (item.lineTotal / item.originalQty) * item.qtyToRefund;
  }, 0);

  // Calculate surplus for confirmation
  const remainingValue = Math.max(
    0,
    Number(sale?.amount || 0) -
      Number(sale?.totalRefundedAmount || 0) -
      totalRefundAmount
  );
  const surplus = Math.max(0, Number(sale?.paidAmount || 0) - remainingValue);
  const hasSurplus = surplus > 0.01;

  useEffect(() => {
    if (isOpen && sale) {
      // Initialize items with 0 qty to refund
      const initialItems = sale.products.map((item, index) => ({
        itemId: sale.items[index]?._id || item.id, // We need the actual inner item ID from backend
        name: item.name,
        sku: item.sku,
        originalQty: item.qty,
        alreadyRefundedQty: item.refundedQty || 0,
        availableQty: item.qty - (item.refundedQty || 0),
        qtyToRefund: 0,
        price: item.price,
        lineTotal: item.lineTotal,
      }));
      setItemsToRefund(initialItems);
      setReason("");
      setSurplusConfirmed(false);
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const handleQtyChange = (index, val) => {
    const updated = [...itemsToRefund];
    const item = updated[index];
    let qty = parseInt(val) || 0;

    if (qty < 0) qty = 0;
    if (qty > item.availableQty) qty = item.availableQty;

    item.qtyToRefund = qty;
    setItemsToRefund(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const processedItems = itemsToRefund
      .filter((item) => item.qtyToRefund > 0)
      .map((item) => ({
        itemId: item.itemId,
        qtyToRefund: item.qtyToRefund,
      }));

    if (processedItems.length === 0) {
      toast.error("Please select at least one item to refund");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    if (hasSurplus && !surplusConfirmed) {
      toast.error("Please confirm that you have returned the surplus cash");
      return;
    }

    setLoading(true);

    try {
      await onRefund({
        saleId: sale.id,
        saleDate: sale.date,
        itemsToRefund: processedItems,
        reason: reason.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Refund submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
      }}
    >
      <div
        className="bg-white rounded-4 shadow-lg overflow-hidden"
        style={{ width: "95%", maxWidth: "600px" }}
      >
        <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0 fw-bold text-dark">Process Refund</h5>
          <button onClick={onClose} className="btn-close"></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <div className="alert alert-info py-2 small mb-3">
              Refund for Bill <strong>#{sale.billNo}</strong>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr className="small text-muted">
                    <th>Product</th>
                    <th className="text-center">Avail.</th>
                    <th className="text-center" style={{ width: "100px" }}>
                      Refund Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToRefund
                    .filter((item) => item.availableQty > 0)
                    .map((item, idx) => {
                      // Find the original index in itemsToRefund for handleQtyChange
                      const originalIndex = itemsToRefund.findIndex(
                        (i) => i.itemId === item.itemId
                      );
                      return (
                        <tr key={item.itemId}>
                          <td>
                            <div className="fw-bold small">{item.name}</div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {item.sku}
                            </div>
                          </td>
                          <td className="text-center small">
                            {item.availableQty}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm text-center"
                              value={item.qtyToRefund}
                              onChange={(e) =>
                                handleQtyChange(originalIndex, e.target.value)
                              }
                              max={item.availableQty}
                              min="0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <label className="form-label small fw-bold text-muted text-uppercase">
                Reason for Refund
              </label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Ex: Damaged product, Customer changed mind..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Surplus Warning with Checkbox */}
            {hasSurplus && (
              <div className="alert alert-warning mt-4 border-warning border-opacity-25 bg-warning bg-opacity-10 rounded-3 p-4">
                <div className="d-flex align-items-start gap-3 mb-3">
                  <div
                    className="bg-warning text-white rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "35px", height: "35px" }}
                  >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-warning-emphasis fs-6">
                      Surplus Return Required
                    </div>
                    <div className="small text-muted">
                      The customer has already paid more than the new bill
                      total. Please return{" "}
                      <strong className="text-dark">
                        {currencySymbol}
                        {surplus.toFixed(2)}
                      </strong>{" "}
                      in physical cash to the customer.
                    </div>
                  </div>
                </div>

                <div className="form-check bg-white p-3 rounded-3 border border-warning border-opacity-50">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    id="confirmSurplus"
                    checked={surplusConfirmed}
                    onChange={(e) => setSurplusConfirmed(e.target.checked)}
                    style={{ cursor: "pointer", transform: "scale(1.2)" }}
                  />
                  <label
                    className="form-check-label small fw-bold text-dark"
                    htmlFor="confirmSurplus"
                    style={{ cursor: "pointer" }}
                  >
                    I confirm that I've returned {currencySymbol}
                    {surplus.toFixed(2)} to the customer in physical cash.
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-light border-top d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted d-block">Estimated Refund:</small>
              <span className="fw-bold text-primary fs-5">
                {currencySymbol}
                {totalRefundAmount.toFixed(2)}
              </span>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-light border px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger px-4"
                disabled={
                  loading ||
                  totalRefundAmount === 0 ||
                  (hasSurplus && !surplusConfirmed)
                }
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Confirm Refund"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundModal;
