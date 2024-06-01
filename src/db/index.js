import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import util from "util";
// mongodb+srv://pramaniksouvick086:<password>@cluster0.zgpig1y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const connectDB = async () => {
  try {
    // const connectionInsatnce = await mongoose.connect(
    //   `${process.env.MONGODB_URI}`
    // );
    const connectionInsatnce = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: DB_NAME, // Explicitly specify the database name here
      appName: "Cluster0", // Optional: specify appName for MongoDB connection
      retryWrites: true,
      w: "majority",
    });
    // console.log(
    //   `MongoDB Connected !! Full Connection Instance : ${util.inspect(connectionInsatnce, { showHidden: false, depth: null, colors: true })}`
    // );
  } catch (error) {
    console.log(process.env.PORT);
    console.error("MONGODB Connection Error ", error);
    process.exit(1);
  }
};

export default connectDB;
