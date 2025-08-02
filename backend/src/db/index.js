import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const conncetDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n Monogdb conncection success:  ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Monogdb conncection failed DB/iNDEX.JS ", error);
        process.exit(1);
    }
}

export default conncetDB