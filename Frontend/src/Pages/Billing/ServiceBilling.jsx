import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import { useBilling } from "../../Context/BillingContext";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { getDecrypted, saveEncrypted } from "../../utils/storage";
import { handlePrint } from "../../utils/printUtils";
import "../../Styles/dashboard.css";

// Import Modular Components
import {
  SERVICE_MODULES,
  SERVICE_FIELDS_CONFIG,
  getCurrencySymbol,
} from "../../utils/serviceBillingConstants";
import ServiceCustomerSelect from "../../Components/ServiceBilling/ServiceCustomerSelect";
import ServiceCategoryTabs from "../../Components/ServiceBilling/ServiceCategoryTabs";
import ServiceTypeSelector from "../../Components/ServiceBilling/ServiceTypeSelector";
import ServiceInputForm from "../../Components/ServiceBilling/ServiceInputForm";
import ServicePaymentSummary from "../../Components/ServiceBilling/ServicePaymentSummary";
import ServiceCart from "../../Components/ServiceBilling/ServiceCart";
import ServiceSettingsModal from "../../Components/ServiceBilling/ServiceSettingsModal";
import PendingRepairsList from "../../Components/ServiceBilling/PendingRepairsList";
import CustomerModal from "../../Components/Billing/CustomerModal";
import ShortcutGuide from "../../Components/Navigation/ShortcutGuide";

const ServiceBilling = () => {
  const { accessToken } = useAuth();
  const { refreshSales, branchInfo } = useBilling();
  const location = useLocation();
  const navigate = useNavigate();
  const [appSettings] = useState(() => getDecrypted("app_settings"));
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Customer Modal State
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // --- COMPONENT STATE ---
  const [serviceSettings, setServiceSettings] = useState(
    () => getDecrypted("service_settings") || {},
  );
  const [selectedModule, setSelectedModule] = useState(() => {
    // Correctly parse hash from location or window specifically for HashRouter fragments
    const rawHash = window.location.hash;
    const fragment = rawHash.includes("#", 2)
      ? rawHash.split("#")[2]
      : rawHash.split("#")[1] === "/service-billing"
        ? "LOCAL"
        : rawHash.split("#")[1];

    return SERVICE_MODULES[fragment] ? fragment : "LOCAL";
  });
  const [selectedService, setSelectedService] = useState(() => {
    const rawHash = window.location.hash;
    const fragment = rawHash.includes("#", 2)
      ? rawHash.split("#")[2]
      : rawHash.split("#")[1] === "/service-billing"
        ? "LOCAL"
        : rawHash.split("#")[1];

    const initialModule = SERVICE_MODULES[fragment] ? fragment : "LOCAL";
    return SERVICE_MODULES[initialModule]?.services?.[0] || "";
  });

  // Unified Form Data State
  const [formData, setFormData] = useState({
    // Financials
    baseAmount: "",
    serviceCharge: serviceSettings.defaultServiceCharge || "",
    qty: 1,

    // Identifiers
    consumerId: "",
    providerName: "",
    referenceId: "",

    // Period / Plan
    planDetails: "",
    planType: "Prepaid",

    // Person Details
    customerNameField: "",
    photoId: "", // New field for Photography

    // Ticket Specifics
    travelDate: "",
    fromLoc: "",
    toLoc: "",
    transportName: "",
    passengerAge: "",
    passengerGender: "Male",

    // Generic
    description: "",

    // Repair Specific
    repairsNeeded: "",
    componentsChanged: "",
    repairItems: [{ name: "", price: "" }],
    serviceId: "", // Auto-generated ID
  });

  // Complaints / Unpaid Repairs State
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  // Component Suggestions State (For "dropdown" behavior on component names)
  const [componentSuggestions, setComponentSuggestions] = useState(() => {
    const saved = localStorage.getItem("repair_component_suggestions");
    return saved
      ? JSON.parse(saved)
      : ["Screen", "Battery", "Charging Port", "Display", "Speaker", "Camera"];
  });

  const saveNewComponents = (items) => {
    const newNames = items
      .map((item) => item.name.trim())
      .filter((name) => name && !componentSuggestions.includes(name));

    if (newNames.length > 0) {
      const updated = [...new Set([...componentSuggestions, ...newNames])];
      setComponentSuggestions(updated);
      localStorage.setItem(
        "repair_component_suggestions",
        JSON.stringify(updated),
      );
    }
  };

  // Cart State for Tickets
  const [cart, setCart] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);

  // Helpers
  const isTicketService = [
    "Train Ticket",
    "Bus Ticket",
    "Flight Ticket",
    "Fly Ticket",
  ].includes(selectedService);

  // Customer Selection & Checkout State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState("");
  const [selectedCustomerCredit, setSelectedCustomerCredit] = useState(0);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CALCULATIONS (LIVE) ---
  const isRepairService = selectedService === "Mobile Repair";
  const isXeroxPrintScan = ["Xerox", "Printout", "Scan"].includes(
    selectedService,
  );
  const isPhotoLami = ["Photograph", "Lamination"].includes(selectedService);

  const repairTotal = isRepairService
    ? (formData.repairItems || []).reduce(
        (sum, item) => sum + (parseFloat(item.price) || 0),
        0,
      )
    : 0;

  const localCalcTotal = isXeroxPrintScan
    ? (parseFloat(formData.pages) || 0) * (parseFloat(formData.rate) || 0)
    : isPhotoLami
      ? (formData.localItems || []).reduce(
          (sum, item) =>
            sum + (parseInt(item.qty) || 0) * (parseFloat(item.price) || 0),
          0,
        )
      : 0;

  const currentBase = parseFloat(formData.baseAmount) || 0;
  const currentCharge = parseFloat(formData.serviceCharge) || 0;
  const currentQty = parseInt(formData.qty) || 1;
  const currentItemTotal = (currentBase + currentCharge) * currentQty;

  const currentTax = serviceSettings.enableServiceTax
    ? (currentCharge * currentQty * (serviceSettings.serviceTaxRate || 18)) /
      100
    : 0;

  const cartTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTax = cart.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

  // --- INITIAL DATA LOADING ---
  // --- DATA LOADING & REFRESH ---
  const fetchAccounts = async () => {
    if (!accessToken) return;
    try {
      const accRes = await axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (accRes.data.success) {
        const activeAccounts = accRes.data.data.filter(
          (acc) => acc.currentStatus === "Open",
        );
        setAccounts(activeAccounts);

        // Only set default if nothing selected yet
        if (!selectedAccountId) {
          const cash = activeAccounts.find((a) => a.type === "Cash");
          if (cash) setSelectedAccountId(cash._id);
        }
      }
    } catch (error) {
      console.error("Error loading accounts", error);
    }
  };

  const fetchCustomers = async (isInitial = false) => {
    if (!accessToken) return;
    try {
      const custRes = await axios.get(API_ENDPOINTS.CUSTOMERS + "/my-branch", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (custRes.data.success) {
        setCustomers(custRes.data.data);

        // Handle Walk-in Selection on Load
        if (isInitial && !selectedCustomerId) {
          const walkIn = custRes.data.data.find((c) =>
            c.name.toLowerCase().includes("walk-in"),
          );
          if (walkIn) {
            handleSelectCustomer(walkIn);
          }
        } else if (selectedCustomerId) {
          // If we have a selected customer, update their credit info from the fresh list
          const updatedCustomer = custRes.data.data.find(
            (c) => c._id === selectedCustomerId,
          );
          if (updatedCustomer) {
            const totalCredit =
              updatedCustomer.credits?.reduce(
                (sum, c) => sum + c.totalAmount,
                0,
              ) || 0;
            setSelectedCustomerCredit(totalCredit);
          }
        }
      }
    } catch (error) {
      console.error("Error loading customers", error);
    }
  };

  const fetchComplaints = async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get(API_ENDPOINTS.COMPLAINTS.BASE, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        // Map backend _id to id for frontend compatibility if needed
        const mapped = res.data.data.map((c) => ({
          ...c,
          id: c._id, // Ensure ID compatibility
        }));
        setComplaints(mapped);
      }
    } catch (error) {
      console.error("Error loading complaints", error);
    }
  };

  const generateNextServiceId = () => {
    // Check complaints for max ID
    const pendingMax = complaints.reduce((max, c) => {
      const id = parseInt(c.formData?.serviceId) || 0;
      return id > max ? id : max;
    }, 0);

    // Check service settings for last ID (persistence across resets)
    const lastId = serviceSettings.lastServiceId || 0;

    const nextId = Math.max(pendingMax, lastId) + 1;
    setFormData((prev) => ({ ...prev, serviceId: nextId }));
  };

  // Auto-generate ID when switching to Mobile Repair
  useEffect(() => {
    if (selectedService === "Mobile Repair" && !formData.serviceId) {
      generateNextServiceId();
    }
  }, [selectedService, complaints]);

  const handleModuleChange = (moduleKey, shouldNavigate = true) => {
    if (moduleKey === selectedModule) return;

    setSelectedModule(moduleKey);
    setSelectedService(SERVICE_MODULES[moduleKey]?.services?.[0] || "");

    if (shouldNavigate) {
      navigate(`#${moduleKey}`, { replace: true });
    }

    // Reset form data
    setFormData((prev) => ({
      ...prev,
      consumerId: "",
      providerName: "",
      referenceId: "",
      planDetails: "",
      customerNameField: selectedCustomerName,
      travelDate: "",
      fromLoc: "",
      toLoc: "",
      transportName: "",
      passengerAge: "",
      description: "",
      baseAmount: "",
      serviceCharge: serviceSettings.defaultServiceCharge || "",
    }));
    setCart([]);
    setSelectedComplaintId(null);
  };

  useEffect(() => {
    if (accessToken) {
      fetchAccounts();
      fetchCustomers(true);
      fetchComplaints();
    }
  }, [accessToken]);

  // --- HASH ROUTING ---
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && SERVICE_MODULES[hash] && hash !== selectedModule) {
      handleModuleChange(hash, false); // Update state but don't navigate again
    }
  }, [location.hash]); // Only sync when hash changes

  // --- UPDATERS ---
  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer._id);
    setSelectedCustomerName(customer.name);
    setSelectedCustomerPhone(customer.phone);
    const totalCredit =
      customer.credits?.reduce((sum, c) => sum + c.totalAmount, 0) || 0;
    setSelectedCustomerCredit(totalCredit);

    // Sync with service-specific name field
    setFormData((prev) => {
      const newData = { ...prev, customerNameField: customer.name };

      // Intelligently sync phone to consumerId for recharge/mobile services
      const svcConfig = SERVICE_FIELDS_CONFIG[selectedService] || {};
      if (svcConfig.consumerId === "Mobile Number") {
        newData.consumerId = customer.phone;
      }

      return newData;
    });
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerName("");
    setSelectedCustomerPhone("");
    setFormData((prev) => ({ ...prev, customerNameField: "" }));
  };

  const handleCustomerAdded = (newCustomer) => {
    setCustomers((prev) => [...prev, newCustomer]);
    handleSelectCustomer(newCustomer);
    setShowCustomerModal(false);
  };

  const handleInputChange = (field, value) => {
    // --- STRICT VALIDATIONS ---
    let validatedValue = value;

    // Only apply regex validation to string or number inputs
    // Arrays/Objects (like items) skip this block
    if (typeof value === "string" || typeof value === "number") {
      let strVal = value.toString();

      // 1. Numeric Fields (Decimals allowed)
      if (["baseAmount", "serviceCharge", "rate"].includes(field)) {
        // Allow only numbers and one decimal point
        strVal = strVal.replace(/[^0-9.]/g, "");
        const dots = strVal.match(/\./g);
        if (dots && dots.length > 1) return; // Prevent multiple dots
        validatedValue = strVal;
      }

      // 2. Integer Fields
      if (["qty", "pages", "passengerAge", "serviceId"].includes(field)) {
        validatedValue = strVal.replace(/[^0-9]/g, "");
      }

      // 3. Name/String Fields (Strictly letters and spaces)
      if (
        [
          "customerNameField",
          "passengerGender",
          "fromLoc",
          "toLoc",
          "transportName",
        ].includes(field)
      ) {
        // Allow letters, spaces, and dots (for initials)
        validatedValue = strVal.replace(/[^a-zA-Z\s.]/g, "");
      }

      // 4. Alphanumeric/Ref Fields (Letters and Numbers only, no special chars)
      if (["consumerId", "referenceId"].includes(field)) {
        const svcConfig = SERVICE_FIELDS_CONFIG[selectedService] || {};
        if (svcConfig.consumerId === "Mobile Number") {
          validatedValue = strVal.replace(/[^0-9]/g, "");
        } else {
          validatedValue = strVal.replace(/[^a-zA-Z0-9]/g, "");
        }
      }
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: validatedValue };

      // Reverse Sync for Local Services: Base Amount -> Item Price
      const isXeroxPrintScan = ["Xerox", "Printout", "Scan"].includes(
        selectedService,
      );
      const isPhotoLami = ["Photograph", "Lamination"].includes(
        selectedService,
      );

      if (field === "baseAmount") {
        const numericBase = parseFloat(validatedValue) || 0;

        if (isXeroxPrintScan) {
          const pages = parseFloat(prev.pages) || 0;
          if (pages > 0) {
            newData.rate = (numericBase / pages).toFixed(2);
          }
        } else if (isPhotoLami) {
          const items = [...(prev.localItems || [])];
          if (items.length === 1) {
            const qty = parseInt(items[0].qty) || 0;
            if (qty > 0) {
              const updatedItems = [{ ...items[0] }];
              updatedItems[0].price = (numericBase / qty).toFixed(2);
              newData.localItems = updatedItems;
            }
          }
        }
      }

      return newData;
    });

    // Sync back to global customer name if the specific field is updated
    if (field === "customerNameField") {
      setSelectedCustomerName(validatedValue);
    }

    // Sync back mobile number to global phone if applicable
    const svcConfig = SERVICE_FIELDS_CONFIG[selectedService] || {};
    if (field === "consumerId" && svcConfig.consumerId === "Mobile Number") {
      setSelectedCustomerPhone(validatedValue);
    }
  };

  // Sync customer data when service changes
  useEffect(() => {
    if (selectedCustomerName) {
      setFormData((prev) => {
        const newData = { ...prev, customerNameField: selectedCustomerName };
        const svcConfig = SERVICE_FIELDS_CONFIG[selectedService] || {};
        if (svcConfig.consumerId === "Mobile Number" && !prev.consumerId) {
          newData.consumerId = selectedCustomerPhone;
        }
        return newData;
      });
    }
  }, [selectedService]);

  // --- DESCRIPTION GENERATOR ---
  const getFormattedDescription = () => {
    const service = selectedService;
    const {
      consumerId,
      providerName,
      referenceId,
      planDetails,
      customerNameField,
      travelDate,
      fromLoc,
      toLoc,
      transportName,
      passengerAge,
      passengerGender,
      description,
      planType,
    } = formData;

    let desc = `${service}`;

    if (isTicketService) {
      desc += ` | ${fromLoc} -> ${toLoc}`;
      if (travelDate) desc += ` | ${travelDate}`;
      if (customerNameField) desc += ` | ${customerNameField}`;
      if (passengerAge) desc += ` (${passengerAge}/${passengerGender})`;
      if (transportName) desc += ` | ${transportName}`;
      if (referenceId) desc += ` | PNR: ${referenceId}`;
      return desc;
    }

    switch (selectedModule) {
      case "UTILITY":
        if (consumerId) desc += ` | Cons: ${consumerId}`;
        if (providerName) desc += ` | ${providerName}`;
        if (planDetails) desc += ` | Period: ${planDetails}`;
        break;
      case "MOBILE_TV":
      case "WALLET":
        if (consumerId) desc += ` | No: ${consumerId}`;
        if (providerName) desc += ` | ${providerName}`;
        if (planDetails) desc += ` | Plan: ${planDetails}`;
        break;
      case "MOBILE_SERVICE":
        if (service === "Recharge") {
          if (consumerId) desc += ` | No: ${consumerId}`;
          if (planType) desc += ` | ${planType}`;
          const providerLabel =
            providerName === "Other"
              ? formData.customProvider || "Other"
              : providerName;
          if (providerLabel) desc += ` | ${providerLabel}`;
          if (planDetails) desc += ` | Plan: ${planDetails}`;
          if (formData.serviceId) desc += ` [ID: ${formData.serviceId}]`;
          if (customerNameField) desc += ` | Cust: ${customerNameField}`;
          if (providerName) desc += ` | Device: ${providerName}`;
          if (consumerId) desc += ` | IMEI: ${consumerId}`;

          const componentList = (formData.repairItems || [])
            .filter((item) => (item.name || item.customName) && item.price)
            .map((item) => {
              const nameLabel =
                item.name === "Other" ? item.customName || "Other" : item.name;
              return `${nameLabel} (₹${item.price})`;
            })
            .join(", ");

          if (componentList) desc += ` | Items: ${componentList}`;
        }
        break;
      case "FINANCIAL":
        if (providerName) desc += ` | ${providerName}`;
        if (consumerId) desc += ` | Id: ${consumerId}`;
        if (customerNameField) desc += ` | Name: ${customerNameField}`;
        break;
      case "GOVT":
      case "EDUCATION":
        if (customerNameField) desc += ` | Name: ${customerNameField}`;
        if (consumerId) desc += ` | ID: ${consumerId}`;
        if (providerName) desc += ` | Inst/Dept: ${providerName}`;
        break;
      case "SUBSCRIPTION":
        if (providerName) desc += ` | ${providerName}`;
        if (consumerId) desc += ` | User: ${consumerId}`;
        break;
      case "TRAVEL":
        if (consumerId) desc += ` | Vehicle/ID: ${consumerId}`;
        break;
      case "LOCAL":
        if (["Xerox", "Printout", "Scan"].includes(selectedService)) {
          const typeLabel =
            formData.type === "Other"
              ? formData.customType || "Other"
              : formData.type;
          if (typeLabel) desc += ` | Type: ${typeLabel}`;
          if (formData.pages) desc += ` | Pages: ${formData.pages}`;
          if (formData.rate) desc += ` | Rate: ₹${formData.rate}`;
        } else if (["Photograph", "Lamination"].includes(selectedService)) {
          const itemList = (formData.localItems || [])
            .filter((item) => (item.type || item.customType) && item.price)
            .map((item) => {
              const typeLabel =
                item.type === "Other" ? item.customType || "Other" : item.type;
              return `${typeLabel} x${item.qty} (₹${item.price})`;
            })
            .join(", ");
          if (itemList) desc += ` | Items: ${itemList}`;
        }
        if (description) desc += ` | ${description}`;
        break;
      default:
        if (description) desc += ` | ${description}`;
        break;
    }

    if (selectedModule !== "LOCAL" && description) {
      desc += ` | ${description}`;
    }

    return desc;
  };

  const handleAddToCart = () => {
    if (currentItemTotal <= 0) return toast.error("Enter valid amount");

    // Clean empty fields from details
    const cleanDetailsObj = {};
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (
        val !== "" &&
        val !== null &&
        val !== undefined &&
        !(Array.isArray(val) && val.length === 0)
      ) {
        cleanDetailsObj[key] = val;
      }
    });
    console.log(cleanDetailsObj);

    const itemData = {
      name: selectedService, // Just Xerox, Photograph, etc.
      baseAmount: currentBase,
      serviceCharge: currentCharge,
      price: currentBase + currentCharge,
      qty: currentQty,
      lineTotal: currentItemTotal + currentTax,
      taxAmount: currentTax,
      discount: 0,
      details: {
        ...cleanDetailsObj,
        module: selectedModule,
        service: selectedService,
        summary: getFormattedDescription(), // Keep detailed string in summary
      },
    };

    if (editingItemId) {
      // Update existing item
      const it = cart.map((item) =>
        item.id === editingItemId ? { ...itemData, id: item.id } : item,
      );
      console.log(it);
      (setCart(it), setEditingItemId(null));
      toast.success("Ticket updated");
    } else {
      // Add new item
      const newItem = {
        ...itemData,
        id: Date.now(),
      };
      setCart([...cart, newItem]);
      toast.success("Ticket added");
    }

    // Reset Passenger Details but keep Route (as per previous requirement)
    setFormData((prev) => ({
      ...prev,
      customerNameField: "",
      passengerAge: "",
      passengerGender: "Male",
      baseAmount: "",
      serviceCharge: serviceSettings.defaultServiceCharge || "",
    }));
  };

  const handleEditCartItem = (item) => {
    setEditingItemId(item.id);
    setFormData(item.details);
    // If the item belongs to a different module/service, switch to it
    if (item.details.module !== selectedModule) {
      setSelectedModule(item.details.module);
    }
    if (item.details.service !== selectedService) {
      setSelectedService(item.details.service);
    }
  };

  const handleRemoveFromCart = (index) => {
    const itemToRemove = cart[index];
    if (editingItemId === itemToRemove.id) {
      setEditingItemId(null);
      // Optional: Clear form if removing the item currently being edited
    }
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // --- REPAIR COMPLAINTS LOGIC ---
  const handleSaveComplaint = async () => {
    if (!selectedCustomerId) return toast.error("Select a customer");
    if (!formData.baseAmount && !formData.serviceCharge)
      return toast.error("Enter at least one amount");

    const newComplaint = {
      // id: Date.now(), // Backend generates ID
      customerId: selectedCustomerId,
      customerName: selectedCustomerName,
      customerPhone: selectedCustomerPhone,
      service: selectedService,
      module: selectedModule,
      formData: { ...formData },
      totalAmount: currentItemTotal + currentTax,
      taxAmount: currentTax,
      // timestamp: new Date().toISOString(), // Backend handles
      description: getFormattedDescription(),
    };

    try {
      const res = await axios.post(
        API_ENDPOINTS.COMPLAINTS.BASE,
        newComplaint,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (res.data.success) {
        toast.success("Complaint Saved to Database!");

        // Update persistent counter if this was a new repair
        if (formData.serviceId) {
          const updatedSettings = {
            ...serviceSettings,
            lastServiceId: Math.max(
              serviceSettings.lastServiceId || 0,
              parseInt(formData.serviceId),
            ),
          };
          setServiceSettings(updatedSettings);
          saveEncrypted("service_settings", updatedSettings);
        }

        fetchComplaints(); // Refresh list from server
        handleClearForm();

        // Save any new component names for future suggestions
        saveNewComponents(formData.repairItems || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save complaint");
    }
  };

  const handleSelectComplaint = (complaint) => {
    setSelectedComplaintId(complaint.id); // uses mapped id (_id)
    handleModuleChange(complaint.module, true); // Use centralized router helper
    setSelectedService(complaint.service);
    setFormData(complaint.formData);
    handleSelectCustomer({
      _id: complaint.customerId,
      name: complaint.customerName,
      phone: complaint.customerPhone,
    });
  };

  const handleCancelComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?"))
      return;

    try {
      const res = await axios.delete(API_ENDPOINTS.COMPLAINTS.BY_ID(id), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        toast.info("Complaint Removed");
        fetchComplaints();
        setSelectedComplaintId(null);
        handleClearForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove complaint");
    }
  };

  const handleClearForm = () => {
    setFormData({
      baseAmount: "",
      serviceCharge: serviceSettings.defaultServiceCharge || "",
      qty: 1,
      consumerId: "",
      providerName: "",
      referenceId: "",
      planDetails: "",
      customerNameField: selectedCustomerName,
      travelDate: "",
      fromLoc: "",
      toLoc: "",
      transportName: "",
      passengerAge: "",
      passengerGender: "Male",
      photoId: "",
      description: "",
      repairsNeeded: "",
      componentsChanged: "",
      localItems: [{ type: "", qty: 1, price: "" }],
      serviceId: "", // Reset so it regenerates correctly
    });
    setSelectedComplaintId(null);
    setEditingItemId(null);
  };

  // --- PROCESS TRANSACTION ---
  const handleCompleteSale = async (autoPrintOverride = false) => {
    // Validations
    if (!selectedCustomerId) return toast.error("Select a customer");
    if (!selectedAccountId) return toast.error("Select payment method");

    const selectedAccount = accounts.find((a) => a._id === selectedAccountId);
    if (
      (selectedAccount?.type === "Credits" ||
        selectedAccount?.type === "Credit") &&
      !selectedCustomerId
    ) {
      return toast.warning(
        "Please select/register a customer for Credit payments!",
      );
    }

    // Logic Split
    let itemsToProcess = [];
    let finalTotal = 0;
    let finalTax = 0;

    if (isTicketService) {
      if (cart.length === 0) return toast.error("Cart is empty");
      itemsToProcess = cart;
      finalTotal = cartTotal; // This now includes tax for all items
      finalTax = cartTax;
    } else {
      if (currentItemTotal <= 0) return toast.error("Enter valid amount");
      finalTotal = currentItemTotal + currentTax;
      finalTax = currentTax;

      // Clean empty fields from details
      const cleanDetailsObj = {};
      Object.keys(formData).forEach((key) => {
        const val = formData[key];
        if (
          val !== "" &&
          val !== null &&
          val !== undefined &&
          !(Array.isArray(val) && val.length === 0)
        ) {
          cleanDetailsObj[key] = val;
        }
      });

      itemsToProcess = [
        {
          name: selectedService, // Just the service name
          price: currentBase + currentCharge,
          qty: currentQty,
          lineTotal: finalTotal,
          taxAmount: finalTax,
          discount: 0,
          details: {
            ...cleanDetailsObj,
            module: selectedModule,
            service: selectedService,
            summary: getFormattedDescription(),
          },
        },
      ];
    }

    setIsProcessing(true);
    try {
      const saleData = {
        customer: selectedCustomerId,
        items: itemsToProcess,
        subtotal: finalTotal - finalTax,
        totalTax: finalTax,
        grandTotal: finalTotal,
        paymentMethod: selectedAccountId,
        isServiceBill: true,
        fieldService: selectedService,
      };

      const res = await axios.post(API_ENDPOINTS.SALES.SERVICES, saleData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        toast.success("Transaction Successful!");

        // If it was a saved complaint, remove it from DB
        if (selectedComplaintId) {
          try {
            await axios.delete(
              API_ENDPOINTS.COMPLAINTS.BY_ID(selectedComplaintId),
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            );
            fetchComplaints(); // Refresh list
          } catch (err) {
            console.error("Error removing processed complaint", err);
          }
          setSelectedComplaintId(null);
        }

        if (autoPrintOverride) {
          handlePrint(
            {
              ...saleData,
              billNo: res.data.sale.billNumber,
              formattedDate: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
              customerName: selectedCustomerName,
              customerPhone: selectedCustomerPhone,
              amount: saleData.grandTotal,
              staffName: "Staff",
              paymentMode:
                accounts.find((a) => a._id === selectedAccountId)?.type ||
                "Cash",
              products: itemsToProcess,
            },
            { silent: true, branchInfo },
          );
        }

        // Save any new component names for future suggestions
        if (isRepairService) {
          saveNewComponents(formData.repairItems || []);
        }

        handleClearForm();
        refreshSales();
        fetchAccounts(); // Update Account Balances
        fetchCustomers(); // Update Customer Credit Limits
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Transaction failed");
    } finally {
      setIsProcessing(true); // Should be false? The existing code had it as true in finally? No, should be false.
      setIsProcessing(false);
    }
  };

  const [showShortcutGuide, setShowShortcutGuide] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F-Keys
      if (e.key === "F1") {
        e.preventDefault();
        setShowCustomerModal(true);
      } else if (e.key === "F4") {
        e.preventDefault();
        handleClearForm();
        handleClearCustomer();
      } else if (e.key === "F9") {
        e.preventDefault();
        handleCompleteSale(false);
      } else if (e.key === "F10") {
        e.preventDefault();
        handleCompleteSale(true);
      } else if (e.key === "F12") {
        e.preventDefault();
        setShowShortcutGuide((prev) => !prev);
      }

      // Combo Keys
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleCompleteSale(false);
      }
      if (e.key === "Escape") {
        setShowCustomerModal(false);
        setShowShortcutGuide(false);
        setShowSettingsModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    formData,
    cart,
    selectedCustomerId,
    selectedAccountId,
    isTicketService,
    complaints, // Dependencies for correct state access in closures
    handleCompleteSale,
    handleClearForm,
    handleClearCustomer,
  ]);

  return (
    <div className="d-flex flex-column h-100 bg-light overflow-hidden">
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
        accessToken={accessToken}
      />

      <ShortcutGuide
        isOpen={showShortcutGuide}
        onClose={() => setShowShortcutGuide(false)}
      />

      <ServiceSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={(newSettings) => setServiceSettings(newSettings)}
      />

      {/* Main Content Area */}
      <div className="flex-grow-1 p-2 overflow-hidden d-flex flex-column">
        {/* Customer Section */}
        <ServiceCustomerSelect
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerName={selectedCustomerName}
          selectedCustomerPhone={selectedCustomerPhone}
          selectedCustomerCredit={selectedCustomerCredit}
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={handleClearCustomer}
          onAddNewCustomer={() => setShowCustomerModal(true)}
        />

        {/* 2-Column Layout */}
        <div className="row g-2 flex-grow-1 overflow-hidden">
          {/* Left Column: Form Only */}
          <div className="col-8 h-100 d-flex flex-column">
            <div className="card shadow-sm border-0 flex-grow-1 d-flex flex-column overflow-hidden">
              <div className="d-flex align-items-center bg-white border-bottom pe-3">
                <div className="flex-grow-1">
                  <ServiceCategoryTabs
                    selectedModule={selectedModule}
                    onModuleChange={handleModuleChange}
                  />
                </div>
                <button
                  className="btn btn-light bg-light border text-muted px-3 fw-bold rounded-pill d-flex"
                  onClick={() => setShowSettingsModal(true)}
                  style={{ height: "35px", fontSize: "0.8rem" }}
                  title="Service Settings"
                >
                  <i className="bi bi-gear-fill me-2"></i>Settings
                </button>
              </div>

              <ServiceTypeSelector
                selectedModule={selectedModule}
                selectedService={selectedService}
                onServiceChange={setSelectedService}
                serviceCounts={{
                  "Pending Repair": complaints.filter((c) => {
                    if (!selectedCustomerId) return false;
                    return (
                      c.customerId === selectedCustomerId ||
                      (c.customerPhone &&
                        c.customerPhone === selectedCustomerPhone)
                    );
                  }).length,
                  "Pending Repair List": complaints.length,
                }}
              />

              <div className="flex-grow-1 d-flex flex-column overflow-auto">
                <ServiceInputForm
                  selectedModule={selectedModule}
                  selectedService={selectedService}
                  formData={{ ...formData, baseAmount: currentBase }}
                  handleInputChange={handleInputChange}
                  currency={appSettings?.currency}
                  serviceSettings={serviceSettings}
                  componentSuggestions={componentSuggestions}
                  complaints={complaints.filter((c) => {
                    if (!selectedCustomerId) return false;
                    return (
                      c.customerId === selectedCustomerId ||
                      (c.customerPhone &&
                        c.customerPhone === selectedCustomerPhone)
                    );
                  })}
                  allComplaints={complaints}
                  onSelectComplaint={handleSelectComplaint}
                  onCancelComplaint={handleCancelComplaint}
                  selectedComplaintId={selectedComplaintId}
                />

                {/* Add to Cart / Save Complaint Buttons */}
                {isTicketService && (
                  <div className="px-3 pb-3 mt-n2">
                    <button
                      onClick={handleAddToCart}
                      className={`btn w-100 fw-bold border-2 ${
                        editingItemId
                          ? "btn-warning"
                          : "btn-outline-primary dashed-border"
                      }`}
                    >
                      <i
                        className={`bi ${
                          editingItemId ? "bi-check-lg" : "bi-plus-lg"
                        } me-2`}
                      ></i>
                      {editingItemId
                        ? "UPDATE TICKET IN LIST"
                        : "ADD TICKET TO LIST"}
                    </button>
                  </div>
                )}

                {selectedService === "Mobile Repair" &&
                  !selectedComplaintId && (
                    <div className="px-3 pb-3 mt-n2">
                      <button
                        onClick={handleSaveComplaint}
                        className="btn btn-outline-info w-100 fw-bold dashed-border border-2"
                      >
                        <i className="bi bi-journal-plus me-2"></i>SAVE
                        COMPLAINT (PAY LATER)
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* Unpaid Complaints Section */}
          </div>

          {/* Right Column: Transaction Summary OR Cart */}
          <div className="col-4 h-100 d-flex flex-column">
            {isTicketService ? (
              <ServiceCart
                cart={cart}
                removeFromCart={handleRemoveFromCart}
                onEditItem={handleEditCartItem}
                editingItemId={editingItemId}
                grandTotal={cartTotal}
                cartTax={cartTax}
                serviceSettings={serviceSettings}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                setSelectedAccountId={setSelectedAccountId}
                isProcessing={isProcessing}
                handleCompleteSale={handleCompleteSale}
                currency={appSettings?.currency}
              />
            ) : (
              <ServicePaymentSummary
                selectedService={selectedService}
                currentBase={currentBase}
                currentCharge={currentCharge}
                currentTax={currentTax}
                currentItemTotal={currentItemTotal}
                serviceSettings={serviceSettings}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                setSelectedAccountId={setSelectedAccountId}
                isProcessing={isProcessing}
                handleCompleteSale={handleCompleteSale}
                currentQty={currentQty}
                currency={appSettings?.currency}
                detailsDescription={getFormattedDescription()
                  .replace(selectedService + " | ", "")
                  .replace(selectedService, "N/A")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBilling;
