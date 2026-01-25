import { connectDB } from "@/app/api/mongodb";
import Product from "@/app/models/product";
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

    // Get days parameter
    const { searchParams } = new URL(req.url);
    // searchParams reads query parameters

    const days = parseInt(searchParams.get("days") || "7");
    // returns value of days query parameter as a string and parseint convert into no.


    // Calculate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    // Find products expiring soon
    const expiringProducts = await Product.find({
      userId: decodedToken.id,
      expiry_date: {
        $gte: today,
        $lte: futureDate,        // from today till next "days" me kon kon se expire ho rhe
      },
    }).sort({ expiry_date: 1 }); // ascending order i.e products getting expired soon will at top 

    return NextResponse.json(
      { expiringProducts },
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