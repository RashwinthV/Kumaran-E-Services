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
          p.sku.toLowerCase().includes(query.toLowerCase()),
        );

        // Auto-select if it's an exact SKU match
        const exactMatch = filtered.find(
          (p) => p.sku.toLowerCase() === query.trim().toLowerCase(),
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
            p.sku.toLowerCase().includes(query.toLowerCase()),
        );
      }

      // Barcode Scanner Optimization: If exact SKU match is found, prioritize it
      const exactMatch = filtered.find(
        (p) => p.sku.toLowerCase() === query.toLowerCase(),
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
        (p) => p.sku.toLowerCase() === searchQuery.trim().toLowerCase(),
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
      handleSearchSubmit(e);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
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

  // If minimal is true, we render a simpler version for the table row
  if (minimal) {
    return (
      <div className="position-relative w-100">
        <input
          ref={searchInputRef}
          type="text"
          className="form-control border-0 bg-transparent shadow-none fw-normal py-1"
          placeholder={placeholder || "SKU..."}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          autoComplete="off"
          style={{ height: "35px", fontSize: "0.85rem" }}
        />
        {/* Suggestions Dropdown for Minimal Mode */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="position-absolute start-0 shadow-lg rounded bg-white mt-1 border"
            style={{
              zIndex: 9999,
              maxHeight: "300px",
              overflowY: "auto",
              width: dropdownWidth,
              minWidth: "400px",
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
                  <div className="d-flex justify-content-between align-items-center small">
                    <div className="flex-grow-1">
                      <div className="fw-bold">{product.name}</div>
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
                    <div className="text-end">
                      <div className="fw-bold">₹{product.price}</div>
                      <small
                        className={
                          index === selectedIndex
                            ? "text-white opacity-75"
                            : "text-muted"
                        }
                      >
                        Stock: {product.availableQty}
                      </small>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Standard Mode (Header)
  return (
    <div className="position-relative w-100">
      <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
        <div className="input-group flex-grow-1 shadow-sm rounded-3 overflow-hidden">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-primary me-2"></i>
     
          <input
            ref={searchInputRef}
            type="text"
            className="form-control border-start-0 ps-0 fw-medium"
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
            style={{ height: "45px", outline: "none", boxShadow: "none" }}
          />
               </span>
          {barcodeScannerEnabled && (
            <button
              type="button"
              className="btn btn-light border-start"
              onClick={handleScannerFocus}
              title="Focus for Scanner"
              style={{ width: "45px" }}
            >
              <i className="bi bi-upc-scan text-primary"></i>
            </button>
          )}
        </div>

        {showButton && (
          <button
            type="submit"
            className="btn btn-primary px-4 fw-bold"
            disabled={!searchQuery.trim()}
          >
            <i className="bi bi-search me-2"></i>
            Search
          </button>
        )}
      </form>

      {/* Standard Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="position-absolute start-0 shadow-lg rounded bg-white mt-1 border"
          style={{
            zIndex: 9999,
            maxHeight: "350px",
            overflowY: "auto",
            width: dropdownWidth,
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
                  <div className="flex-grow-1">
                    <div
                      className={`fw-bold ${index === selectedIndex ? "text-white" : ""}`}
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
                  <div className="text-end">
                    <div
                      className={`fw-bold ${index === selectedIndex ? "text-white" : "text-primary"}`}
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

      {/* No Results */}
      {showSuggestions && searchQuery && suggestions.length === 0 && (
        <div
          className="position-absolute start-0 w-100 shadow-lg rounded-3 bg-white mt-2 border p-3 text-center text-muted"
          style={{ zIndex: 1050 }}
        >
          No products found for "{searchQuery}"
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
