import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser =asyncHandler(async(req , res) =>{
         // get user details from frontend
         //validation - not empty
         //check if user already exits : username , email
         //check for images , chek for avater
         //upload them to clodinary  , avater
         // create user object - crete entry in db
         // remove password and refresh token   field from response field 
         // check for user creation
         // return res

         const {fullname , email , username , password}=req.body
         console.log("email" ,email) ;

         // check  valdation Start
        if(
            [fullname , email ,username , password].some((field)=> field?.trim() === "")
        ){
          throw new ApiError(400 , "All fields are required")
        }
       // check  valdation End 


 // user existence Check start

      const existedUser= User.findOne({
          $or:[{username},{email}]
       })
       if(existedUser){
          throw new ApiError(409 ,"User with email or Username already exists")
       }

    // user existence Check start End 


    // Upload Images Start
   const avatarLoaclPath= req.files?.avatar[0]?.path  
   // comes from fields  middlewares of router
   const coverImageLocalpath=req.files?.coverImage[0]?.path;

   if(!avatarLoaclPath){ 
          throw new ApiError(400 ,"Avatar file is required")
   }

   const avatar= await uploadOnCloudinary(avatarLoaclPath)
   const coverImage=await uploadOnCloudinary(coverImageLocalpath)

   if(!avatar){
          throw new ApiError(400 ,"Avatar file is required")
   }
// Upload images End 


// create user object start
const user = await User.create({
          fullname ,
          avatar:avatar.url,
          coverImage:coverImage?.url || "",
          email,
          password:username.toLowerCase()
})
// create user object End



// remove password and refresh token   field from response field 
const createdUser=User.findById(user._id).select(
          "-password -refreshToken"
)



// check for user creation
if(!createdUser){
          throw new ApiError(500 ,"something went wrong while registering the user ")
}

// response 
return res.status(201).json(
          new ApiResponse(200 , createdUser ,"User Registered succesfully")
)








})

export {registerUser}