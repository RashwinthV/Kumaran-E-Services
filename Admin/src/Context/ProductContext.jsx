import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import {
  setCache,
  getCache,
  removeCache,
  CACHE_KEYS,
  TTL,
} from "../utils/cacheUtils";

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
  const [productsLoading, setProductsLoading] = useState(true);

  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;
  const { accessToken } = useAuth();

  // Fetch all products
  const getProducts = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken) return;

      try {
        setProductsLoading(true);

        // Check cache first
        if (!forceRefresh) {
          const cachedProducts = await getCache(CACHE_KEYS.PRODUCTS);
          if (cachedProducts) {
            setProducts(cachedProducts);
            setProductsLoading(false);
            return;
          }
        }

        const response = await axios.get(`${baseURL}/products`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data.success) {
          setProducts(response.data.data);
          // Cache the result
          await setCache(CACHE_KEYS.PRODUCTS, response.data.data, TTL.SHORT); // Products might change more often, short TTL
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch products",
        );
      } finally {
        setProductsLoading(false);
      }
    },
    [accessToken, baseURL],
  );

  // Fetch all categories
  const getCategories = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken) return;

      try {
        // Check cache
        if (!forceRefresh) {
          const cachedCategories = await getCache(CACHE_KEYS.CATEGORIES);
          if (cachedCategories) {
            setCategories(cachedCategories);
            return;
          }
        }

        const response = await axios.get(`${baseURL}/categories`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data.success) {
          setCategories(response.data.data);
          await setCache(CACHE_KEYS.CATEGORIES, response.data.data, TTL.LONG); // Categories rarely change
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
            return;
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

  // Fetch subcategories by category ID
  // This is tricky to cache because it depends on ID.
  // We'll skip caching this specific query for simplicity, or we rely on the main list if we had it.
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

  // Add product
  const addProduct = async (productData) => {
    try {
      const response = await axios.post(`${baseURL}/products`, productData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        toast.success("Product added successfully");
        removeCache(CACHE_KEYS.PRODUCTS); // Invalidate cache
        getProducts(true); // Force refresh
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
      throw error;
    }
  };

  // Update product
  const updateProduct = async (id, productData) => {
    try {
      const response = await axios.put(
        `${baseURL}/products/${id}`,
        productData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data.success) {
        toast.success("Product updated successfully");
        removeCache(CACHE_KEYS.PRODUCTS); // Invalidate cache
        getProducts(true);
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
      throw error;
    }
  };

  // Delete product
  const deleteProduct = async (id) => {
    try {
      const response = await axios.delete(`${baseURL}/products/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        toast.success("Product deleted successfully");
        removeCache(CACHE_KEYS.PRODUCTS); // Invalidate cache
        getProducts(true);
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
      throw error;
    }
  };

  // Add category
  const addCategory = async (name) => {
    try {
      const response = await axios.post(
        `${baseURL}/categories`,
        { name },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data.success) {
        toast.success("Category added successfully");
        removeCache(CACHE_KEYS.CATEGORIES);
        getCategories(true);
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
      throw error;
    }
  };

  // Update category
  const updateCategory = async (id, name) => {
    try {
      const response = await axios.put(
        `${baseURL}/categories/${id}`,
        { name },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data.success) {
        toast.success("Category updated successfully");
        removeCache(CACHE_KEYS.CATEGORIES);
        getCategories(true);
        // Also refresh products in case category name is denormalized
        removeCache(CACHE_KEYS.PRODUCTS);
        getProducts(true);
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update category");
      throw error;
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    try {
      const response = await axios.delete(`${baseURL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        toast.success("Category deleted successfully");
        removeCache(CACHE_KEYS.CATEGORIES);
        getCategories(true);
        // Refresh products
        removeCache(CACHE_KEYS.PRODUCTS);
        getProducts(true);
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete category");
      throw error;
    }
  };

  // Add subcategory
  const addSubCategory = async (name, categoryId) => {
    try {
      const response = await axios.post(
        `${baseURL}/subcategories`,
        { name, category: categoryId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        toast.success("Subcategory added successfully");
        removeCache(CACHE_KEYS.SUBCATEGORIES);
        getSubCategories(true);
        return response.data;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add subcategory");
      throw error;
    }
  };

  // Update subcategory
  const updateSubCategory = async (id, name, categoryId) => {
    try {
      const response = await axios.put(
        `${baseURL}/subcategories/${id}`,
        { name, category: categoryId },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        toast.success("Subcategory updated successfully");
        removeCache(CACHE_KEYS.SUBCATEGORIES);
        getSubCategories(true);
        return response.data;
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update subcategory",
      );
      throw error;
    }
  };

  // Delete subcategory
  const deleteSubCategory = async (id) => {
    try {
      const response = await axios.delete(`${baseURL}/subcategories/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        toast.success("Subcategory deleted successfully");
        removeCache(CACHE_KEYS.SUBCATEGORIES);
        getSubCategories(true);
        return response.data;
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete subcategory",
      );
      throw error;
    }
  };

  // Fetch product inventory across all branches
  const getProductInventory = useCallback(
    async (productId) => {
      if (!accessToken) return [];
      try {
        const response = await axios.get(
          `${baseURL}/inventory/product/${productId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.data.success) {
          return response.data.data;
        }
        return [];
      } catch (error) {
        console.error("Error fetching product inventory:", error);
        return [];
      }
    },
    [accessToken, baseURL],
  );

  // Fetch single product by ID
  const getProductById = useCallback(
    async (productId) => {
      if (!accessToken) return null;
      try {
        const response = await axios.get(`${baseURL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.data.success) {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error("Error fetching product:", error);
        return null;
      }
    },
    [accessToken, baseURL],
  );

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        subCategories,
        productsLoading,
        getProducts,
        getCategories,
        getSubCategories,
        getSubCategoriesByCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubCategory,
        updateSubCategory,
        deleteSubCategory,
        getProductInventory,
        getProductById,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
