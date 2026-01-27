import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { useAuth } from "./AuthContext";
import { getCache, setCache, CACHE_KEYS, TTL } from "../utils/cacheUtils";

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  const { accessToken } = useAuth();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(
    async (force = false) => {
      if (!accessToken) return;

      try {
        setLoading(true);

        if (!force) {
          const cached = await getCache(CACHE_KEYS.PRODUCTS_FLAT);
          if (cached) {
            setProducts(cached);
          }
        }

        const res = await axios.get(API_ENDPOINTS.BRANCH_INVENTORY, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          const mappedProducts = res.data.data
            .filter((item) => item.product)
            .map((item) => ({
              _id: item.product._id,
              name: item.product.name,
              sku: item.product.sku,
              price: item.FinalPrice,
              mrp: item.product.mrp,
              costPrice: item.costPrice,
              sellingPrice: item.sellingPrice,
              gstType: item.product.gstType || "NotIncluded",
              gst: item.product.gst
                ? (item.product.gst.cgst || 0) + (item.product.gst.sgst || 0)
                : 0,
              availableQty: item.quantity,
              category: item.product.category?.name,
              lowStockThreshold: item.lowStockThreshold || 5,
              unit: item.product.unit || "pcs",
              compatibleModels: item.product.compatibleModels || [],
              brand: item.product.brand || "",
              model: item.product.model || "",
              tags: item.product.tags || [],
            }));
          setProducts(mappedProducts);
          await setCache(CACHE_KEYS.PRODUCTS_FLAT, mappedProducts, TTL.SHORT);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const fetchCustomers = useCallback(
    async (force = false) => {
      if (!accessToken) return;

      try {
        setLoading(true);

        if (!force) {
          const cached = await getCache(CACHE_KEYS.CUSTOMERS);
          if (cached) {
            setCustomers(cached);
          }
        }

        const res = await axios.get(API_ENDPOINTS.CUSTOMERS + "/my-branch", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          setCustomers(res.data.data);
          await setCache(CACHE_KEYS.CUSTOMERS, res.data.data, TTL.SHORT);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const fetchSales = useCallback(
    async (force = false) => {
      if (!accessToken) return;

      try {
        setLoading(true);

        if (!force) {
          const cachedSales = await getCache(CACHE_KEYS.SALES);
          const cachedRefunds = await getCache("KES_REFUNDS_CACHE");
          if (cachedSales) setSales(cachedSales);
          if (cachedRefunds) setRefunds(cachedRefunds);
        }

        const res = await axios.get(API_ENDPOINTS.SALES.BASE, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.data.success) {
          setSales(res.data.data);
          setRefunds(res.data.refunds || []);
          await setCache(CACHE_KEYS.SALES, res.data.data, TTL.SHORT);
          await setCache(
            "KES_REFUNDS_CACHE",
            res.data.refunds || [],
            TTL.SHORT,
          );
        }
      } catch (error) {
        console.error("Error fetching sales:", error);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const fetchBranchInfo = useCallback(
    async (force = false) => {
      if (!accessToken) return;

      try {
        if (!force) {
          const cached = await getCache(CACHE_KEYS.BRANCH_INFO);
          if (cached) {
            setBranchInfo(cached);
            return;
          }
        }

        const res = await axios.get(API_ENDPOINTS.MY_BRANCH_PRINT_INFO, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.data.success) {
          setBranchInfo(res.data.data);
          await setCache(CACHE_KEYS.BRANCH_INFO, res.data.data, TTL.LONG);
        }
      } catch (error) {
        console.error("Error fetching branch info:", error);
      }
    },
    [accessToken],
  );

  // Periodic refresh
  useEffect(() => {
    if (accessToken) {
      fetchProducts();
      fetchCustomers();
      fetchSales();
      fetchBranchInfo();
    }
  }, [accessToken, fetchProducts, fetchCustomers, fetchSales, fetchBranchInfo]);

  const value = {
    products,
    customers,
    sales,
    refunds,
    branchInfo,
    loading,
    refreshProducts: () => fetchProducts(true),
    refreshCustomers: () => fetchCustomers(true),
    refreshSales: () => fetchSales(true),
    refreshBranchInfo: () => fetchBranchInfo(true),
    refundSale: async (refundData) => {
      if (!accessToken) return { success: false, message: "No access token" };
      try {
        const res = await axios.post(API_ENDPOINTS.SALES.REFUND, refundData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          await fetchSales(true);
          await fetchProducts(true);
          return { success: true, message: res.data.message };
        }
        return { success: false, message: res.data.message };
      } catch (error) {
        console.error("Refund error:", error);
        return {
          success: false,
          message: error.response?.data?.message || "Error processing refund",
        };
      }
    },
  };

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
};
