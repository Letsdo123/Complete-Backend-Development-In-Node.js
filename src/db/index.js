import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import util from 'util'
const connectDB= async () =>{
    try {
        const connectionInsatnce = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected !! Full Connection Instance : ${util.inspect(connectionInsatnce, { showHidden: false, depth: null, colors: true })}`);
    } catch (error) {
        console.error("MONGODB Connection Error ",error);
        process.exit(1);
    }
}

export default connectDB