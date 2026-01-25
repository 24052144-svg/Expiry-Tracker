import mongoose from "mongoose";
//import Image from "next/image";

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    expiry_date: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ["non-veg", "medicine", "cosmetics", "dairy", "drinks", "groceries", "other"]
    },
    image_url: {
        type: String,
        required: false
    },
    userId: {            // userId is used to link this journal entry to a user
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", //this id refers to the user model
        required: true
    }
}, { timestamps: true });
export default mongoose.models.Product || mongoose.model("Product", productSchema);