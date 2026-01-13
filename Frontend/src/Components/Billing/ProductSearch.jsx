import React, { useState, useRef, useEffect } from "react";

const ProductSearch = ({
  products,
  onAddToCart,
  searchInputRef,
  barcodeScannerEnabled,
  showButton = true,
  isTable = false,
  minimal = false,
  placeholder = "",
  dropdownWidth = "100%",
  skuOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (query.trim()) {
      let filtered;
      if (skuOnly) {
        // Only search by SKU in table mode if skuOnly is true
        filtered = products.filter((p) =>
          p.sku.toLowerCase().includes(query.toLowerCase())
        );

        // Auto-select if it's an exact SKU match
        const exactMatch = filtered.find(
          (p) => p.sku.toLowerCase() === query.trim().toLowerCase()
        );
        if (exactMatch) {
          onAddToCart(exactMatch);
          clearSearch();
          return; // Exit early
        }
      } else {
        filtered = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase() === query.toLowerCase() || // Exact SKU Match
            p.sku.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Barcode Scanner Optimization: If exact SKU match is found, prioritize it
      const exactMatch = filtered.find(
        (p) => p.sku.toLowerCase() === query.toLowerCase()
      );
      if (exactMatch) {
        setSuggestions([
          exactMatch,
          ...filtered.filter((p) => p._id !== exactMatch._id),
        ]);
      } else {
        setSuggestions(filtered);
      }

      setShowSuggestions(true);

      // If exact SKU match and it's likely a barcode scan (long string, fast input)
      // we could auto-add, but handleSearchSubmit usually handles the 'Enter' from scanner
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      // Prioritize exact SKU match if available
      const exactMatch = suggestions.find(
        (p) => p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      const productToAdd =
        exactMatch ||
        (selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0]);

      onAddToCart(productToAdd);
      clearSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Logic handled by handleSearchSubmit
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (product) => {
    onAddToCart(product);
    clearSearch();
  };

  const handleScannerFocus = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  return (
    <div className={`position-relative w-100 ${isTable ? "my-0" : ""}`}>
      <form
        onSubmit={handleSearchSubmit}
        className={`d-flex gap-2 ${isTable ? "m-0" : ""}`}
      >
        <div
          className={`input-group flex-grow-1 ${
            isTable && !minimal
              ? "shadow-none"
              : isTable && minimal
              ? ""
              : "shadow-sm"
          }`}
        >
          {!minimal && (
            <span
              className={`input-group-text bg-white border-end-0 ${
                isTable ? "py-1 px-2" : ""
              }`}
            >
              <i
                className={`bi bi-search ${
                  isTable ? "text-muted" : "text-primary"
                }`}
              ></i>
            </span>
          )}
          <input
            ref={searchInputRef}
            type="text"
            className={`form-control ${
              minimal ? "border-0 bg-transparent" : "border-start-0 ps-0"
            } ${isTable ? "fw-normal py-1" : "fw-medium"}`}
            placeholder={
              placeholder ||
              (barcodeScannerEnabled
                ? "Scan Barcode or Search..."
                : "Search Product Name or SKU...")
            }
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            autoComplete="off"
            style={{
              height: isTable ? "35px" : "45px",
              fontSize: isTable ? "0.85rem" : "inherit",
              outline: "none",
              boxShadow: "none",
            }}
          />
          {/* Barcode Scan Focus Button - only if not minimal */}
          {barcodeScannerEnabled && !minimal && (
            <button
              type="button"
              className="btn btn-light border-start border-top border-bottom"
              onClick={handleScannerFocus}
              title="Focus for Scanner"
              style={{
                zIndex: 5,
                background: "#f8fafc",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "0",
                width: "45px",
                padding: isTable ? "0 8px" : "inherit",
              }}
            >
              <i
                className={`bi bi-upc-scan text-primary text-muted ${
                  isTable ? "small" : ""
                }`}
              ></i>
            </button>
          )}
        </div>
        {showButton && !minimal && (
          <button
            type="submit"
            className="btn btn-primary px-4 fw-bold d-flex align-iitems-center justify-content-center gap-1"
            disabled={!searchQuery.trim()}
            style={{ height: "50px" }}
          >
            <i className="bi bi-search me-2 mt-2"></i>
            <span className="mt-2">Search</span>
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="position-absolute start-0 shadow-lg rounded bg-white mt-1 border"
          style={{
            zIndex: 9999,
            maxHeight: "350px",
            overflowY: "auto",
            width: dropdownWidth,
            minWidth: isTable ? "450px" : "100%",
          }}
        >
          <ul className="list-group list-group-flush m-0">
            {suggestions.map((product, index) => (
              <li
                key={product._id}
                className={`list-group-item list-group-item-action p-2 ${
                  index === selectedIndex ? "active text-white" : ""
                }`}
                onClick={() => handleSuggestionClick(product)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{ cursor: "pointer" }}
              >
                <div className="d-flex justify-content-between align-items-center gap-3">
                  <div className="flex-grow-1 min-w-0">
                    <div
                      className={`fw-bold ${
                        index === selectedIndex ? "text-white" : ""
                      }`}
                    >
                      {product.name}
                    </div>
                    <small
                      className={
                        index === selectedIndex
                          ? "text-white opacity-75"
                          : "text-muted"
                      }
                    >
                      SKU: {product.sku}
                    </small>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <div
                      className={`fw-bold ${
                        index === selectedIndex ? "text-white" : "text-primary"
                      }`}
                    >
                      ₹{product.price}
                    </div>
                    <small
                      className={
                        index === selectedIndex
                          ? "text-white opacity-75"
                          : product.availableQty <= 0
                          ? "text-danger fw-bold"
                          : "text-muted"
                      }
                    >
                      {product.availableQty <= 0
                        ? "OUT OF STOCK"
                        : `Stock: ${product.availableQty}`}
                    </small>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions && searchQuery && suggestions.length === 0 && (
        <div
          className="position-absolute start-0 w-100 shadow-lg rounded-3 bg-white mt-2 border p-3 text-center text-muted"
          style={{ zIndex: 1050 }}
        >
          <i className="bi bi-inbox fs-3 d-block mb-2"></i>
          No products found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
