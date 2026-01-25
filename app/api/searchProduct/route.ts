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

    // Get search query from URL parameters
    const searchParams = req.nextUrl.searchParams; // access the query parameters in the URL
    const query = searchParams.get("query"); // Gets the value of the parameter named "query"

    if (!query || query.trim() === "") {
      // !query-->Checks if query is missing or null.
    // Checks if the remaining string is empty
   // Example: query = " " → becomes "" after trim()  
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Search products by name (case-insensitive)
    const products = await Product.find({  // there can be many product for one user
      userId: decodedToken.id,
      product_name: {
        $regex: query, // $regex → searches for products whose name contains the text in query
        // so is it that for whatever product user searches for it is searched in query parameter
        $options: "i", // Case-insensitive search
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