import { NextResponse } from "next/server";

type SpoonacularIngredient = {
  original: string;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ Id: string }> }
) {

  try {
    const { Id } = await params;
    console.log(Id)
    const response = await fetch(
      `https://api.spoonacular.com/recipes/${Id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`
    );

    console.log(response)

    if (!response.ok) {
      const err = await response.text();
      // console.error("Spoonacular Error:", err);

      if (response.status === 404) {
        return NextResponse.json(
          { message: "Recipe not found on Spoonacular" },
          { status: 404 }
        );
      }


      return NextResponse.json(
        { message: "Spoonacular API error", details: err },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      id: data.id,
      title: data.title,
      image: data.image,
      ingredients: data.extendedIngredients?.map((i: SpoonacularIngredient) => i.original) || [],
      instructions: data.instructions || "No instructions available",
    });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch recipe details" },
      { status: 500 }
    );
  }
}
// fetches spoonacular id