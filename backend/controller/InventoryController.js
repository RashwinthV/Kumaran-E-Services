const Inventory = require("../models/Inventory");
const Product = require("../models/Product");

// @desc    Add inventory to branch
// @route   POST /api/admin/inventory
// @access  Private/Admin
const addInventory = async (req, res) => {
  try {
    const {
      branch,
      product,
      quantity,
      costPrice,
      sellingPrice,
      FinalPrice,
      lowStockThreshold,
      imei,
    } = req.body;

    // Fetch the product to get MRP
    const productData = await Product.findById(product);
    if (!productData) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Validate prices against MRP
    if (costPrice > productData.mrp) {
      return res.status(400).json({
        success: false,
        message: `Cost Price (₹${costPrice}) cannot exceed MRP (₹${productData.mrp})`,
      });
    }

    if (FinalPrice > productData.mrp) {
      return res.status(400).json({
        success: false,
        message: `Selling Price (₹${sellingPrice}) cannot exceed MRP (₹${productData.mrp})`,
      });
    }

    if (FinalPrice > productData.mrp) {
      return res.status(400).json({
        success: false,
        message: `Final Price (₹${FinalPrice}) cannot exceed MRP (₹${productData.mrp})`,
      });
    }

    // Check if inventory already exists for this product in this branch
    let inventory = await Inventory.findOne({ branch, product });

    if (inventory) {
      // Update existing inventory
      inventory.quantity += Number(quantity);
      // Update prices if needed, or keep latest? Usually latest entry might update prices.
      // Let's assume we update prices to the new values provided
      inventory.costPrice = costPrice;
      inventory.sellingPrice = sellingPrice;
      inventory.FinalPrice = FinalPrice;
      inventory.lowStockThreshold = lowStockThreshold;

      if (imei && Array.isArray(imei)) {
        inventory.imei = [...(inventory.imei || []), ...imei];
      }

      // Auto-reactivate if stock is added
      if (inventory.quantity > 0) {
        inventory.isActive = true;
      }

      await inventory.save();
      await inventory.populate({
        path: "product",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      });
      return res.status(200).json({ success: true, data: inventory });
    }

    // Create new inventory
    inventory = await Inventory.create({
      branch,
      product,
      quantity,
      costPrice,
      sellingPrice,
      FinalPrice,
      lowStockThreshold,
      imei: imei || [],
      isActive: quantity > 0,
    });

    await inventory.populate({
      path: "product",
      populate: [
        { path: "category", select: "name" },
        { path: "subCategory", select: "name" },
      ],
    });
    res.status(201).json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory by branch
// @route   GET /api/admin/inventory/:branchId
// @access  Private/Admin, Manager
const getInventoryByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const inventory = await Inventory.find({ branch: branchId })
      .populate({
        path: "product",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      })
      .populate("branch", "name code")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryByBranchStaff = async (req, res) => {
  try {
    let { branchId } = req.params;

    // If no branchId in params, try to get it from the authenticated user's branchCode
    if (!branchId && req.user && req.user.branchCode) {
      const Branch = require("../models/Branch");
      const branch = await Branch.findOne({ code: req.user.branchCode });
      if (branch) {
        branchId = branch._id;
      }
    }

    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch ID is required" });
    }

    const inventory = await Inventory.find({ branch: branchId, isActive: true })
      .populate({
        path: "product",
        populate: [
          { path: "category", select: "name" },
          { path: "subCategory", select: "name" },
        ],
      })
      .populate("branch", "name code")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update inventory details (e.g. stock correction, price change)
// @route   PUT /api/admin/inventory/:id
// @access  Private/Admin
const updateInventory = async (req, res) => {
  try {
    const {
      quantity,
      costPrice,
      sellingPrice,
      FinalPrice,
      lowStockThreshold,
      imei,
    } = req.body;

    const inventory = await Inventory.findById(req.params.id).populate(
      "product",
    );

    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }

    // Get the product MRP for validation
    const productMRP = inventory.product.mrp;

    // Validate prices against MRP if they are being updated
    if (costPrice !== undefined && costPrice > productMRP) {
      return res.status(400).json({
        success: false,
        message: `Cost Price (₹${costPrice}) cannot exceed MRP (₹${productMRP})`,
      });
    }

    if (sellingPrice !== undefined && sellingPrice > productMRP) {
      return res.status(400).json({
        success: false,
        message: `Selling Price (₹${sellingPrice}) cannot exceed MRP (₹${productMRP})`,
      });
    }

    if (FinalPrice !== undefined && FinalPrice > productMRP) {
      return res.status(400).json({
        success: false,
        message: `Final Price (₹${FinalPrice}) cannot exceed MRP (₹${productMRP})`,
      });
    }

    inventory.quantity = quantity !== undefined ? quantity : inventory.quantity;
    inventory.costPrice =
      costPrice !== undefined ? costPrice : inventory.costPrice;
    inventory.sellingPrice =
      sellingPrice !== undefined ? sellingPrice : inventory.sellingPrice;
    inventory.FinalPrice =
      FinalPrice !== undefined ? FinalPrice : inventory.FinalPrice;
    inventory.lowStockThreshold =
      lowStockThreshold !== undefined
        ? lowStockThreshold
        : inventory.lowStockThreshold;
    inventory.imei = imei !== undefined ? imei : inventory.imei;

    // Auto-manage isActive based on quantity
    if (inventory.quantity > 0) {
      inventory.isActive = true;
    } else {
      inventory.isActive = false;
    }

    await inventory.save();
    await inventory.populate({
      path: "product",
      populate: [
        { path: "category", select: "name" },
        { path: "subCategory", select: "name" },
      ],
    });

    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/admin/inventory/:id
// @access  Private/Admin
const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory item not found" });
    }

    await inventory.deleteOne();
    res.status(200).json({ success: true, message: "Inventory item removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get inventory by product across all branches
// @route   GET /api/admin/inventory/product/:productId
// @access  Private/Admin, Manager
const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const inventory = await Inventory.find({ product: productId })
      .populate("branch", "name code")
      .sort({ quantity: -1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addInventory,
  getInventoryByBranch,
  updateInventory,
  deleteInventory,
  getInventoryByBranchStaff,
  getInventoryByProduct,
};
