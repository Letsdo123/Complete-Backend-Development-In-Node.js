import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// configure the cors
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
})) 

// we use '.use' specially for configure the express file
// basically when we use middleware then we need to configure the file with use
// right now we are configuring the file accepting from different source and can
// set the limitation and extra configuration
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from './routes/user.routes.js'

// routes declaration
app.use("/api/v1/users",userRouter);

app.get("/",(req,res)=>{
    res.send("This is home page");
})

export {app}