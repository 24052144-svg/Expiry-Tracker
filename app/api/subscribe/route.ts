import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../mongodb";
import User from "../../models/user";
import { decodeToken } from "../auth";

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

        const { subscription } = await req.json();
        console.log("Incoming push subscription:", subscription);

        if (!subscription) {
            return NextResponse.json({ error: "Subscription object is required" }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(
            decodedToken.id,
            { $set: { pushSubscription: subscription, notificationChannel: "push" } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Subscribed successfully" });
    } catch (error) {
        console.error("Subscription error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
