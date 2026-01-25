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

    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    
    const expiredProducts = await Product.find({
      userId: decodedToken.id,
      expiry_date: {
        $lt: today, // Fetches products whose expiry_date is strictly before today
      },
    }).sort({ expiry_date: -1 }); // Sorts expired products from most recent → oldest

    return NextResponse.json(
      { expiredProducts },
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