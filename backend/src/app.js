import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "20kb"}))
app.use(express.urlencoded({extended: true, limit: "20kb"}))
app.use(express.static("public"));
app.use(cookieParser());


//Routes 
import userRoute from "./routers/user.routes.js"
import productRoutes from "./routers/product.routes.js";
import cartRoutes from "./routers/cart.routes.js"

//routes decleartion
app.use("/api/v1/auth", userRoute)
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/cart", cartRoutes);

export {app}