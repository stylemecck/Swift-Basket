import dotenv from "dotenv";
import connectBD from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
    path:"./env"
});

connectBD()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port: ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed!! ", err);
})