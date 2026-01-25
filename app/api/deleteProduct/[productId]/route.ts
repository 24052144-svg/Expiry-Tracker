import { connectDB} from "@/app/api/mongodb";
import Product from "../../../models/product";
import { NextRequest, NextResponse } from "next/server";
import {decodeToken} from "@/app/api/auth";

export async function DELETE(req:NextRequest,{params}:
    {params:Promise<{productId: string}>}
){

 const token=req.headers.get("Authorization")?.split(" ")[1];
 if(!token){
    return NextResponse.json({error:"unauthorized"},
        {status: 401}
    );
}

try{
    await connectDB();

    const decodedToken=await decodeToken(token);
    if(!decodedToken){
        return NextResponse.json({error:"unauthorized"},{status:401});
    }

    //const productId=params.productId;
    const { productId } = await params;   
    console.log(productId);

    if(!productId){
        return NextResponse.json({error:"product id required"},{status:400});
    }

    const product=await Product.findOne({_id: productId});
    if(!product)
        return NextResponse.json({error:"product not found"},{status:404});

    await Product.findByIdAndDelete(productId);

    return NextResponse.json(
        {message:"product deleted successfully"},
        {status: 200}
    )}

    catch(error){
        console.error(error);
        return NextResponse.json(
            {error:"Internal server error"},
            {status: 500}
        );
    }
}
