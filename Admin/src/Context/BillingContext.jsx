import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useProduct } from "./ProductContext";

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  // Re-use Product Context logic for products
  const { products, getProducts, productsLoading } = useProduct();

  const [sales, setSales] = useState([]);

  // Logic for refreshing sales could go here if managed globally
  // For now we satisfy the interface used by Customer.jsx
  const refreshSales = useCallback(async () => {
    // Implementation depend on where sales live
    // console.log("Refreshing sales...");
  }, []);

  const refreshProducts = useCallback(() => {
    getProducts();
  }, [getProducts]);

  return (
    <BillingContext.Provider
      value={{
        products,
        loading: productsLoading,
        refreshProducts,
        refreshSales,
        sales,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};
