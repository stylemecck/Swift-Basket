import { Product } from "../models/products.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    subCategory,
    gender,
    countInStock,
  } = req.body;

  // Validation
  if (
    !name ||
    !description ||
    !price ||
    !category ||
    !subCategory ||
    !gender ||
    !countInStock
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  // Check cover image file
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file path not found");
  }

  

  // Track uploaded image public IDs for rollback
  const publicIds = [];

  try {
    // Upload Cover Image
    const coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImageUpload) {
      throw new ApiError(400, "Cover Image upload failed");
    }

    

    const coverImage = {
      url: coverImageUpload.secure_url,
      public_id: coverImageUpload.public_id,
    };

    publicIds.push(coverImage.public_id);

    // Upload Additional Images
    const additionalImages = [];

    if (req.files.additionalImages && req.files.additionalImages.length > 0) {
      for (const file of req.files.additionalImages) {
        const result = await uploadOnCloudinary(file.path);
        if (result) {
          additionalImages.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
          publicIds.push(result.public_id);
        }

        
      }
    }

    // Save product to database
    const product = await Product.create({
      name,
      description,
      price,
      gender,
      category,
      subCategory,
      coverImage,
      additionalImages,
      countInStock,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error) {
    console.error("❌ Product creation error:", error.message);

    // Rollback: delete any uploaded images from Cloudinary
    if (publicIds.length > 0) {
      await Promise.all(publicIds.map((id) => deleteFromCloudinary(id)));
    }

    throw new ApiError(500, `Product creation failed: ${error.message}`);
  }
});

export { createProduct };
