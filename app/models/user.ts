import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    reminderDays: {
        type: Number,
        default: 7
    },
    notificationChannel: {
        type: String,
        enum: ["email", "push"],
        default: "email"
    },
    emailReminder: {
        type: Boolean,
        default: true
    },
    pushSubscription: {
        type: Object,
        default: null
    }
}, { timestamps: true });
export default mongoose.models.User || mongoose.model("User", userSchema);
