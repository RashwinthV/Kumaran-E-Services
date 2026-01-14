import React, { useState, useEffect } from "react";
import { useBilling } from "../../Context/BillingContext";

const ProductPurchaseModal = ({
  isOpen,
  onClose,
  investor,
  unpaidInterest,
  onSave,
}) => {
  const { products, refreshProducts, loading } = useBilling();
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen && products.length === 0) {
      refreshProducts();
    }
  }, [isOpen, products.length, refreshProducts]);

  // Filter products that can be afforded with unpaid interest
  const affordableProducts = products.filter(
    (product) => product.price <= unpaidInterest
  );

  // Get unique categories
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  // Filter products based on search and category
  const filteredProducts = affordableProducts.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const remainingBalance = unpaidInterest - cartTotal;

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      if (
        (existingItem.qty + 1) * product.price <=
        remainingBalance + existingItem.qty * product.price
      ) {
        setCart(
          cart.map((item) =>
            item._id === product._id ? { ...item, qty: item.qty + 1 } : item
          )
        );
      }
    } else {
      if (product.price <= remainingBalance) {
        setCart([...cart, { ...product, qty: 1 }]);
      }
    }
  };

  const updateQty = (id, qty) => {
    const item = cart.find((i) => i._id === id);
    if (!item) return;

    const newQty = Math.max(1, parseInt(qty) || 1);
    const newTotal = cartTotal - item.price * item.qty + item.price * newQty;

    if (newTotal <= unpaidInterest) {
      setCart(cart.map((i) => (i._id === id ? { ...i, qty: newQty } : i)));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const purchaseData = {
      products: cart,
      totalAmount: cartTotal,
      remainingInterest: remainingBalance,
    };

    onSave(purchaseData);
    setCart([]);
  };

  if (!isOpen || !investor) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: "2050" }}
    >
      <div
        className="modal-dialog modal-xl"
        style={{ maxWidth: "80vw", margin: "1rem auto" }}
      >
        <div
          className="modal-content shadow-lg border-0 rounded-4 animate-modal"
          style={{
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="modal-header bg-info text-white rounded-top-4 py-2">
            <h6 className="modal-title fw-bold mb-0">
              <i className="bi bi-cart-fill me-2"></i>
              Purchase Products - {investor.name}
            </h6>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            <div
              className="modal-body p-3"
              style={{ flex: 1, overflow: "auto" }}
            >
              {/* Balance Info */}
              <div className="alert alert-info border-0 mb-2 py-2">
                <div className="row">
                  <div className="col-md-4">
                    <small className="text-muted">Available:</small>
                    <div className="fw-bold">₹{unpaidInterest.toFixed(2)}</div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Cart Total:</small>
                    <div className="fw-bold text-success">
                      ₹{cartTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted">Remaining:</small>
                    <div className="fw-bold text-warning">
                      ₹{remainingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row" style={{ height: "calc(95vh - 220px)" }}>
                {/* Products Section */}
                <div
                  className="col-md-7 d-flex flex-column"
                  style={{ height: "100%" }}
                >
                  <div className="card border-0 shadow-sm flex-grow-1 d-flex flex-column">
                    <div className="card-header bg-light py-2">
                      <h6 className="mb-0 fw-bold small">
                        Products ({filteredProducts.length})
                      </h6>
                    </div>
                    <div className="card-body p-2 d-flex flex-column">
                      {/* Search and Filter */}
                      <div className="row g-2 mb-2">
                        <div className="col-md-7">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="col-md-5">
                          <select
                            className="form-select form-select-sm"
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Products List */}
                      <div
                        className="flex-grow-1"
                        style={{ overflowY: "auto" }}
                      >
                        {loading ? (
                          <div className="text-center py-5 text-muted">
                            <div
                              className="spinner-border text-primary mb-3"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            <p className="small">Loading products...</p>
                          </div>
                        ) : filteredProducts.length > 0 ? (
                          <div className="row g-2">
                            {filteredProducts.map((product) => (
                              <div key={product._id} className="col-md-6">
                                <div className="card border">
                                  <div className="card-body p-2">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <div className="fw-bold small">
                                          {product.name}
                                        </div>
                                        <small className="text-muted">
                                          {product.sku}
                                        </small>
                                        <div className="fw-bold text-success mt-1">
                                          ₹{product.price}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={() => addToCart(product)}
                                        disabled={
                                          product.price > remainingBalance &&
                                          !cart.find(
                                            (i) => i._id === product._id
                                          )
                                        }
                                      >
                                        <i className="bi bi-plus"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>
                            <p className="small">
                              {affordableProducts.length === 0
                                ? "No products within budget"
                                : "No products match search"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cart Section */}
                <div
                  className="col-md-5 d-flex flex-column"
                  style={{ height: "100%" }}
                >
                  <div className="card border-0 shadow-sm flex-grow-1 d-flex flex-column">
                    <div className="card-header bg-light py-2">
                      <h6 className="mb-0 fw-bold small">
                        Cart ({cart.length})
                      </h6>
                    </div>
                    <div
                      className="card-body p-2 flex-grow-1"
                      style={{ overflowY: "auto" }}
                    >
                      {cart.length > 0 ? (
                        cart.map((item) => (
                          <div key={item._id} className="card border mb-2">
                            <div className="card-body p-2">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="flex-grow-1">
                                  <div className="fw-bold small">
                                    {item.name}
                                  </div>
                                  <small className="text-muted">
                                    ₹{item.price} × {item.qty}
                                  </small>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeFromCart(item._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  style={{ width: "60px" }}
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateQty(item._id, e.target.value)
                                  }
                                  min="1"
                                />
                                <div className="fw-bold text-success">
                                  ₹{(item.price * item.qty).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <i className="bi bi-cart-x fs-1 d-block mb-2 opacity-25"></i>
                          <p className="small">Cart is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-top-0 bg-light rounded-bottom-4 py-2">
              <button
                type="button"
                className="btn btn-sm btn-light text-muted fw-bold"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-info fw-bold px-3"
                disabled={cart.length === 0}
              >
                <i className="bi bi-check-circle me-2"></i>
                Complete (₹{cartTotal.toFixed(2)})
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductPurchaseModal;
