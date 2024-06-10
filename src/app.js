import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// configure the cors
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// we use '.use' specially for configure the express file
// basically when we use middleware then we need to configure the file with use
// right now we are configuring the file accepting from different source and can
// set the limitation and extra configuration
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);

// This is the default get request for checking the server is running or not in the main screen
app.get("/", (req, res) => {
    res.send("This is main page");
});

export { app };
