import { NextResponse } from "next/server";

const SPOONACULAR_BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";

type SpoonacularRecipe = {
  id: number;
  title: string;
  image: string;
};

type SpoonacularSearchResponse = {
  results: SpoonacularRecipe[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url); // Extract Query Parameters
    const query = searchParams.get("query");// Get the query Value

    if (!query) {
      return NextResponse.json(
        { message: "Query parameter is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${SPOONACULAR_BASE_URL}?query=${query}&number=10&apiKey=${process.env.SPOONACULAR_API_KEY}`
      // api key for authentication
      // nummber=10---> how many recipes
      // query=${query}  ,so {query} takes changing value of query parameter?
    );

    if (!response.ok) { // Check if Spoonacular Request Failed
      return NextResponse.json(
        { message: "Failed to fetch recipes" },
        { status: response.status }
      );
    }

    const data: SpoonacularSearchResponse = await response.json(); // Converts Spoonacular response to JS object
    // Now you can access data.results

    // ✅ Normalize response (best practice)
    const recipes = data.results.map((item) => ({
      id: item.id,
      title: item.title,
      image: item.image,
    }));

    return NextResponse.json({ recipes });
 } 
    catch (error) {
    console.error("Recipe API Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
