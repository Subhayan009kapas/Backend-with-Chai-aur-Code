import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()


// use is used for middele wares 
app.use(cors({
          origin:process.env.CORS_ORIGIN,
          credentials:true
}))
app.use(express.json({limit:"16kb"}))  // if the data is in the json format 
app.use(express.urlencoded({extended:true , limit:"16kb"})) // encode the url
app.use(express.static("public"))  // for pdf , images 
app.use(cookieParser())


//Routes import

import userRouter from './routes/user.routes.js'

 
//routes declaration

app.use("/api/v1/users" , userRouter)

 //the url will be ...
// http://localhost:8000/api/v1/users/register

export {app}