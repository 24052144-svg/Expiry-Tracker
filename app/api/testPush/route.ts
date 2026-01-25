import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../mongodb";
import User from "../../models/user";
import { decodeToken } from "../auth";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BLUAm7nXtNQLl47XooQ5wPx0jFc5ZMSHnaJyP4cq7buwfIIuN-K-FpMR4VYWA3fay-D1483IWycz1HTltFdxBNw";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "ScmvrbJX3GHwxjVoCbT0yIgSjWH4fnMQU9jMlZr755M";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:example@yourdomain.org";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export async function POST(req: NextRequest) {
    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        const decodedToken = await decodeToken(token);

        if (!decodedToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(decodedToken.id);

        if (!user || !user.pushSubscription) {
            return NextResponse.json({ error: "User or subscription not found" }, { status: 404 });
        }

        const payload = JSON.stringify({
            title: "Test Notification! 🎉",
            body: "Great news! Your web push notifications are working perfectly.",
            icon: "/icon-192x192.png",
            url: "/dashboard"
        });

        await webpush.sendNotification(user.pushSubscription, payload);

        return NextResponse.json({ success: true, message: "Test notification sent!" });
    } catch (error) {
        console.error("Test push error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
