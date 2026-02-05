import React, { useState, useEffect, useRef } from "react";
import { handlePrint } from "../../utils/printUtils";
import "../../Styles/dashboard.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useAuth } from "../../Context/AuthContext";
import { useBilling } from "../../Context/BillingContext";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { toast } from "react-toastify";
import Loader from "../../Components/Loading/universalLoader";
import ProductSearch from "../../Components/Billing/ProductSearch";
import CustomerSearch from "../../Components/Billing/CustomerSearch";
import CustomerModal from "../../Components/Billing/CustomerModal";
import { useNavigate } from "react-router-dom";
import { removeCache, CACHE_KEYS } from "../../utils/cacheUtils";
import ShortcutGuide from "../../Components/Navigation/ShortcutGuide";
import { getDecrypted, saveEncrypted } from "../../utils/storage";

const getCurrencySymbol = (settingValue) => {
  if (!settingValue) return "₹"; // Default
  const match = settingValue.match(/\(([^)]+)\)/);
  return match ? match[1] : settingValue;
};

const ProductBilling = () => {
  const {
    products: allProducts,
    customers: allCustomers,
    loading: billingLoading,
    refreshCustomers,
    refreshProducts,
    refreshSales,
    branchInfo,
  } = useBilling();
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const [dateTime, setDateTime] = useState(new Date());
  const searchInputRef = useRef(null);
  const tableSearchInputRef = useRef(null);
  const discountRefs = useRef({}); // To store refs for discount inputs
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    const saved = getDecrypted("app_settings");
    if (saved) {
      setAppSettings(saved);
    }
  }, []);

  // Customer State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState("");
  const [selectedCustomerCredit, setSelectedCustomerCredit] = useState(0);

  // Payment State
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]);
  const [removedItems, setRemovedItems] = useState([]); // Stack for Redo
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);

  // Calculations (Dynamic Tax Handling)
  const cartWithTotals = cart.map((item) => {
    const discountAmountPerUnit = (item.price * item.discount) / 100;
    const effectivePrice = Math.max(0, item.price - discountAmountPerUnit);
    const qty = item.qty;

    let lineTotal, taxAmount, taxableValue;
    const type = (item.gstType || "NotIncluded").toLowerCase();

    if (type === "included") {
      // Extraction: Tax is already inside the price (Total = MRP)
      lineTotal = effectivePrice * qty;
      taxAmount = (lineTotal * item.gst) / (100 + item.gst);
      taxableValue = lineTotal - taxAmount;
    } else if (type === "notincluded") {
      // Addition: Tax is added on top of the price (Total = Base + Tax)
      taxableValue = effectivePrice * qty;
      taxAmount = (taxableValue * item.gst) / 100;
      lineTotal = taxableValue + taxAmount;
    } else {
      // NotApplicable or others: No Tax
      lineTotal = effectivePrice * qty;
      taxableValue = lineTotal;
      taxAmount = 0;
    }

    const isBelowCP = item.costPrice > 0 && effectivePrice < item.costPrice;

    return {
      ...item,
      effectivePrice,
      lineTotal,
      taxAmount,
      taxableValue,
      discountAmount: discountAmountPerUnit * qty,
      isBelowCP,
    };
  });

  const rawGrandTotal = cartWithTotals.reduce(
    (acc, item) => acc + item.lineTotal,
    0,
  );

  // Apply Rounding Logic
  let grandTotal = rawGrandTotal;
  const roundingMethod = appSettings?.rounding || "none";
  const roundingValue = appSettings?.roundingValue || 1;

  if (roundingMethod === "round") {
    grandTotal = Math.round(rawGrandTotal);
  } else if (roundingMethod === "nearest") {
    grandTotal = Math.round(rawGrandTotal / roundingValue) * roundingValue;
  } else if (roundingMethod === "ceil") {
    grandTotal = Math.ceil(rawGrandTotal);
  } else if (roundingMethod === "floor") {
    grandTotal = Math.floor(rawGrandTotal);
  }

  const totalTax = cartWithTotals.reduce(
    (acc, item) => acc + item.taxAmount,
    0,
  );
  const subtotal = grandTotal - totalTax; // Base taxable amount (adjusted for rounding)
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

  const totalDiscount = cartWithTotals.reduce(
    (acc, item) => acc + item.discountAmount,
    0,
  );

  // Cart Functions
  const addToCart = (product) => {
    if (product.availableQty <= 0) {
      return toast.error(`${product.name} is out of stock!`);
    }

    setCart((prev) => {
      const isMobile = product.category === "Mobiles";
      const existing = !isMobile
        ? prev.find((item) => item._id === product._id)
        : null;

      if (existing) {
        if (existing.qty + 1 > product.availableQty) {
          toast.error(
            `Only ${product.availableQty} units available for ${product.name}`,
          );
          return prev;
        }
        return prev.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          qty: 1,
          discount: 0,
          selectedImei: "", // For mobiles
          cartId: Date.now() + Math.random(), // Unique ID for each row to allow duplicates of Mobiles
        },
      ];
    });
    setRemovedItems([]); // Clear redo stack on new action
  };

  const setQty = (cartId, val) => {
    const requestedQty = Math.max(1, parseInt(val) || 0);
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          if (requestedQty > item.availableQty) {
            toast.error(
              `Only ${item.availableQty} units available for ${item.name}`,
            );
            return { ...item, qty: item.availableQty };
          }
          return { ...item, qty: requestedQty };
        }
        return item;
      }),
    );
  };

  const updatePrice = (cartId, val) => {
    const newPrice = parseFloat(val) || 0;
    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, price: newPrice } : item,
      ),
    );
  };

  const updateDiscount = (cartId, val, shouldCap = false) => {
    const item = cart.find((i) => i.cartId === cartId);
    if (!item) return;

    let discount = Math.min(100, Math.max(0, parseFloat(val) || 0));

    // Only cap on blur/finalization, not while typing
    if (shouldCap) {
      const costPrice = item.costPrice || 0;
      const sellingPrice = item.price;

      if (costPrice > 0) {
        if (sellingPrice > costPrice) {
          const maxDiscountPercent =
            ((sellingPrice - costPrice) / sellingPrice) * 100;
          if (discount > maxDiscountPercent) {
            toast.warning(
              `Discount capped at ${maxDiscountPercent.toFixed(
                2,
              )}% to maintain cost price (₹${costPrice.toFixed(2)})`,
            );
            discount = maxDiscountPercent;
          }
        } else {
          if (discount > 0) {
            toast.warning(
              "Cannot apply discount: selling price is already at/below cost price.",
            );
            discount = 0;
          }
        }
      }
    }

    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, discount } : item,
      ),
    );
  };

  const updateLineTotal = (cartId, val, shouldCap = false) => {
    const item = cart.find((i) => i.cartId === cartId);
    if (!item) return;

    const newLineTotal = parseFloat(val) || 0;
    const qty = item.qty;
    const price = item.price;
    const gst = item.gst || 0;
    const type = (item.gstType || "NotIncluded").toLowerCase();

    let maxLineTotal;
    if (type === "included") {
      maxLineTotal = price * qty;
    } else if (type === "notincluded") {
      maxLineTotal = price * qty * (1 + gst / 100);
    } else {
      maxLineTotal = price * qty;
    }

    if (maxLineTotal > 0) {
      const newDiscount = ((maxLineTotal - newLineTotal) / maxLineTotal) * 100;
      updateDiscount(cartId, Math.max(0, newDiscount), shouldCap);
    }
  };

  const updateImei = (cartId, imei) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, selectedImei: imei } : item,
      ),
    );
  };

  const removeItem = (cartId) => {
    const itemToRemove = cart.find((item) => item.cartId === cartId);
    if (itemToRemove) {
      setRemovedItems((prev) => [...prev, itemToRemove]);
      setCart((prev) => prev.filter((item) => item.cartId !== cartId));
    }
  };

  const undoRemove = () => {
    if (removedItems.length === 0) return toast.info("Nothing to redo!");
    const lastRemoved = removedItems[removedItems.length - 1];
    setCart((prev) => {
      const existing = prev.find((item) => item._id === lastRemoved._id);
      if (existing) {
        return prev.map((item) =>
          item._id === lastRemoved._id
            ? { ...item, qty: item.qty + lastRemoved.qty }
            : item,
        );
      }
      return [...prev, lastRemoved];
    });
    setRemovedItems((prev) => prev.slice(0, -1));
  };

  // Customer Functions
  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer._id);
    setSelectedCustomerName(customer.name);
    setSelectedCustomerPhone(customer.phone);
    const totalCredit = (customer.credits || []).reduce(
      (sum, c) => sum + (c.totalAmount || 0),
      0,
    );
    setSelectedCustomerCredit(totalCredit);
  };

  const handleCustomerAdded = (newCustomer) => {
    setSelectedCustomerId(newCustomer._id);
    setSelectedCustomerName(newCustomer.name);
    setSelectedCustomerPhone(newCustomer.phone);
    setSelectedCustomerCredit(0); // New customers start with 0 credit
    refreshCustomers();
  };

  // Fetch Accounts
  const fetchAccounts = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        setAccounts(res.data.data);
        const cashAccount = res.data.data.find((acc) => acc.type === "Cash");
        if (cashAccount) {
          setSelectedAccountId(cashAccount._id);
        }
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  const fetchBranch = async () => {
    const branch = getDecrypted("branch");
    const branchcode = branch ? branch.code : null;

    if (!branchcode) return; // Handle case where branch code is missing

    try {
      const res = await axios.get(`${API_ENDPOINTS.BRANCH}/${branchcode}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        const branch = res.data.branch;
        if (branch) {
          saveEncrypted("branch", branch);
        }
      }
    } catch (error) {
      toast.error("Failed to load branch");
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchAccounts();
      fetchBranch();
    }
  }, [accessToken]);

  // Payment Handler
  const handlePayment = async (shouldPrint = false) => {
    if (cart.length === 0) return toast.warning("Cart is empty!");
    if (!selectedCustomerId) {
      return toast.warning("Please select or register a customer!");
    }
    if (!selectedAccountId)
      return toast.warning("Please select a payment account!");

    // Final stock check
    const stockError = cart.find((item) => item.qty > item.availableQty);
    if (stockError) {
      return toast.error(
        `Stock mismatch for ${stockError.name}. Available: ${stockError.availableQty}`,
      );
    }

    // IMEI Validation for Mobiles
    const imeiError = cart.find(
      (item) => item.category === "Mobiles" && !item.selectedImei,
    );
    if (imeiError) {
      return toast.error(`Please select an IMEI for ${imeiError.name}`);
    }

    const selectedAccount = accounts.find((a) => a._id === selectedAccountId);
    if (selectedAccount?.currentStatus === "Closed") {
      return toast.error(
        "This account is closed for today. Please use another account.",
      );
    }

    if (selectedAccount?.type === "Credits" && !selectedCustomerId) {
      return toast.warning(
        "Please select/register a customer for Credit payments!",
      );
    }

    setIsProcessing(shouldPrint ? "printing" : "saving");
    try {
      const saleData = {
        customer: selectedCustomerId,
        items: cart.map((item) => {
          const discountAmountPerUnit = (item.price * item.discount) / 100;
          const effectivePrice = Math.max(
            0,
            item.price - discountAmountPerUnit,
          );
          const qty = item.qty;

          let lineTotal, taxAmount, taxableValue;
          const type = (item.gstType || "NotIncluded").toLowerCase();

          if (type === "included") {
            lineTotal = effectivePrice * qty;
            taxAmount = (lineTotal * item.gst) / (100 + item.gst);
            taxableValue = lineTotal - taxAmount;
          } else if (type === "notincluded") {
            taxableValue = effectivePrice * qty;
            taxAmount = (taxableValue * item.gst) / 100;
            lineTotal = taxableValue + taxAmount;
          } else {
            lineTotal = effectivePrice * qty;
            taxableValue = lineTotal;
            taxAmount = 0;
          }

          return {
            product: item._id,
            qty: qty,
            price: item.price,
            discount: Number((discountAmountPerUnit * qty).toFixed(2)),
            taxAmount: Number(taxAmount.toFixed(2)),
            lineTotal: Number(lineTotal.toFixed(2)),
            taxableValue: Number(taxableValue.toFixed(2)),
            imei: item.selectedImei, // Include IMEI for backend
          };
        }),
        subtotal: Number(subtotal.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        discount: Number(totalDiscount.toFixed(2)),
        paymentMethod: selectedAccountId,
      };

      const res = await axios.post(API_ENDPOINTS.SALES.BASE, saleData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        toast.success(
          shouldPrint ? "Sale saved & printing..." : "Sale saved successfully!",
        );

        if (shouldPrint) {
          handlePrint(
            {
              ...saleData,
              billNo: res.data.sale.billNumber,
              formattedDate: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
              customerName: selectedCustomerName,
              customerPhone: selectedCustomerPhone,
              amount: saleData.grandTotal,
              staffName: res.data.staff?.name || user?.name || "Staff",
              paymentMode:
                accounts.find(
                  (a) => a._id.toString() === selectedAccountId.toString(),
                )?.type || "N/A",
              products: cartWithTotals.map((item) => ({
                name: item.name,
                qty: item.qty,
                price: item.price,
                lineTotal: item.lineTotal,
                sku: item.sku,
                imei: item.selectedImei, // Include IMEI for printing
              })),
            },
            { silent: true, branchInfo },
          );
        }

        // Clear browser cache for products and inventory to ensure consistency
        await removeCache(CACHE_KEYS.INVENTORY_RAW);
        await removeCache(CACHE_KEYS.PRODUCTS_FLAT);
        await removeCache(CACHE_KEYS.SALES);

        // Refresh accounts and inventory to show updated balances/stock
        await fetchAccounts();
        if (typeof refreshProducts === "function") {
          refreshProducts();
        }
        if (typeof refreshSales === "function") {
          refreshSales();
        }

        clearTransaction();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearTransaction = () => {
    setCart([]);
    setRemovedItems([]);
    setSelectedCustomerId(null);
    setSelectedCustomerName("");
    setSelectedCustomerPhone("");
    setSelectedCustomerCredit(0);
    searchInputRef.current?.focus();
  };

  // Time Update
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F-Keys
      if (e.key === "F1") {
        e.preventDefault();
        setShowCustomerModal(true);
      } else if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        clearTransaction();
      } else if (e.key === "F6") {
        e.preventDefault();
        tableSearchInputRef.current?.focus();
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          const lastItem = cart[cart.length - 1];
          discountRefs.current[lastItem.cartId]?.focus();
        }
      } else if (e.key === "F9") {
        e.preventDefault();
        handlePayment(false);
      } else if (e.key === "F10") {
        e.preventDefault();
        handlePayment(true);
      } else if (e.key === "F12") {
        e.preventDefault();
        setShowShortcutGuide((prev) => !prev);
      }

      // Combo Keys
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handlePayment(false);
      }
      if (e.key === "Escape") {
        setShowCustomerModal(false);
        setShowShortcutGuide(false);
      }
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        if (cart.length > 0) {
          removeItem(cart[cart.length - 1].cartId);
        }
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        undoRemove();
      }

      // --- Global Barcode Scanner Listener ---
      // Only runs if scanner is enabled in settings
      if (appSettings?.barcodeScanner) {
        const isInputFocused = ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName,
        );

        // If search bar is NOT focused and user starts "typing" alphanumeric characters
        if (!isInputFocused && /^[a-zA-Z0-9]$/.test(e.key)) {
          tableSearchInputRef.current?.focus();
          // The first character is already lost from the input value if we just focus,
          // so we can either wait for a library or manually handle the buffer.
          // For simplicity, we just focus and the scanner usually types the rest fast enough.
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart,
    removedItems,
    grandTotal,
    selectedAccountId,
    selectedCustomerId,
    logout,
    navigate,
  ]);

  if (billingLoading && allProducts.length === 0) {
    return <Loader message="Loading billing data..." />;
  }

  return (
    <div
      className="d-flex flex-column h-100 bg-light overflow-hidden"
      style={{ minHeight: 0 }}
    >
      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
        accessToken={accessToken}
      />

      {/* Main Content Area */}
      <div
        className="flex-grow-1 p-2 overflow-hidden d-flex flex-column"
        style={{ minHeight: 0 }}
      >
        {/* Customer Section - Horizontal at Top */}
        <div className="card shadow-sm mb-2">
          <div className="card-body p-2">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-person-badge text-primary"></i>
                  <h6 className="fw-bold mb-0 small">CUSTOMER SEARCH</h6>
                </div>
                <CustomerSearch
                  customers={allCustomers}
                  onSelectCustomer={handleSelectCustomer}
                  onAddNewCustomer={() => setShowCustomerModal(true)}
                />
              </div>
              <div className="col-md-7">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-check-circle text-primary"></i>
                  <h6 className="fw-bold mb-0 small">SELECTED CUSTOMER</h6>
                </div>
                {selectedCustomerId ? (
                  <div className="card bg-light border-0">
                    <div className="card-body p-2">
                      <div className="d-flex flex-row justify-content-between align-items-center">
                        <div className="d-flex gap-4 align-items-center">
                          <div className="fw-bold text-dark">
                            <i className="bi bi-person me-2"></i>
                            {selectedCustomerName.toUpperCase()}
                          </div>
                          <div className="text-muted small">
                            <i className="bi bi-telephone-outbound me-2"></i>
                            {selectedCustomerPhone}
                          </div>
                          <div
                            className={`badge ${
                              selectedCustomerCredit > 0
                                ? "bg-danger-subtle text-danger"
                                : "bg-success-subtle text-success"
                            } border p-2`}
                          >
                            <i className="bi bi-credit-card me-2"></i>
                            Credit: {getCurrencySymbol(appSettings?.currency)}
                            {selectedCustomerCredit.toFixed(2)}
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => {
                            setSelectedCustomerId(null);
                            setSelectedCustomerName("");
                            setSelectedCustomerPhone("");
                            setSelectedCustomerCredit(0);
                          }}
                          title="Clear Customer"
                        >
                          <i className="bi bi-x-circle-fill fs-5"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card bg-warning bg-opacity-10 border-warning">
                    <div className="card-body p-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle text-warning"></i>
                        <div>
                          <small className="fw-bold text-warning d-block">
                            No Customer Selected
                          </small>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Please select or add a customer to continue
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section - Row with 2 columns */}
        <div
          className="row g-2 flex-grow-1 overflow-hidden m-0"
          style={{ height: 0 }}
        >
          {/* Left Column - Cart */}
          <div className="col-8 d-flex flex-column" style={{ height: "100%" }}>
            <div className="card shadow-sm flex-grow-1 overflow-hidden d-flex flex-column">
              <div
                className="card-body p-0 d-flex flex-column flex-grow-1"
                style={{ height: 0 }}
              >
                {/* Search Bar */}
                <div className="p-3 border-bottom bg-white">
                  <ProductSearch
                    products={allProducts}
                    onAddToCart={addToCart}
                    searchInputRef={searchInputRef}
                    barcodeScannerEnabled={appSettings?.barcodeScanner}
                  />
                </div>

                {/* Cart Table Container */}
                <div
                  className="flex-grow-1 overflow-auto"
                  style={{ height: 0 }}
                >
                  <table className="table table-hover mb-0">
                    <thead
                      className="table-light sticky-top"
                      style={{ zIndex: 10 }}
                    >
                      <tr className="small text-uppercase align-middle">
                        <th
                          style={{ width: "40px" }}
                          className="ps-3 text-center"
                        >
                          #
                        </th>
                        <th style={{ width: "140px" }}>ITEMCODE</th>
                        <th style={{}}>DESCRIPTION</th>
                        <th style={{ width: "110px" }} className="text-center">
                          GST%
                        </th>
                        <th style={{ width: "120px" }} className="text-end">
                          PRICE
                        </th>
                        <th style={{ width: "90px" }} className="text-center">
                          QTY
                        </th>
                        <th style={{ width: "110px" }} className="text-end">
                          DISCOUNT %
                        </th>
                        <th
                          style={{ width: "135px" }}
                          className="text-end pe-3"
                        >
                          TOTAL
                        </th>
                        <th
                          style={{ width: "50px" }}
                          className="text-center"
                        ></th>
                      </tr>
                    </thead>
                    <tbody className="border-top-0">
                      {cart.length === 0 ? (
                        <tr>
                          {/* <td
                            colSpan="8"
                            className="text-center text-muted py-5"
                          >
                            <div className="py-4">
                              <i className="bi bi-cart-x fs-1 d-block mb-3 opacity-25"></i>
                              <h6 className="fw-light">Cart is empty</h6>
                              <p className="small mb-0 text-secondary">
                                Start scanning or searching products to add them
                                here
                              </p>
                            </div>
                          </td> */}
                        </tr>
                      ) : (
                        cartWithTotals.map((item, idx) => (
                          <tr
                            key={item.cartId}
                            className="align-middle border-bottom"
                          >
                            <td className="text-center small ps-3 text-muted">
                              {idx + 1}
                            </td>
                            <td className="fw-bold small text-dark">
                              <span className="text-muted">{item.sku}</span>
                            </td>
                            <td>
                              <div className="fw-bold small text-dark">
                                {item.name}
                              </div>
                              <div
                                className="d-flex flex-column gap-1"
                                style={{ fontSize: "0.7rem" }}
                              >
                                <div className="d-flex gap-2 align-items-center">
                                  <span
                                    className={`badge ${
                                      item.availableQty <=
                                      (item.lowStockThreshold || 5)
                                        ? "bg-danger-subtle text-danger"
                                        : "bg-success-subtle text-success"
                                    } px-1`}
                                    style={{ fontSize: "0.65rem" }}
                                  >
                                    Stock: {item.availableQty} {item.unit}
                                  </span>
                                </div>
                                {item.category === "Mobiles" && (
                                  <div className="mt-1">
                                    <select
                                      className="form-select form-select-sm p-0 ps-1"
                                      style={{
                                        fontSize: "0.75rem",
                                        height: "auto",
                                        minHeight: "24px",
                                      }}
                                      value={item.selectedImei}
                                      onChange={(e) =>
                                        updateImei(item.cartId, e.target.value)
                                      }
                                      required
                                    >
                                      <option value="">Select IMEI</option>
                                      {(item.imei || []).map((imei, i) => (
                                        <option key={i} value={imei}>
                                          {imei}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <div
                                className="d-flex flex-row gap-2 align-items-center justify-content-center bg-light rounded-2 mx-auto"
                                style={{ width: "90px", height: "30px" }}
                              >
                                <span className="fw-bold small text-dark">
                                  {item.gst}%
                                </span>
                                <small
                                  className="text-muted fw-bold"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {item.gstType === "Included"
                                    ? "(Incl.)"
                                    : "(Excl.)"}
                                </small>
                              </div>
                            </td>
                            <td className="text-end">
                              <div
                                className="d-flex align-items-center justify-content-end bg-light rounded-2 px-1 ms-auto"
                                style={{ width: "90px", height: "30px" }}
                              >
                                <span
                                  className="text-muted small fw-bold px-1"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {getCurrencySymbol(appSettings?.currency)}
                                </span>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-end border-0 bg-transparent p-0"
                                  value={item.price}
                                  onChange={(e) =>
                                    updatePrice(item.cartId, e.target.value)
                                  }
                                  step="0.01"
                                  style={{
                                    width: "60px",
                                    fontSize: "0.85rem",
                                    boxShadow: "none",
                                  }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <div
                                className="d-flex align-items-center justify-content-center bg-light rounded-2 mx-auto"
                                style={{ width: "60px", height: "30px" }}
                              >
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center small border-0 bg-transparent p-0"
                                  value={item.qty}
                                  onChange={(e) =>
                                    setQty(item.cartId, e.target.value)
                                  }
                                  min="1"
                                  readOnly={item.category === "Mobiles"}
                                  style={{
                                    width: "100%",
                                    fontSize: "0.85rem",
                                    boxShadow: "none",
                                    backgroundColor:
                                      item.category === "Mobiles"
                                        ? "#f8f9fa"
                                        : "transparent",
                                  }}
                                />
                              </div>
                            </td>
                            <td className="text-end">
                              <div className="d-flex flex-column align-items-end">
                                <div
                                  className={`d-flex align-items-center justify-content-end ${
                                    item.isBelowCP
                                      ? "bg-danger-subtle border-danger"
                                      : "bg-light"
                                  } rounded-2 px-1 ms-auto`}
                                  style={{
                                    width: "80px",
                                    height: "30px",
                                    border: "1px solid transparent",
                                  }}
                                >
                                  <input
                                    type="number"
                                    className="form-control form-control-sm text-end small border-0 bg-transparent p-0"
                                    value={item.discount}
                                    ref={(el) =>
                                      (discountRefs.current[item.cartId] = el)
                                    }
                                    onChange={(e) =>
                                      updateDiscount(
                                        item.cartId,
                                        e.target.value,
                                        false,
                                      )
                                    }
                                    onBlur={(e) =>
                                      updateDiscount(
                                        item.cartId,
                                        e.target.value,
                                        true,
                                      )
                                    }
                                    min="0"
                                    max="100"
                                    style={{
                                      width: "55px",
                                      fontSize: "0.85rem",
                                      boxShadow: "none",
                                    }}
                                  />
                                  <span
                                    className="text-muted fw-bold ps-1"
                                    style={{ fontSize: "0.75rem" }}
                                  >
                                    %
                                  </span>
                                </div>
                                {item.isBelowCP && (
                                  <div
                                    className="text-danger fw-bold mt-1"
                                    style={{ fontSize: "0.65rem" }}
                                  >
                                    Below CP (₹{item.costPrice.toFixed(2)})
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-end pe-3">
                              <div
                                className="d-flex align-items-center justify-content-end bg-light rounded-2 px-1 ms-auto"
                                style={{ width: "110px", height: "30px" }}
                              >
                                <span
                                  className="text-muted small fw-bold px-1"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {getCurrencySymbol(appSettings?.currency)}
                                </span>
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-end fw-bold border-0 bg-transparent p-0"
                                  value={item.lineTotal.toFixed(2)}
                                  onChange={(e) =>
                                    updateLineTotal(
                                      item.cartId,
                                      e.target.value,
                                      false,
                                    )
                                  }
                                  onBlur={(e) =>
                                    updateLineTotal(
                                      item.cartId,
                                      e.target.value,
                                      true,
                                    )
                                  }
                                  step="0.01"
                                  style={{
                                    width: "75px",
                                    fontSize: "0.85rem",
                                    color: "#1e293b",
                                    boxShadow: "none",
                                  }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-link text-danger p-0"
                                onClick={() => removeItem(item.cartId)}
                              >
                                <i className="bi bi-trash fs-6"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Add Product Row */}
                      <tr className="bg-light bg-opacity-10">
                        <td className="text-center small ps-3 text-muted align-middle">
                          {cart.length + 1}
                        </td>
                        <td className="p-0 align-middle" colSpan="2">
                          <ProductSearch
                            products={allProducts}
                            onAddToCart={addToCart}
                            searchInputRef={tableSearchInputRef}
                            barcodeScannerEnabled={appSettings?.barcodeScanner}
                            showButton={false}
                            isTable={true}
                            minimal={true}
                            placeholder="Scan Barcode or Search Product Name..."
                            dropdownWidth="500px"
                            skuOnly={false}
                          />
                        </td>
                        <td className="text-center align-middle">
                          <div
                            className="bg-light bg-opacity-50 rounded-2 mx-auto"
                            style={{ width: "80px", height: "30px" }}
                          ></div>
                        </td>
                        <td className="text-end align-middle">
                          <div
                            className="bg-light bg-opacity-50 rounded-2 ms-auto"
                            style={{ width: "95px", height: "30px" }}
                          ></div>
                        </td>
                        <td className="text-center align-middle">
                          <div
                            className="bg-light bg-opacity-50 rounded-2 mx-auto"
                            style={{ width: "65px", height: "30px" }}
                          ></div>
                        </td>
                        <td className="text-end align-middle">
                          <div
                            className="bg-light bg-opacity-50 rounded-2 ms-auto"
                            style={{ width: "85px", height: "30px" }}
                          ></div>
                        </td>
                        <td className="text-end align-middle pe-3">
                          <div
                            className="bg-light bg-opacity-50 rounded-2 ms-auto"
                            style={{ width: "115px", height: "30px" }}
                          ></div>
                        </td>
                        <td className="text-center"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="col-4 d-flex flex-column" style={{ height: "100%" }}>
            <div
              className="card shadow-sm overflow-hidden flex-grow-1 d-flex flex-column"
              style={{ height: "100%" }}
            >
              <div
                className="card-body p-3 d-flex flex-column overflow-auto"
                style={{ height: 0 }}
              >
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-wallet2 text-primary"></i>
                  <h6 className="fw-bold mb-0">BILLING SUMMARY</h6>
                </div>

                <div className="bg-light p-3 rounded-3 mb-4 flex-shrink-0">
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted small">Subtotal</span>
                    <span className="fw-bold small">
                      {getCurrencySymbol(appSettings?.currency)}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted small">Tax (GST)</span>
                    <span className="fw-bold small">
                      {getCurrencySymbol(appSettings?.currency)}
                      {totalTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted small">Total Discount</span>
                    <span className="fw-bold small text-danger">
                      - {getCurrencySymbol(appSettings?.currency)}
                      {totalDiscount.toFixed(2)}
                    </span>
                  </div>
                  <hr className="my-1 opacity-10" />
                  <div className="d-flex justify-content-between align-items-end">
                    <div>
                      <span
                        className="text-muted d-block"
                        style={{ fontSize: "0.7rem" }}
                      >
                        TOTAL PAYABLE
                      </span>
                      <span className="fs-3 fw-bold text-primary">
                        {getCurrencySymbol(appSettings?.currency)}
                        {grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-end pb-1">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-normal">
                        {totalItems} items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex-shrink-0">
                  <label
                    className="fw-bold small text-uppercase text-muted mb-3"
                    style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}
                  >
                    Payment Account
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc._id}
                        className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 py-2 px-3 transition-all ${
                          selectedAccountId === acc._id
                            ? "btn-primary shadow-sm"
                            : "btn-outline-primary"
                        }`}
                        onClick={() => setSelectedAccountId(acc._id)}
                        disabled={
                          isProcessing || acc.currentStatus === "Closed"
                        }
                        style={{ minWidth: "100px", borderRadius: "8px" }}
                      >
                        <i
                          className={`bi ${
                            acc.type === "Cash"
                              ? "bi-cash-stack"
                              : acc.type === "Upi"
                                ? "bi-qr-code"
                                : "bi-credit-card"
                          }`}
                        ></i>
                        <span className="small fw-500">
                          {acc.type === "Upi" ? acc.upiAccountName : acc.type}
                          {acc.currentStatus === "Closed" && " (Closed)"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedAccountId && (
                  <div className="alert alert-secondary border-0 bg-light p-2 rounded-3 flex-shrink-0">
                    <div className="d-flex justify-content-between mb-3">
                      <small className="text-muted">Account Balance:</small>
                      <small className="fw-bold">
                        {getCurrencySymbol(appSettings?.currency)}
                        {accounts
                          .find((a) => a._id === selectedAccountId)
                          ?.currentBalance?.toFixed(2) || "0.00"}
                      </small>
                    </div>
                  </div>
                )}

                <div className=" flex-shrink-0  border-top">
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary flex-fill "
                        onClick={() => handlePayment(false)}
                        disabled={
                          isProcessing ||
                          cart.length === 0 ||
                          !selectedAccountId ||
                          !selectedCustomerId ||
                          cartWithTotals.some((i) => i.isBelowCP)
                        }
                      >
                        {isProcessing === "saving" ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-arrow-up me-2"></i>Save
                            Bill
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-success flex-fill "
                        onClick={() => handlePayment(true)}
                        disabled={
                          isProcessing ||
                          cart.length === 0 ||
                          !selectedAccountId ||
                          !selectedCustomerId ||
                          cartWithTotals.some((i) => i.isBelowCP)
                        }
                      >
                        {isProcessing === "printing" ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Printing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-printer me-2"></i>Save & Print
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      className="btn btn-outline-danger w-100 py-2 border-0 bg-light bg-opacity-50 text-danger hover-bg-danger hover-text-white transition-all"
                      onClick={clearTransaction}
                      disabled={isProcessing || cart.length === 0}
                    >
                      <i className="bi bi-trash3 me-2"></i>Discard Transaction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcut Guide Modal */}
      <ShortcutGuide
        isOpen={showShortcutGuide}
        onClose={() => setShowShortcutGuide(false)}
      />
    </div>
  );
};

export default ProductBilling;
