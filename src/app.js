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

export {app}