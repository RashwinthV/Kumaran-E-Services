import React, { useState, useMemo, useEffect } from "react";
import { useCustomer } from "../../Context/CustomerContext";
import CustomerStats from "../../Components/Customer/CustomerStats";
import CustomerFilters from "../../Components/Customer/CustomerFilters";
import CustomerTable from "../../Components/Customer/CustomerTable";
import CustomerDetailModal from "../../Components/Customer/CustomerDetailModal";
import SettleCreditModal from "../../Components/Customer/SettleCreditModal";
import { useBilling } from "../../Context/BillingContext";

const Customer = () => {
  const { customers, loading, error, fetchCustomers, settleCustomerCredit } =
    useCustomer();
  const { refreshSales } = useBilling();

  const [filters, setFilters] = useState({
    search: "",
    sortBy: "CreditHighest",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleReset = () => {
    setFilters({
      search: "",
      sortBy: "CreditHighest",
    });
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleSettleCredit = (customer) => {
    setSelectedCustomer(customer);
    setIsSettleModalOpen(true);
  };

  const handleSettlement = async (settlementData) => {
    if (!selectedCustomer) return;

    const result = await settleCustomerCredit(
      selectedCustomer._id,
      settlementData
    );

    if (result.success) {
      // Refresh sales history as settling credits updates individual sale paidAmounts
      await refreshSales();
      // Close modal on success
      setIsSettleModalOpen(false);
      setSelectedCustomer(null);
    } else {
      // Error is handled by the context/component
      throw new Error(result.message);
    }
  };

  // Filter to show ONLY customers with credits
  const customersWithCredits = useMemo(() => {
    return customers.filter(
      (customer) => customer.credits && customer.credits.length > 0
    );
  }, [customers]);

  // Apply search and sort filters
  const filteredData = useMemo(() => {
    let result = [...customersWithCredits];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.phone.includes(filters.search) ||
          (customer.city && customer.city.toLowerCase().includes(searchLower))
      );
    }

    // Sorting
    result.sort((a, b) => {
      const getTotalCredit = (customer) =>
        customer.credits?.reduce((sum, c) => sum + c.totalAmount, 0) || 0;
      const getLatestCreditDate = (customer) => {
        if (!customer.credits || customer.credits.length === 0) return null;
        const dates = customer.credits.map((c) => new Date(c.date));
        return new Date(Math.max(...dates));
      };

      switch (filters.sortBy) {
        case "NameAsc":
          return a.name.localeCompare(b.name);
        case "NameDesc":
          return b.name.localeCompare(a.name);
        case "CreditHighest":
          return getTotalCredit(b) - getTotalCredit(a);
        case "CreditLowest":
          return getTotalCredit(a) - getTotalCredit(b);
        case "RecentCredit": {
          const dateA = getLatestCreditDate(a);
          const dateB = getLatestCreditDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB - dateA;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [customersWithCredits, filters]);

  if (loading && customers.length === 0) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "calc(100vh - 65px)" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "calc(100vh - 65px)" }}
      >
        <div className="text-center">
          <i className="bi bi-exclamation-triangle display-1 text-danger mb-3"></i>
          <h4 className="text-dark mb-2">Error Loading Customers</h4>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <CustomerStats data={filteredData} />

      <CustomerFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      <CustomerTable
        data={filteredData}
        onViewCustomer={handleViewCustomer}
        onSettleCredit={handleSettleCredit}
      />

      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customer={selectedCustomer}
      />

      <SettleCreditModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        customer={selectedCustomer}
        onSettle={handleSettlement}
      />
    </div>
  );
};

export default Customer;
