import mongoose, { Schema } from "mongoose";

const cartSchema = new mongoose.Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    cartItems: [
        {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type:Number,
            default: 1,
            required: true
        },
        size: {
            type: String,
            enum: ["S", "M","L", "XL", "XXL"],
            default: "M",
            required: true
        },
    }
    ],
}, {timestamps: true});

export const Cart = mongoose.model("Cart", cartSchema);