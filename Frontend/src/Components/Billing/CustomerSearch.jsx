import React, { useState } from "react";

const CustomerSearch = ({ customers, onSelectCustomer, onAddNewCustomer }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (query.trim()) {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
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
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectCustomer(suggestions[selectedIndex]);
        }
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

  const selectCustomer = (customer) => {
    onSelectCustomer(customer);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="position-relative mb-2">
      <div className="input-group input-group-sm">
        <span className="input-group-text bg-transparent border-end-0">
          <i className="bi bi-search text-secondary me-2"></i>
     
        <input
          type="text"
          className="form-control border-start-0 ps-0"
          placeholder="Search Customer by name or phone..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete="off"
        />
           </span>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="position-absolute start-0 w-100 shadow-lg rounded bg-white mt-1 border"
          style={{ zIndex: 9999, maxHeight: "250px", overflowY: "auto" }}
        >
          <ul className="list-group list-group-flush m-0">
            {suggestions.map((cust, index) => (
              <li
                key={cust._id}
                className={`list-group-item list-group-item-action p-2 ${
                  index === selectedIndex ? "active text-white" : ""
                }`}
                onClick={() => selectCustomer(cust)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{ cursor: "pointer" }}
              >
                <div className="fw-bold small">{cust.name}</div>
                <small
                  className={
                    index === selectedIndex
                      ? "text-white opacity-75"
                      : "text-secondary"
                  }
                  style={{ fontSize: "0.7rem" }}
                >
                  {cust.phone} • {cust.city || "N/A"}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add New Customer Button */}
      <button
        className="btn btn-sm btn-outline-primary w-100 mt-2"
        onClick={onAddNewCustomer}
      >
        <i className="bi bi-person-plus me-2"></i>
        Add New Customer
      </button>
    </div>
  );
};

export default CustomerSearch;
