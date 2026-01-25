import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "../mongodb";
import User from "../../models/user";
import { decodeToken } from "../auth";

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

    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user.toObject();
    if (userData.reminderDays === undefined || userData.reminderDays === null) userData.reminderDays = 7;
    if (userData.notificationChannel === undefined || userData.notificationChannel === null) userData.notificationChannel = "email";
    if (userData.emailReminder === undefined || userData.emailReminder === null) userData.emailReminder = true;

    return NextResponse.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
