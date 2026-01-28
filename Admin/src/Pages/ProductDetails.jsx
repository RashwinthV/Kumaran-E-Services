import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "../Context/ProductContext";
import "../Styles/Products.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, getProductInventory } = useProduct();

  const [product, setProduct] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const productData = await getProductById(id);
    if (productData) {
      setProduct(productData);
      const invData = await getProductInventory(id);
      setInventory(invData);
    }
    setLoading(false);
  }, [id, getProductById, getProductInventory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div
          className="spinner-border"
          role="status"
          style={{ width: "3rem", height: "3rem", color: "#7C6FB0" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container p-5 text-center">
        <i className="bi bi-exclamation-triangle display-1 text-warning mb-4"></i>
        <h2 className="mb-3">Product not found</h2>
        <p className="text-muted mb-4">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <button
          className="btn px-4 py-2 rounded-pill text-white"
          style={{ background: "#7C6FB0" }}
          onClick={() => navigate("/products")}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Products
        </button>
      </div>
    );
  }

  const totalGst = (product.gst?.cgst || 0) + (product.gst?.sgst || 0);
  const totalStock = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValue = inventory.reduce(
    (acc, curr) => acc + curr.quantity * curr.FinalPrice,
    0,
  );

  return (
    <div
      className="container-fluid p-4"
      style={{ background: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Header Section */}
      <div className="mb-4">
        <button
          className="btn btn-link text-decoration-none p-0 mb-3 d-inline-flex align-items-center"
          onClick={() => navigate("/products")}
          style={{ color: "#7C6FB0", fontSize: "0.95rem", fontWeight: "600" }}
        >
          <i className="bi bi-arrow-left me-2"></i> Back to Products
        </button>

        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1
              className="fw-bold mb-2"
              style={{ fontSize: "2rem", color: "#212529" }}
            >
              {product.name}
            </h1>
            <div className="d-flex gap-2 align-items-center">
              <span
                className="badge px-3 py-2"
                style={{
                  background: product.isActive ? "#7C6FB0" : "#6c757d",
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                }}
              >
                {product.isActive ? "● Active" : "● Inactive"}
              </span>
              <span
                className="badge bg-light text-dark px-3 py-2 border"
                style={{ fontSize: "0.85rem" }}
              >
                SKU: {product.sku}
              </span>
            </div>
          </div>

          <div className="text-end">
            <div className="text-muted small mb-1">Maximum Retail Price</div>
            <div
              className="fw-bold"
              style={{ fontSize: "2.5rem", color: "#7C6FB0" }}
            >
              ₹{product.mrp?.toLocaleString()}
            </div>
            <div className="text-muted small">per {product.unit}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Product Information */}
        <div className="col-lg-5">
          {/* Basic Information Card */}
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div
              className="card-header border-0 p-4"
              style={{
                background: "#7C6FB0",
                color: "white",
              }}
            >
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-info-circle me-2"></i>
                Basic Information
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-6">
                  <div
                    className="p-3 rounded-3 border"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div className="text-muted small mb-1">BRAND</div>
                    <div className="fw-bold fs-5">{product.brand || "-"}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className="p-3 rounded-3 border"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div className="text-muted small mb-1">MODEL</div>
                    <div className="fw-bold fs-5">{product.model || "-"}</div>
                  </div>
                </div>
                <div className="col-12">
                  <div
                    className="p-3 rounded-3 border"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div className="text-muted small mb-1">CATEGORY</div>
                    <div className="fw-bold">
                      {product.category?.name || "Uncategorized"}
                    </div>
                    {product.subCategory && (
                      <div
                        className="mt-1 d-flex align-items-center"
                        style={{ color: "#7C6FB0" }}
                      >
                        <i className="bi bi-chevron-right me-1"></i>
                        <span className="fw-semibold">
                          {product.subCategory.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Tax Card */}
          <div className="card border-0 shadow-sm rounded-3">
            <div
              className="card-header border-0 p-4"
              style={{
                background: "#6B5FA0",
                color: "white",
              }}
            >
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-currency-rupee me-2"></i>
                Pricing & Tax Details
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <div
                    className="p-3 rounded-3 text-center border"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div className="text-muted small mb-1">UNIT</div>
                    <div className="fw-bold text-uppercase fs-5">
                      {product.unit || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className="p-3 rounded-3 text-center border"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div className="text-muted small mb-1">GST TYPE</div>
                    <div className="fw-bold fs-5">
                      {product.gstType || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {product.gstType !== "NotApplicable" && (
                <div
                  className="p-4 rounded-3 border"
                  style={{ background: "#f3f1f9" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span className="fw-semibold">CGST</span>
                    <span
                      className="badge px-3 py-2"
                      style={{ background: "#7C6FB0", color: "white" }}
                    >
                      {product.gst?.cgst}%
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span className="fw-semibold">SGST</span>
                    <span
                      className="badge px-3 py-2"
                      style={{ background: "#7C6FB0", color: "white" }}
                    >
                      {product.gst?.sgst}%
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2">
                    <span className="fw-bold fs-5">Total GST</span>
                    <span
                      className="badge px-3 py-2 fs-6"
                      style={{ background: "#6B5FA0", color: "white" }}
                    >
                      {totalGst}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inventory */}
        <div className="col-lg-7">
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div
                className="card border-0 shadow-sm rounded-3 h-100"
                style={{ background: "#7C6FB0", color: "white" }}
              >
                <div className="card-body p-4 text-center">
                  <i className="bi bi-boxes display-4 mb-2 opacity-75"></i>
                  <div className="small mb-1 opacity-75">Total Stock</div>
                  <div className="fw-bold" style={{ fontSize: "2rem" }}>
                    {totalStock}
                  </div>
                  <div className="small opacity-75">{product.unit}</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card border-0 shadow-sm rounded-3 h-100"
                style={{ background: "#8D7FC0", color: "white" }}
              >
                <div className="card-body p-4 text-center">
                  <i className="bi bi-shop display-4 mb-2 opacity-75"></i>
                  <div className="small mb-1 opacity-75">Branches</div>
                  <div className="fw-bold" style={{ fontSize: "2rem" }}>
                    {inventory.length}
                  </div>
                  <div className="small opacity-75">locations</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="card border-0 shadow-sm rounded-3 h-100"
                style={{ background: "#6B5FA0", color: "white" }}
              >
                <div className="card-body p-4 text-center">
                  <i className="bi bi-cash-stack display-4 mb-2 opacity-75"></i>
                  <div className="small mb-1 opacity-75">Total Value</div>
                  <div className="fw-bold" style={{ fontSize: "1.5rem" }}>
                    ₹{totalValue.toLocaleString()}
                  </div>
                  <div className="small opacity-75">at final price</div>
                </div>
              </div>
            </div>
          </div>

          {/* Branch Inventory Table */}
          <div className="card border-0 shadow-sm rounded-3">
            <div
              className="card-header border-0 p-4"
              style={{
                background: "#7C6FB0",
                color: "white",
              }}
            >
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-houses me-2"></i>
                Branch-wise Inventory
              </h5>
            </div>
            <div className="card-body p-0">
              {inventory.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-box-seam display-1 text-muted mb-3 d-block opacity-25"></i>
                  <h5 className="text-muted">No stock assigned yet</h5>
                  <p className="text-muted small">
                    This product hasn't been added to any branch inventory.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        <th className="px-4 py-3 fw-bold">Branch</th>
                        <th className="text-center py-3 fw-bold">Stock</th>
                        <th className="text-end py-3 fw-bold">Cost</th>
                        <th className="text-end py-3 fw-bold">Selling</th>
                        <th className="text-end py-3 fw-bold">Final</th>
                        <th className="text-center py-3 fw-bold">Alert</th>
                        <th className="text-center py-3 fw-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item, index) => {
                        const isLowStock =
                          item.quantity <= (item.lowStockThreshold || 0);
                        const isOutOfStock = item.quantity === 0;
                        return (
                          <tr
                            key={item._id}
                            style={{
                              borderLeft: isOutOfStock
                                ? "4px solid #dc3545"
                                : isLowStock
                                  ? "4px solid #ffc107"
                                  : "4px solid #28a745",
                            }}
                          >
                            <td className="px-4 py-3">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    background: "#7C6FB0",
                                    color: "white",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {item.branch?.name?.charAt(0) || "B"}
                                </div>
                                <div>
                                  <div className="fw-bold">
                                    {item.branch?.name}
                                  </div>
                                  <div className="small text-muted">
                                    {item.branch?.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <div
                                className={`fw-bold fs-4 ${isOutOfStock ? "text-danger" : isLowStock ? "text-warning" : "text-success"}`}
                              >
                                {item.quantity}
                              </div>
                              <div className="small text-muted text-uppercase">
                                {product.unit}
                              </div>
                            </td>
                            <td className="text-end py-3">
                              <div className="fw-semibold">
                                ₹{item.costPrice?.toLocaleString()}
                              </div>
                            </td>
                            <td className="text-end py-3">
                              <div className="fw-semibold">
                                {item.sellingPrice?.toLocaleString()} %
                              </div>
                            </td>
                            <td className="text-end py-3">
                              <div
                                className="fw-bold fs-5"
                                style={{ color: "#7C6FB0" }}
                              >
                                ₹{item.FinalPrice?.toLocaleString()}
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <span className="badge bg-light text-dark border px-3 py-2">
                                <i className="bi bi-bell me-1"></i>
                                {item.lowStockThreshold || 5}
                              </span>
                            </td>
                            <td className="text-center py-3">
                              {isOutOfStock ? (
                                <span className="badge bg-danger px-3 py-2">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="badge bg-warning text-dark px-3 py-2">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="badge bg-success px-3 py-2">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ background: "#f8f9fa" }}>
                      <tr>
                        <td className="px-4 py-4 fw-bold fs-5" colSpan="1">
                          <i className="bi bi-calculator me-2"></i>Total
                          Inventory
                        </td>
                        <td className="text-center py-4">
                          <div
                            className="fw-bold fs-3"
                            style={{ color: "#7C6FB0" }}
                          >
                            {totalStock}
                          </div>
                          <div className="small text-muted">{product.unit}</div>
                        </td>
                        <td colSpan="3" className="text-end py-4">
                          <div className="text-muted small">Total Value</div>
                          <div className="fw-bold fs-4 text-success">
                            ₹{totalValue.toLocaleString()}
                          </div>
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
