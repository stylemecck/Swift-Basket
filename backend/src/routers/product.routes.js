import { Router } from "express";
import { coverImageAndAdImage } from "../middlewares/multer.middleware.js";
import { createProduct } from "../controllers/product.controllers.js";


const router = Router();

router.route("/products").post(
    coverImageAndAdImage,
    createProduct
);

export default router;