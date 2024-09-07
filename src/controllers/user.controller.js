import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


// Method For Generate AccessToken and RefreshToken 
const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId)

      const accesstoken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken  // it will be save on databse

      await user.save({ validateBeforeSave: false })

      return { accesstoken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something went wrong ")
   }
}
// Method For Generate AccessToken and RefreshToken 



const registerUser = asyncHandler(async (req, res) => {

   // get user details from frontend
   //validation - not empty
   //check if user already exits : username , email
   //check for images , chek for avater
   //upload them to clodinary  , avater
   // create user object - crete entry in db
   // remove password and refresh token   field from response field 
   // check for user creation
   // return res

   const { fullname, email, username, password } = req.body
   console.log("email", email);

   // check  valdation Start
   if (
      [fullname, email, username, password].some((field) => field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }
   // check  valdation End 


   // user existence Check start

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })   // username or email is exists or not 
   if (existedUser) {
      throw new ApiError(409, "User with email or Username already exists")
   }

   //console.log(req.files)

   // user existence Check start End 


   // Upload Images Start

   const avatarLoaclPath = req.files?.avatar[0]?.path

   //console.log(avatarLoaclPath)
   // comes from fields  middlewares of router
   // const coverImageLocalpath=req.files?.coverImage[0]?.path;

   let coverImageLocalpath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalpath = req.files.coverImage[0].path
   }

   if (!avatarLoaclPath) {
      throw new ApiError(400, "Avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLoaclPath)   // avater uploading
   const coverImage = await uploadOnCloudinary(coverImageLocalpath) // coverimgae uploading 

   if (!avatar) {
      throw new ApiError(400, "Avatar file is required")
   }

   // Upload images End 


   // create user object start
   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })
   // create user object End



   // remove password and refresh token   field from response field 
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )
   // '-' symbol indicates that this two things will not go to user 


   // check for user creation
   if (!createdUser) {
      throw new ApiError(500, "something went wrong while registering the user ")
   }

   // response 
   return res.status(201).json(
      new ApiResponse(200, createdUser, "User Registered succesfully")
   )


})


// --------------User Login Process-------------------------

const loginUser = asyncHandler(async (req, res) => {

   // get data from req body
   //check username or email
   //find the user
   //password check 
   //Generate access and refreshtoken
   //send to cookie

   const { email, username, password } = req.body

   // Check username || Email is thre or not

   if (!username || !email) {
      throw new ApiError(400, "username or pasword is required");
   }

   // Check username || Email is thre or not


   // Find User by username and email from database value <start>

   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   // This user  variable have the accces of all data of the User 

   if (!user) {
      throw new ApiError(400, "username or email is rerquired")
   }

   // Find User by username and email from database value <END>

   // check  password of the userr -> Connected with() User.mode.js)

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user Credentials")
   }
   // check  password of the userr  


   // Generarte  accestoken , refreshtoken by call generateAccessAndRefreshTokens

   const { accesstoken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select({ password: 0, refreshToken: 0 })

   const options = {

      httpOnly: true,
      secure: true,

      // for Security puspose where the any one cannot modify the cookies  from frontend it can only modified in the browser 

   }
   return res
      .status(200)
      .cookie("accessToken", accesstoken, options)
      .cookie("refreshToken ", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser, accesstoken, refreshToken
            },
            "User logged In Successfully"

         )
      )
      

})

// ----------LogOut -------------

const logoutUser = asyncHandler(async (req, res) => {

   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken :undefined
         }
      },
      {
         new:true
      }
   )
   const options = {

      httpOnly: true,
      secure: true,

      // for Security puspose where the any one cannot modify the cookies  from frontend it can only modified in the browser 

   }

   return res
   .status(200)
   .clearCookie("accessToken" ,options)
   .clearCookie("refreshToken" ,options)
   .json(new ApiResponse(200 ,{},"User logged out"))



})
 


// -------Refresh Accesss  Token   For Users ---------

const refreshAccessToken = asyncHandler(async(req , res )=>{

 // collect refreshtoken sending By User 
   const incomingRefreshToken= req.cookies.refreshToken|| req .body.refreshToken

   // check  refreshtoken
   if(!incomingRefreshToken){

      throw new ApiError(401 ,"unauthorized request ")

   }
// Verify By Jwt and create decoded token by which user will be find out 
  try{
   const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET

   )

   // find he id of the user through the decodedToken 

   const user = await User.findById(decodedToken?._id)

   if(!user){

      throw new ApiError(401 ,"Invalid refreshToken ")

   }

   // Check user's (User freshtoken  Vs  Data Base refresh Token ) 

   if(incomingRefreshToken !== user?.refreshToken){

      throw new ApiError(401 ," Refresh Token is expired or used")
   }

   // security purpose
   
   const options={
      httpOnly:true ,
      secure :true ,

   }

   // generarte new refresh token and the access token 

  const {accesstoken , newrefreshToken}=await generateAccessAndRefreshTokens(user._id)

  // return responses 
  return res 
  .status(200)
  .cookie("accessToken" ,accesstoken ,options)
  .cookie("refreshToken", newrefreshToken , options)
  .json(
   new ApiResponse(
      200 ,
      {accesstoken , refreshToken: newrefreshToken},
      "Access Token Refreshed Successfully "
   )
  )
}catch(error){
   throw new ApiError(401 , error?.message || "Invalid refresh token")
}


})


export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken

}