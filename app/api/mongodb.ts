import mongoose from"mongoose";

export async function connectDB(){
    try{
        const URI=process.env.DB  //env variable stored  in process.env, DB is env variable where all 
                                   // secret things are there

                                   // connection string helps app to connect to database

        if(!URI)
            throw new Error("connection string not found")
        await mongoose.connect(URI)
        console.log("MongoDB connected");
    }catch(error){    // if any errror in try then instead of program getting stopped, it runs in catch
        console.error("MongoDB connection failed:",error);
    }finally{   // it will if connection fails or succeed, will be executed for sure
        console.log("DB process finished ")
    }
 }