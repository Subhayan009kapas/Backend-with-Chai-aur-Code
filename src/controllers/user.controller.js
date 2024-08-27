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

      const existedUser= await User.findOne({
          $or:[{username},{email}]
       })   // username or email is exists or not 
       if(existedUser){
          throw new ApiError(409 ,"User with email or Username already exists")
       }

       //console.log(req.files)

    // user existence Check start End 


// Upload Images Start

   const avatarLoaclPath= req.files?.avatar[0]?.path
   
   //console.log(avatarLoaclPath)
   // comes from fields  middlewares of router
   // const coverImageLocalpath=req.files?.coverImage[0]?.path;

   let coverImageLocalpath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalpath =req.files.coverImage[0].path
   }

   if(!avatarLoaclPath){ 
          throw new ApiError(400 ,"Avatar file is required")
   }

   const avatar= await uploadOnCloudinary(avatarLoaclPath)   // avater uploading
   const coverImage=await uploadOnCloudinary(coverImageLocalpath) // coverimgae uploading 

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
          password,
          username:username.toLowerCase()
})
// create user object End



// remove password and refresh token   field from response field 
const createdUser=  await User.findById(user._id).select(
          "-password -refreshToken"
)
// '-' symbol indicates that this two things will not go to user 


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