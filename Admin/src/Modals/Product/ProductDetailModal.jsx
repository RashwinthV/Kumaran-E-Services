import React from "react";
import "../../Styles/ProductModal.css"; // Reusing basic modal styles

const ProductDetailModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  // Calculate generic GST display if needed
  const totalGst = (product.gst?.cgst || 0) + (product.gst?.sgst || 0);

  return (
    <div className="product-modal-overlay">
      <div
        className="product-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "700px" }}
      >
        <div className="modal-header">
          <h2>Product Details</h2>
          <button className="close-btn" onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {/* Basic Info */}
            <div className="form-group full-width">
              <label>Product Name</label>
              <div
                className="detail-value"
                style={{ fontSize: "1.2rem", fontWeight: "bold" }}
              >
                {product.name}
              </div>
            </div>

            <div className="form-group">
              <label>SKU / Barcode</label>
              <div className="detail-value">{product.sku}</div>
            </div>

            <div className="form-group">
              <label>Brand</label>
              <div className="detail-value">{product.brand || "-"}</div>
            </div>

            <div className="form-group">
              <label>Model</label>
              <div className="detail-value">{product.model || "-"}</div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <div>
                <span
                  className={`status-badge ${
                    product.isActive ? "active" : "inactive"
                  }`}
                  style={{ fontSize: "0.85rem", padding: "0.25rem 0.75rem" }}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Categorization */}
            <div className="section-divider">Categorization</div>

            <div className="form-group">
              <label>Category</label>
              <div className="detail-value">
                {product.category?.name || "Uncategorized"}
              </div>
            </div>

            <div className="form-group">
              <label>Sub Category</label>
              <div className="detail-value">
                {product.subCategory?.name || "-"}
              </div>
            </div>

            {/* Pricing */}
            <div className="section-divider">Pricing & Unit</div>

            <div className="form-group">
              <label>MRP (Price)</label>
              <div
                className="detail-value"
                style={{
                  fontSize: "1.1rem",
                  color: "#2b6cb0",
                  fontWeight: "600",
                }}
              >
                ₹{product.mrp}
              </div>
            </div>

            <div className="form-group">
              <label>Unit</label>
              <div
                className="detail-value"
                style={{ textTransform: "uppercase" }}
              >
                {product.unit}
              </div>
            </div>

            <div className="gst-section">
              <div className="gst-grid">
                <div className="form-group">
                  <label>GST Type</label>
                  <div className="detail-value">
                    {product.gstType || "Not Applicable"}
                  </div>
                </div>
                {product.gstType !== "NotApplicable" && (
                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Total GST %</label>
                    <div className="detail-value">
                      {totalGst}% (CGST: {product.gst?.cgst}% + SGST:{" "}
                      {product.gst?.sgst}%)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {(product.compatibleModels?.length > 0 ||
              product.tags?.length > 0) && (
              <>
                <div className="section-divider">Search Metadata</div>

                {product.compatibleModels?.length > 0 && (
                  <div className="form-group full-width">
                    <label>Compatible Models</label>
                    <div
                      className="tags-container"
                      style={{ marginTop: "0.25rem" }}
                    >
                      {product.compatibleModels.map((tag, idx) => (
                        <span
                          key={idx}
                          className="tag-badge"
                          style={{ cursor: "default" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.tags?.length > 0 && (
                  <div className="form-group full-width">
                    <label>Tags / Keywords</label>
                    <div
                      className="tags-container"
                      style={{ marginTop: "0.25rem" }}
                    >
                      {product.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="tag-badge"
                          style={{ background: "#bee3f8", cursor: "default" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
