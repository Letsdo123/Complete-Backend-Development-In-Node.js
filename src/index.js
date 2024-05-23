import dotenv from 'dotenv'
// database is always in different continental
import connectDB from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path:'./env'
})
// calling the connectDB Function
let PORT = process.env.PORT || 3000;
connectDB()
.then(()=>{
   app.listen(PORT,()=>{
    // console.log(`The server is started at ${https//localhot:${PORT}}`);
    console.log("The server is started at",PORT);
   }) 
});