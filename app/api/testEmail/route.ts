import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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

        const user = await User.findById(decodedToken.id);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = parseInt(process.env.SMTP_PORT || "587");

        console.log("--- Test Email Debug ---");
        console.log("SMTP_USER:", smtpUser);
        console.log("SMTP_PASS length:", smtpPass?.length || 0);
        console.log("------------------------");

        if (!smtpUser || !smtpPass) {
            return NextResponse.json({
                error: "SMTP configuration missing",
                details: "Please set SMTP_USER and SMTP_PASS in your .env file."
            }, { status: 400 });
        }

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        console.log("Transporter config:", {
            host: smtpHost,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === "true",
            user: smtpUser,
        });

        const info = await transporter.sendMail({
            from: `"Expiry Tracker" <${smtpUser}>`,
            to: user.email,
            subject: "Test Notification! 🎉",
            text: "Great news! Your email notifications are working perfectly.",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Test Notification! 🎉</h2>
                    <p>Great news! Your email notifications are working perfectly.</p>
                    <div style="margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                           Go to Dashboard
                        </a>
                    </div>
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        This is a test email from Expiry Tracker.
                    </p>
                </div>
            `,
        });

        console.log("Message sent: %s", info.messageId);

        return NextResponse.json({ success: true, message: "Test email sent!" });
    } catch (error) {
        console.error("--- Test Email Error DEBUG ---");
        console.error("Error Object:", error);
        if (error instanceof Error) {
            console.error("Error Name:", error.name);
            console.error("Error Message:", error.message);
            console.error("Error Stack:", error.stack);
        }
        console.error("-------------------------------");
        return NextResponse.json({
            error: "Failed to send email. Check your SMTP configuration in .env",
            details: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}
