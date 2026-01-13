import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import { useBilling } from "../../Context/BillingContext";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { getDecrypted } from "../../utils/storage";
import { handlePrint } from "../../utils/printUtils";
import "../../Styles/dashboard.css";

// Import Modular Components
import { SERVICE_MODULES } from "../../utils/serviceBillingConstants";
import ServiceCustomerSelect from "../../Components/ServiceBilling/ServiceCustomerSelect";
import ServiceCategoryTabs from "../../Components/ServiceBilling/ServiceCategoryTabs";
import ServiceTypeSelector from "../../Components/ServiceBilling/ServiceTypeSelector";
import ServiceInputForm from "../../Components/ServiceBilling/ServiceInputForm";
import ServicePaymentSummary from "../../Components/ServiceBilling/ServicePaymentSummary";
import ServiceCart from "../../Components/ServiceBilling/ServiceCart";
import ServiceSettingsModal from "../../Components/ServiceBilling/ServiceSettingsModal";

const ServiceBilling = () => {
  const { accessToken } = useAuth();
  const { refreshSales } = useBilling();
  const [appSettings] = useState(() => getDecrypted("app_settings"));
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // --- COMPONENT STATE ---
  const [serviceSettings, setServiceSettings] = useState(
    () => getDecrypted("service_settings") || {}
  );
  const [selectedModule, setSelectedModule] = useState("UTILITY");
  const [selectedService, setSelectedService] = useState(
    SERVICE_MODULES.UTILITY.services[0]
  );

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

    // Person Details
    customerNameField: "",

    // Ticket Specifics
    travelDate: "",
    fromLoc: "",
    toLoc: "",
    transportName: "",
    passengerAge: "",
    passengerGender: "Male",

    // Generic
    description: "",
  });

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
  const currentBase = parseFloat(formData.baseAmount) || 0;
  const currentCharge = parseFloat(formData.serviceCharge) || 0;
  const currentQty = parseInt(formData.qty) || 1;
  const currentItemTotal = (currentBase + currentCharge) * currentQty;

  const currentTax = serviceSettings.enableServiceTax
    ? (currentItemTotal * (serviceSettings.serviceTaxRate || 18)) / 100
    : 0;

  const cartTotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTax = cart.reduce((sum, item) => sum + (item.taxAmount || 0), 0);

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        const [accRes, custRes] = await Promise.all([
          axios.get(API_ENDPOINTS.BRANCH_ACCOUNTS, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(API_ENDPOINTS.CUSTOMERS + "/my-branch", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        if (accRes.data.success) {
          const activeAccounts = accRes.data.data.filter(
            (acc) =>
              acc.currentStatus === "Open" &&
              !["Credit", "Credits", "Credit Card"].includes(acc.type)
          );
          setAccounts(activeAccounts);
          const cash = activeAccounts.find((a) => a.type === "Cash");
          if (cash) setSelectedAccountId(cash._id);
        }

        if (custRes.data.success) {
          setCustomers(custRes.data.data);
          const walkIn = custRes.data.data.find((c) =>
            c.name.toLowerCase().includes("walk-in")
          );
          if (walkIn) {
            handleSelectCustomer(walkIn);
          }
        }
      } catch (error) {
        console.error("Error loading billing data", error);
      }
    };
    fetchData();
  }, [accessToken]);

  // --- UPDATERS ---
  const handleSelectCustomer = (customer) => {
    setSelectedCustomerId(customer._id);
    setSelectedCustomerName(customer.name);
    setSelectedCustomerPhone(customer.phone);
    const totalCredit =
      customer.credits?.reduce((sum, c) => sum + c.totalAmount, 0) || 0;
    setSelectedCustomerCredit(totalCredit);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerName("");
    setSelectedCustomerPhone("");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleModuleChange = (moduleKey) => {
    setSelectedModule(moduleKey);
    setSelectedService(SERVICE_MODULES[moduleKey].services[0]);
    // Reset specific fields
    setFormData((prev) => ({
      ...prev,
      consumerId: "",
      providerName: "",
      referenceId: "",
      planDetails: "",
      customerNameField: "",
      travelDate: "",
      fromLoc: "",
      toLoc: "",
      transportName: "",
      passengerAge: "",
      description: "",
      baseAmount: "",
      serviceCharge: serviceSettings.defaultServiceCharge || "",
    }));
    // Clear cart on module switch? Maybe safer to clear to avoid mixing types messily
    setCart([]);
  };

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

    const itemData = {
      name: getFormattedDescription(),
      baseAmount: currentBase,
      serviceCharge: currentCharge,
      price: currentBase + currentCharge,
      qty: currentQty,
      lineTotal: currentItemTotal + currentTax, // Total includes tax
      taxAmount: currentTax,
      discount: 0,
      details: {
        ...formData,
        module: selectedModule,
        service: selectedService,
      },
    };

    if (editingItemId) {
      // Update existing item
      setCart(
        cart.map((item) =>
          item.id === editingItemId ? { ...itemData, id: item.id } : item
        )
      );
      setEditingItemId(null);
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

  // --- PROCESS TRANSACTION ---
  const handleCompleteSale = async () => {
    // Validations
    if (!selectedCustomerId) return toast.error("Select a customer");
    if (!selectedAccountId) return toast.error("Select payment method");

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
      itemsToProcess = [
        {
          name: getFormattedDescription(),
          price: currentBase + currentCharge,
          qty: currentQty,
          lineTotal: finalTotal,
          taxAmount: finalTax,
          discount: 0,
          details: {
            ...formData,
            module: selectedModule,
            service: selectedService,
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
      };

      const res = await axios.post(API_ENDPOINTS.SALES.BASE, saleData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.data.success) {
        toast.success("Transaction Successful!");

        if (serviceSettings.autoPrintServiceReceipt) {
          handlePrint(
            {
              ...saleData,
              billNo: res.data.sale.billNumber,
              formattedDate: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
              customerName: selectedCustomerName,
              customerPhone: selectedCustomerPhone,
              amount: saleData.grandTotal,
              // Mock staff/payment mode for print
              staffName: "Staff",
              paymentMode:
                accounts.find((a) => a._id === selectedAccountId)?.type ||
                "Cash",
              products: itemsToProcess,
            },
            { silent: true }
          );
        }

        // Reset Logic
        setFormData((prev) => ({
          ...prev,
          baseAmount: "",
          serviceCharge: serviceSettings.defaultServiceCharge || "",
          description: "",
          consumerId: "",
          referenceId: "",
          customerNameField: "",
          planDetails: "",
          fromLoc: "",
          toLoc: "",
          transportName: "",
          passengerAge: "",
          passengerGender: "Male",
        }));
        setCart([]);
        refreshSales();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-light overflow-hidden">
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
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={handleClearCustomer}
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
              />

              <div className="flex-grow-1 d-flex flex-column overflow-auto">
                <ServiceInputForm
                  selectedModule={selectedModule}
                  selectedService={selectedService}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  currency={appSettings?.currency}
                  serviceSettings={serviceSettings}
                />

                {/* Add to Cart Button for Tickets */}
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
              </div>
            </div>
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
                currentItemTotal={currentItemTotal}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                setSelectedAccountId={setSelectedAccountId}
                isProcessing={isProcessing}
                handleCompleteSale={handleCompleteSale}
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
