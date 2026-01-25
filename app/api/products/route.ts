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

    // Fetch all products for the user
    const products = await Product.find({
      userId: decodedToken.id,
    }).sort({ createdAt: -1 }); // Sort by newest first

    return NextResponse.json(products, { status: 200 });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}