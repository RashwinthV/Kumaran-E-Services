import React, { useEffect } from "react";
import { getCurrencySymbol } from "../../utils/serviceBillingConstants";

const LocalServiceInputs = ({
  selectedService,
  formData,
  handleInputChange,
  currency,
  serviceSettings,
}) => {
  const isXeroxPrintScan = ["Xerox", "Printout", "Scan"].includes(
    selectedService,
  );
  const isPhotoLami = ["Photograph", "Lamination"].includes(selectedService);

  // Auto-fill rates from settings based on TYPE (Xerox/Print/Scan)
  useEffect(() => {
    if (isXeroxPrintScan && formData.type) {
      let prefix = "";
      if (selectedService === "Xerox") prefix = "xerox";
      else if (selectedService === "Printout") prefix = "print";
      else if (selectedService === "Scan") prefix = "scan";

      const settingsKey = `${prefix}_${formData.type.replace(/\s/g, "_")}`;
      const specificRate = serviceSettings?.[settingsKey];

      if (
        specificRate !== undefined &&
        specificRate !== null &&
        specificRate !== ""
      ) {
        handleInputChange("rate", specificRate);
        if (formData.pages) {
          const total = (parseFloat(formData.pages) || 0) * specificRate;
          handleInputChange("baseAmount", total.toFixed(2));
        }
      }
    }
  }, [
    formData.type,
    selectedService,
    isXeroxPrintScan,
    serviceSettings,
    handleInputChange,
    formData.pages,
  ]);

  // Handle Photo/Lami Item-level default price when TYPE changes
  const handleItemTypeChange = (idx, type) => {
    const items = [...formData.localItems];
    items[idx].type = type;

    // Auto-update price for this item based on type
    let prefix = selectedService === "Photograph" ? "photo" : "lami";
    // Sanitize key (match settings format)
    const sanitizedType = type.replace(/[()\/\s]/g, "_");
    const settingsKey = `${prefix}_${sanitizedType}`;
    const specificPrice = serviceSettings?.[settingsKey];

    if (
      specificPrice !== undefined &&
      specificPrice !== null &&
      specificPrice !== ""
    ) {
      items[idx].price = specificPrice;
    }

    handleInputChange("localItems", items);
    updatePhotoTotal(items);
  };

  // Default to 1 field if empty
  useEffect(() => {
    if (
      isPhotoLami &&
      (!formData.localItems || formData.localItems.length === 0)
    ) {
      handleInputChange("localItems", [{ type: "", qty: 1, price: "" }]);
    }
  }, [isPhotoLami, formData.localItems, handleInputChange]);

  // Helper to update base amount for Xerox/Print/Scan
  const updateXeroxTotal = (newPages, newRate) => {
    const total = (parseFloat(newPages) || 0) * (parseFloat(newRate) || 0);
    handleInputChange("baseAmount", total > 0 ? total.toFixed(2) : "");
  };

  // Helper to update base amount for Photo/Lami
  const updatePhotoTotal = (newItems) => {
    const total = newItems.reduce(
      (sum, item) =>
        sum + (parseInt(item.qty) || 0) * (parseFloat(item.price) || 0),
      0,
    );
    handleInputChange("baseAmount", total > 0 ? total.toFixed(2) : "");
  };

  if (isXeroxPrintScan) {
    return (
      <div className="row g-2 mb-2">
        <div className="col-md-3">
          <label className="small text-muted fw-bold">Paper Type/Size</label>
          <select
            className="form-select form-select-sm"
            value={formData.type || ""}
            onChange={(e) => handleInputChange("type", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="A4 B&W">A4 B&W</option>
            <option value="A4 Color">A4 Color</option>
            <option value="A3 B&W">A3 B&W</option>
            <option value="A3 Color">A3 Color</option>
            <option value="Legal Size">Legal Size</option>
            <option value="ID Card Size">ID Card Size</option>
            <option value="Other">Other...</option>
          </select>
          {formData.type === "Other" && (
            <input
              type="text"
              className="form-control form-control-sm mt-1"
              placeholder="Specify type..."
              value={formData.customType || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
                handleInputChange("customType", val);
              }}
            />
          )}
        </div>
        <div className="col-md-3">
          <label className="small text-muted fw-bold">No. of Pages</label>
          <div
            className="d-flex align-items-center bg-light rounded-2 px-2"
            style={{ height: "35px" }}
          >
            <input
              type="number"
              className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
              value={formData.pages || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                handleInputChange("pages", val);
                updateXeroxTotal(val, formData.rate);
              }}
              placeholder="0"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
        </div>
        <div className="col-md-3">                      <label className="small text-muted fw-bold">Price Per Page</label>

          <div
            className="d-flex align-items-center bg-light rounded-2 px-1"
            style={{ height: "35px" }}
          >

            <div
              className="d-flex align-items-center justify-content-center bg-white rounded px-2 ms-1"
              style={{ height: "25px", minWidth: "25px" }}
            >
              <span
                className="fw-bold text-primary"
                style={{ fontSize: "0.7rem" }}
              >
                {getCurrencySymbol(currency)}
              </span>
            </div>
            <input
              type="number"
              className="form-control border-0 bg-transparent shadow-none text-end p-0 pe-2"
              value={formData.rate || ""}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, "");
                const dots = val.match(/\./g);
                if (dots && dots.length > 1) return;
                handleInputChange("rate", val);
                updateXeroxTotal(formData.pages, val);
              }}
              placeholder="0.00"
              style={{ fontSize: "0.85rem" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (isPhotoLami) {
    return (
      <div className="col-12 border rounded p-3 bg-light-subtle">
        {selectedService === "Photograph" && (
          <div className="mb-3">
            <label className="small text-muted fw-bold">
              PHOTO ID / SLIP NO
            </label>
            <div
              className="d-flex align-items-center bg-light border border-primary border-opacity-25 rounded-2 px-2 shadow-sm"
              style={{ height: "40px" }}
            >
              <i className="bi bi-hash text-primary me-2"></i>
              <input
                type="text"
                className="form-control border-0 bg-transparent p-0 shadow-none fw-bold text-primary"
                value={formData.photoId || ""}
                onChange={(e) => handleInputChange("photoId", e.target.value)}
                placeholder="Enter Photo/Slip ID..."
              />
            </div>
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <label className="small fw-bold text-primary text-uppercase mb-0">
            {selectedService} Items List
          </label>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary py-0 px-2"
            onClick={() => {
              const items = [...(formData.localItems || [])];
              items.push({ type: "", qty: 1, price: "" });
              handleInputChange("localItems", items);
            }}
          >
            <i className="bi bi-plus-circle me-1"></i> Add Item
          </button>
        </div>

        <div
          className="local-items-list overflow-auto pe-1"
          style={{ maxHeight: "200px" }}
        >
          {(formData.localItems || []).map((item, idx) => (
            <div
              key={idx}
              className="row g-2 mb-2 align-items-center bg-white p-2 rounded border mx-0 shadow-sm"
            >
              <div className="col-md-5">
                <label
                  className="small text-muted"
                  style={{ fontSize: "0.7rem" }}
                >
                  Type / Size
                </label>
                <select
                  className="form-select form-select-sm"
                  value={item.type}
                  onChange={(e) => handleItemTypeChange(idx, e.target.value)}
                >
                  <option value="">Select Type...</option>
                  {selectedService === "Photograph" ? (
                    <>
                      <option value="Passport Size">Passport Size</option>
                      <option value="Stamp Size">Stamp Size</option>
                      <option value="4x6 (Postcard)">4x6 (Postcard)</option>
                      <option value="5x7">5x7</option>
                      <option value="6x8">6x8</option>
                      <option value="8x10">8x10</option>
                      <option value="A4 Size">A4 Size</option>
                      <option value="Other">Other...</option>
                    </>
                  ) : (
                    <>
                      <option value="ID Card / Aadhaar">
                        ID Card / Aadhaar
                      </option>
                      <option value="A4 Size">A4 Size</option>
                      <option value="A3 Size">A3 Size</option>
                      <option value="Legal Size">Legal Size</option>
                      <option value="4x6 Size">4x6 Size</option>
                      <option value="B5 Size">B5 Size</option>
                      <option value="Other">Other...</option>
                    </>
                  )}
                </select>
                {item.type === "Other" && (
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    placeholder="Specify other..."
                    onChange={(e) => {
                      const items = [...formData.localItems];
                      items[idx].customType = e.target.value.replace(
                        /[^a-zA-Z\s.]/g,
                        "",
                      );
                      handleInputChange("localItems", items);
                    }}
                  />
                )}
              </div>
              <div className="col-md-2">
                <label
                  className="small text-muted"
                  style={{ fontSize: "0.7rem" }}
                >
                  Qty
                </label>
                <div
                  className="d-flex align-items-center bg-light rounded-2 px-2"
                  style={{ height: "30px" }}
                >
                  <input
                    type="number"
                    className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none text-center"
                    value={item.qty}
                    onChange={(e) => {
                      const items = [...formData.localItems];
                      items[idx].qty = e.target.value.replace(/[^0-9]/g, "");
                      handleInputChange("localItems", items);
                      updatePhotoTotal(items);
                    }}
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="d-flex align-items-center bg-light rounded-2 px-2"
                  style={{ height: "30px" }}
                >
                  <span
                    className="text-primary fw-bold me-1"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {getCurrencySymbol(currency)}
                  </span>
                  <input
                    type="number"
                    className="form-control border-0 bg-transparent p-0 shadow-none text-end"
                    placeholder="0.00"
                    value={item.price}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9.]/g, "");
                      const dots = val.match(/\./g);
                      if (dots && dots.length > 1) return;
                      const items = [...formData.localItems];
                      items[idx].price = val;
                      handleInputChange("localItems", items);
                      updatePhotoTotal(items);
                    }}
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>
              </div>
              <div className="col-md-1 text-end mt-3">
                {formData.localItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm p-0 text-danger border-0 h-100"
                    onClick={() => {
                      const items = formData.localItems.filter(
                        (_, i) => i !== idx,
                      );
                      handleInputChange("localItems", items);
                      updatePhotoTotal(items);
                    }}
                  >
                    <i className="bi bi-trash fs-6"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <label className="small text-muted fw-bold">Description</label>
      <input
        type="text"
        className="form-control form-control-sm"
        value={formData.description || ""}
        onChange={(e) => handleInputChange("description", e.target.value)}
        placeholder="Details..."
      />
    </div>
  );
};

export default LocalServiceInputs;
