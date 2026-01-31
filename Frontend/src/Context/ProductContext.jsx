import {
  createContext,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { getDecrypted } from "../utils/storage";
import { getCache, setCache, CACHE_KEYS, TTL } from "../utils/cacheUtils";

const ProductContext = createContext();

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context)
    throw new Error("useProduct must be used inside ProductProvider");
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/api/staff`;
  const { accessToken } = useAuth();
  const branch = getDecrypted("branch");
  const BranchId = branch ? branch._id : null;

  // Fetch all products
  const getProducts = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken || !BranchId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // UI Speed-up: serve from cache if available
        if (!forceRefresh) {
          const cached = await getCache(CACHE_KEYS.INVENTORY_RAW);
          if (cached) {
            setProducts(cached);
          }
        }

        const response = await axios.get(`${baseURL}/products/${BranchId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });


        if (response.data.success) {
          setProducts(response.data.data);
          await setCache(
            CACHE_KEYS.INVENTORY_RAW,
            response.data.data,
            TTL.SHORT,
          );
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch products",
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, baseURL, BranchId],
  );

  // Fetch all categories
  const getCategories = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken) return;

      try {
        if (!forceRefresh) {
          const cached = await getCache(CACHE_KEYS.CATEGORIES);
          if (cached) {
            setCategories(cached);
          }
        }

        const response = await axios.get(`${baseURL}/categories`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data.success) {
          setCategories(response.data.data);
          await setCache(CACHE_KEYS.CATEGORIES, response.data.data, TTL.LONG);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    },
    [accessToken, baseURL],
  );

  // Fetch all subcategories
  const getSubCategories = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken) return;
      try {
        if (!forceRefresh) {
          const cached = await getCache(CACHE_KEYS.SUBCATEGORIES);
          if (cached) {
            setSubCategories(cached);
          }
        }

        const response = await axios.get(`${baseURL}/subcategories`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.data.success) {
          setSubCategories(response.data.data);
          await setCache(
            CACHE_KEYS.SUBCATEGORIES,
            response.data.data,
            TTL.LONG,
          );
        }
      } catch (error) {
        console.error("Error fetching subcategories", error);
      }
    },
    [accessToken, baseURL],
  );

  const getSubCategoriesByCategory = async (categoryId) => {
    if (!accessToken) return [];

    try {
      const response = await axios.get(
        `${baseURL}/subcategories/category/${categoryId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching subcategories by category:", error);
      return [];
    }
  };
console.log(products);


  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        subCategories,
        loading,
        getProducts,
        getCategories,
        getSubCategories,
        getSubCategoriesByCategory,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
