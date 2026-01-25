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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    // Get total items count
    const totalItems = await Product.countDocuments({
      userId: decodedToken.id,
    });  // how many product documents exist for that particular logged-in user

    // Get expiring items count (expires within next 3 days, not including expired)
    const expiringCount = await Product.countDocuments({
      userId: decodedToken.id,
      expiry_date: {
        $gte: today,
        $lte: futureDate,
      },
    });

    // Get expired items count
    const expiredCount = await Product.countDocuments({
      userId: decodedToken.id,
      expiry_date: {
        $lt: today,
      },
    });

    return NextResponse.json(
      {
        totalItems,
        expiringCount,
        expiredCount
      },
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