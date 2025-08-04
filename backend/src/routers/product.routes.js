import { Router } from "express";
import { coverImageAndAdImage } from "../middlewares/multer.middleware.js";
import { verifyJWT, adminOnly } from "../middlewares/auth.middleware.js";
import {
  createProduct,
  getAllProducts,
  getRecommendedProducts,
  getFeaturedProducts,
  getProductByGender,
  getProductByCategory,
  getProductByCategorySubCategory,
  getProductById,
  toggleFeaturedProduct,
  deleteProduct,
  addProductReview,
  editProductReview,
  deleteProductReview
} from "../controllers/product.controllers.js";

const router = Router();

/* ─────────────────────────────────────
 * 🛡️ Admin Routes (Protected)
 * ───────────────────────────────────── */
router.get("/admin/all", verifyJWT, adminOnly, getAllProducts);
router.get("/admin/recommendations", verifyJWT, adminOnly, getRecommendedProducts);
router.post("/admin/create", verifyJWT, adminOnly, coverImageAndAdImage, createProduct);
router.patch("/admin/:id/featured", verifyJWT, adminOnly, toggleFeaturedProduct);
router.delete("/admin/:id", verifyJWT, adminOnly, deleteProduct);

/* ─────────────────────────────────────
 * 🌟 Public Routes
 * ───────────────────────────────────── */
router.get("/featured", getFeaturedProducts);

/* ─────────────────────────────────────
 * 🔍 Filter Routes
 * ───────────────────────────────────── */
// Gender-based
router.get("/gender/:gender", getProductByGender);
router.get("/gender/:gender/category/:category", getProductByCategory);
router.get("/gender/:gender/category/:category/sub/:subCategory", getProductByCategorySubCategory);

// Category-only
router.get("/category/:category", getProductByCategory);
router.get("/category/:category/sub/:subCategory", getProductByCategorySubCategory);

/* ─────────────────────────────────────
 * 📦 Product Details
 * ───────────────────────────────────── */
router.get("/:id", getProductById);

/* ─────────────────────────────────────
 * 📝 Reviews
 * ───────────────────────────────────── */
router.post("/:productId/review", verifyJWT, addProductReview);
router.put("/:productId/review", verifyJWT, editProductReview);
router.delete("/:productId/review", verifyJWT, deleteProductReview);

export default router;
