import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  
  getCartItems,
  addToCart,
  removeCartItem,
  updateCartItemQuantity,
  clearCart
} from "../controllers/cart.controllers.js";

const router = Router();

// All routes use verifyJWT
router.get("/", verifyJWT, getCartItems);           // Get all cart items
router.post("/", verifyJWT, addToCart);             // Add new item to cart
router.patch("/:productId", verifyJWT, updateCartItemQuantity); // Update quantity
router.delete("/:productId", verifyJWT, removeCartItem);        // Remove specific item
router.delete("/", verifyJWT, clearCart);           // Clear cart

export default router;
