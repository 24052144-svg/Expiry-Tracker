import { connectDB } from "@/app/api/mongodb";
import User from "@/app/models/user";
import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/app/api/auth";

export async function GET(req: NextRequest) {
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

    // Get user settings, fetches specific user settings for the currently logged-in user.
    const user = await User.findById(decodedToken.id).select( // Find the user whose ID is stored in the token.
      "reminderDays notificationChannel emailReminder"
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return settings with defaults if not already set
    const settings = {
      reminderDays: user.reminderDays ?? 3, // By Default will be 3 days before expiry
      notificationChannel: user.notificationChannel ?? "email", // Default: email
      emailReminder: user.emailReminder ?? true, // Default: enabled
    };
// ?? → checks only null or undefined, Use the value on the left unless it is null or undefined, 
// otherwise use the value on the right

    return NextResponse.json(settings, { status: 200 });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}