import { Product } from "../models/products.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
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

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });

  if (!products || products.length === 0) {
    throw new ApiError(404, "No products found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

//TODO: let to know about this

const toggleFeaturedProduct = asyncHandler(async (req, res) => {
  const { id: productID } = req.params;
  const product = await Product.findById(productID);
  if (!product) throw new ApiError(404, "Product not found");

  product.isFeatured = !product.isFeatured;
  await product.save();

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id: productID } = req.params;

  const product = await Product.findById(productID);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  try {
    const publicIdsToDelete = [];

    //add cover image public id
    if (product.coverImage?.public_id) {
      publicIdsToDelete.push(product.coverImage.public_id);
    }

    //add additional images public ids
    if (product.additionalImages && product.additionalImages?.length > 0) {
      product.additionalImages.forEach((img) => {
        if (img?.public_id) publicIdsToDelete.push(img.public_id);
      });
    }

    // Delete all images from Cloudinary
    await Promise.all(
      publicIdsToDelete.map((publicId) => deleteFromCloudinary(publicId))
    );
    // Delete product from DB
    await Product.findByIdAndDelete(productId);

    res
      .status(200)
      .json(new ApiResponse(200, null, "Product deleted successfully"));
  } catch (error) {
    throw new ApiError(500, "Product deletion failed : " + error.message);
  }
});

const getRecommendedProducts = asyncHandler(async (req, res) => {
  const randomProducts = await Product.aggregate([
    {$match: {isFeatured: true}},
    { $sample: { size: 3 } },
  ]);

  res.status(200).json(new ApiResponse(200, randomProducts, "Random Products fetched successfully"));
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const featuredProducts = await Product.find({ isFeatured: true }).sort({ createdAt: -1 });

  if (!featuredProducts || featuredProducts.length === 0) {
    throw new ApiError(404, "No featured products found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, featuredProducts, "Featured Products fetched successfully"));
})

const getProductByGender = asyncHandler(async (req, res) => {
  const {gender} = req.params;

  if(!gender) throw new ApiError(400, "Gender is required");

  const products = await Product.find({gender, isFeatured: true})

  if(!products || products.length === 0) {
    throw new ApiError(404, `No products found: ${gender}`); 
  }
    res.status(200).json(new ApiResponse(200, products, `Products fetched successfully for gender ${gender}`));
});

const getProductBygenderCategory = asyncHandler(async (req, res) => {
    const { gender, category } = req.params;

    if (!gender || !category) {
        throw new ApiError(400, "Category is required");
    }

    const products = await Product.find({ gender, category, isFeatured: true }).sort({ createdAt: -1 });

    if (!products || products.length === 0) {
        throw new ApiError(404, `No products found in category: ${category}`);
    }

    res.status(200).json(new ApiResponse(200, products, `Products in category ${category} fetched successfully`));
});

const getProductBygenderCategorySubCategory = asyncHandler(async (req, res) => {
    const { gender, category, subCategory } = req.params;

    if (!gender || !category || !subCategory) {
        throw new ApiError(400, "All fields are required")
    }

    const products = await Product.find({ gender, category, subCategory, isFeatured: true }).sort({ createdAt: -1 })

    if (!products || products.length === 0) {
        throw new ApiError(404, `No products found in gender: ${gender}, category: ${category} and sub-category: ${subCategory}`)
    }

    res.status(200).json(new ApiResponse(200, products, `Products in gender: ${gender}, category: ${category} and sub-category: ${subCategory} fetched successfully`))
})

const getProductByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;

    if (!category) {
        throw new ApiError(400, "Category is required");
    }

    const products = await Product.find({ category, isFeatured: true }).sort({ createdAt: -1 });

    if (!products || products.length === 0) {
        throw new ApiError(404, `No products found in category: ${category}`);
    }

    res.status(200).json(new ApiResponse(200, products, `Products in category ${category} fetched successfully`));
});

const getProductByCategorySubCategory = asyncHandler(async (req, res) => {
    const { category, subCategory } = req.params;

    if (!category || !subCategory) {
        throw new ApiError(400, "All fields are required");
    }

    const products = await Product.find({ category, subCategory, isFeatured: true }).sort({ createdAt: -1 });

    if (!products || products.length === 0) {
        throw new ApiError(404, `No products found in category: ${category} and sub-category: ${subCategory}`);
    }

    res.status(200).json(new ApiResponse(200, products, `Products in category: ${category} and sub-category: ${subCategory} fetched successfully`));
})

const getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    const product = await Product.findById(id)
        .populate({
            path: 'reviews.user',
            select: 'username email avatar.url'
        });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});

const addProductReview = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || !comment) {
        throw new ApiError(400, "Rating and comment are required");
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");

    const deliveredOrders = await Order.find({
        user: userId,
        orderStatus: "delivered",
        "orderItems.product": productId,
    });

    if (!deliveredOrders || deliveredOrders.length === 0) {
        throw new ApiError(403, "You can only review a product you’ve purchased and received");
    }

    const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === userId.toString()
    );
    if (alreadyReviewed) {
        throw new ApiError(400, "You’ve already reviewed this product");
    }

    product.reviews.push({
        user: userId,
        rating: Number(rating),
        comment,
    });
    // Update average rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings = totalRating / product.reviews.length;

    await product.save();

    // TODO: Send the newly added review 
    const populatedReview = await Product.findById(productId)
        .select("reviews")
        .populate({
            path: "reviews.user",
            select: "username email"
        });

    res.status(201).json(
        new ApiResponse(201, populatedReview.reviews, "Review added successfully")
    );
});

const editProductReview = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating && !comment) {
        throw new ApiError(400, "At least one of rating or comment is required");
    }

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");

    const review = product.reviews.find(
        (r) => r.user.toString() === userId.toString()
    );

    if (!review) {
        throw new ApiError(404, "You haven't reviewed this product yet");
    }

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment;

    // Recalculate average rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings = totalRating / product.reviews.length;

    await product.save();

    res.status(200).json(
        new ApiResponse(200, product.reviews, "Review updated successfully")
    );
});

const deleteProductReview = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");

    const existingReviewIndex = product.reviews.findIndex(
        (r) => r.user.toString() === userId.toString()
    );

    if (existingReviewIndex === -1) {
        throw new ApiError(404, "You haven't reviewed this product");
    }

    product.reviews.splice(existingReviewIndex, 1); // remove the review

    // Recalculate ratings
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings = product.reviews.length > 0
        ? totalRating / product.reviews.length
        : 0;

    await product.save();

    res.status(200).json(
        new ApiResponse(200, product.reviews, "Review deleted successfully")
    );
});


export { 
  createProduct, 
  getAllProducts, 
  toggleFeaturedProduct, 
  deleteProduct, 
  getRecommendedProducts, 
  getProductById, 
  addProductReview, 
  editProductReview, 
  deleteProductReview, 
  getProductBygenderCategorySubCategory, getProductByCategorySubCategory , getProductByCategory, 
  getProductByGender,
  getFeaturedProducts,
  getProductBygenderCategory,

};
