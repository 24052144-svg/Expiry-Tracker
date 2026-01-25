import { connectDB } from "@/app/api/mongodb";
import User from "@/app/models/user";
import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/app/api/auth";

type UpdateSettingsFields = {
  reminderDays?: number;
  notificationChannel?: "email" | "sms" | "push";
  emailReminder?: boolean;
};


export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    console.log("Update settings request body:", body);
    const { reminderDays, notificationChannel, emailReminder } = body;

    // Validate reminderDays if provided
    if (reminderDays !== undefined) { // checking if reminderdays exist in request body
      // did not used if(reminderDays) as it would reject 0

      if (typeof reminderDays !== "number" || reminderDays < 0 || reminderDays > 365) {
        return NextResponse.json(
          { error: "reminderDays must be a number between 0 and 365" },
          { status: 400 }
        );
      }
    }

    // Validate notificationChannel if provided
    if (notificationChannel !== undefined) {
      const validChannels = ["email", "sms", "push"];
      if (!validChannels.includes(notificationChannel)) {
        return NextResponse.json(
          { error: "notificationChannel must be one of: email, sms, push" },
          { status: 400 }
        );
      }
    }

    // Validate emailReminder if provided
    if (emailReminder !== undefined && typeof emailReminder !== "boolean") {
      return NextResponse.json(
        { error: "emailReminder must be a boolean" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateFields: UpdateSettingsFields= {};
    if (reminderDays !== undefined) updateFields.reminderDays = reminderDays;
    if (notificationChannel !== undefined) updateFields.notificationChannel = notificationChannel;
    if (emailReminder !== undefined) updateFields.emailReminder = emailReminder;

    // Check if there's anything to update
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update user settings
    const user = await User.findByIdAndUpdate(
      decodedToken.id,
      { $set: updateFields }, // Update only these fields and leave everything else unchanged
      { new: true, runValidators: true } // Forces Mongoose to apply schema validation rules,
      //  for eg-- If schema says reminderDays must be ≤ 30
      //new: true, Returns the updated user document
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Settings updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}