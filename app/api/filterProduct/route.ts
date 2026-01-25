import { connectDB } from "@/app/api/mongodb";
import Product from "@/app/models/product";
import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/app/api/auth";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  
  if (!token) { // Checks if token is missing, undefined, or empty.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const decodedToken = await decodeToken(token);
    // checking whether the token could be successfully decoded and is valid i.e. not expired, not 
    // tampered,signed correctly
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get category from URL parameters
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category"); // I will get the value of category parameter

    if (!category || category.trim() === "") {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Filter products by category (case-insensitive)
    const products = await Product.find({
      userId: decodedToken.id,
      category: {
        $regex: `^${category}$`,
        $options: "i", // Case-insensitive match
      },
    }).sort({ expiry_date: 1 }); // Sort by expiry date (nearest first)

    return NextResponse.json(
      { products },
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