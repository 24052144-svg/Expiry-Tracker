import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../mongodb";
import User from "../../models/user";
import Product from "../../models/product";
import webpush from "web-push";
import nodemailer from "nodemailer";

// Configuration - These should ideally be in process.env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BLUAm7nXtNQLl47XooQ5wPx0jFc5ZMSHnaJyP4cq7buwfIIuN-K-FpMR4VYWA3fay-D1483IWycz1HTltFdxBNw";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "ScmvrbJX3GHwxjVoCbT0yIgSjWH4fnMQU9jMlZr755M";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:example@yourdomain.org";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

type ReminderUser = {
  _id: string;
  email: string;
  reminderDays?: number;
};

type ExpiringProduct = {
  _id: string;
  product_name: string;
  expiry_date: Date;
};


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function getExpiringProducts(userId: string, thresholdDays: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + thresholdDays);
    futureDate.setHours(23, 59, 59, 999);

    return await Product.find({
        userId,
        expiry_date: {
            $gte: today,
            $lte: futureDate
        }
    });
}

async function sendEmailReminder(user: ReminderUser, products: ExpiringProduct[]) {
    const thresholdDays = user.reminderDays || 7;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const productListHtml = products.map(p => `
        <li style="margin-bottom: 16px; padding: 16px; background-color: #f8fafc; border-radius: 8px; list-style: none; border-left: 4px solid #ef4444;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="flex: 1; min-width: 200px;">
                    <strong style="color: #1e293b; font-size: 15px;">${p.product_name}</strong><br/>
                    <span style="font-size: 13px; color: #64748b;">Expires on: ${new Date(p.expiry_date).toLocaleDateString()}</span>
                </div>
                <a href="${baseUrl}/edit-item/${p._id}" 
                   style="background-color: #2563eb; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; white-space: nowrap; display: inline-block;">
                   View Item
                </a>
            </div>
        </li>
    `).join("");

    await transporter.sendMail({
        from: `"Expiry Tracker" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Expiry Alert! 🚨 Items Expiring Soon",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #1e293b; margin: 0;">Expiry Alert! 🚨</h2>
                    <p style="color: #64748b;">You have items expiring within the next ${thresholdDays} days.</p>
                </div>
                <ul style="padding: 0; margin: 0;">
                    ${productListHtml}
                </ul>
                <div style="margin-top: 32px; text-align: center;">
                    <a href="${baseUrl}/expiring-soon" 
                       style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 16px;">
                       View All Items
                    </a>
                </div>
                <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    This is an automated reminder from Expiry Tracker. You can change your notification settings in the app.
                </p>
            </div>
        `,
    });
}

export async function GET() {
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    try {
        await connectDB();

        const users = await User.find({
            $or: [
                { notificationChannel: "push", pushSubscription: { $ne: null } },
                { notificationChannel: "email", emailReminder: true }
            ]
        });

        const results = [];

        for (const user of users) {
            const expiringSoon = await getExpiringProducts(user._id, user.reminderDays || 7);

            if (expiringSoon.length > 0) {
                if (user.notificationChannel === "push" && user.pushSubscription) {
                    const payload = JSON.stringify({
                        title: "Expiry Alert! 🚨",
                        body: `You have ${expiringSoon.length} item(s) expiring within the next ${user.reminderDays || 7} days.`,
                        icon: "/icon-192x192.png",
                        url: "/expiring-soon"
                    });

                    try {
                        await webpush.sendNotification(user.pushSubscription, payload);
                        results.push({ userId: user._id, channel: "push", status: "sent", count: expiringSoon.length });
                    } catch (err) {
                        console.error(`Failed to send push to user ${user._id}:`, err);
                        results.push({ userId: user._id, channel: "push", status: "failed", error: "Push service rejected" });
                    }
                } else if (user.notificationChannel === "email" && user.emailReminder) {
                    if (!smtpConfigured) {
                        results.push({ userId: user._id, channel: "email", status: "failed", error: "SMTP not configured" });
                        continue;
                    }
                    try {
                        await sendEmailReminder(user, expiringSoon);
                        results.push({ userId: user._id, channel: "email", status: "sent", count: expiringSoon.length });
                    } catch (err) {
                        console.error(`Failed to send email to user ${user._id}:`, err);
                        results.push({ userId: user._id, channel: "email", status: "failed", error: "Email service rejected" });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processed: users.length, details: results });
    } catch (error) {
        console.error("Reminder dispatcher error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    try {
        await connectDB();
        const { decodeToken } = await import("../auth");
        const decodedToken = await decodeToken(token);
        if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await User.findById(decodedToken.id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check if notifications are enabled
        const isPushEnabled = user.notificationChannel === "push" && user.pushSubscription;
        const isEmailEnabled = user.notificationChannel === "email" && user.emailReminder;

        if (!isPushEnabled && !isEmailEnabled) {
            return NextResponse.json({ success: true, message: "Notifications not enabled" });
        }

        const expiringSoon = await getExpiringProducts(user._id, user.reminderDays || 7);

        if (expiringSoon.length > 0) {
            if (isPushEnabled) {
                const payload = JSON.stringify({
                    title: "Expiry Alert! 🚨",
                    body: `Welcome back! You have ${expiringSoon.length} item(s) expiring within the next ${user.reminderDays || 7} days.`,
                    icon: "/icon-192x192.png",
                    url: "/expiring-soon"
                });
                try {
                    await webpush.sendNotification(user.pushSubscription, payload);
                    return NextResponse.json({ success: true, message: "Push reminder sent", count: expiringSoon.length });
                } catch (err) {
                    console.error(`Failed to send push to user ${user._id}:`, err);
                    return NextResponse.json({ error: "Push service rejected" }, { status: 502 });
                }
            } else if (isEmailEnabled) {
                if (!smtpConfigured) {
                    return NextResponse.json({ success: false, error: "SMTP not configured" }, { status: 400 });
                }
                try {
                    await sendEmailReminder(user, expiringSoon);
                    return NextResponse.json({ success: true, message: "Email reminder sent", count: expiringSoon.length });
                } catch (err) {
                    console.error(`Failed to send email to user ${user._id}:`, err);
                    return NextResponse.json({ error: "Email service rejected" }, { status: 502 });
                }
            }
        }

        return NextResponse.json({ success: true, message: "No items expiring soon" });
    } catch (error) {
        console.error("Single reminder error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
