import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


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

   //generarte new refresh token and the access token 

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

//-------Upadte Controllers----------------

// Chanege Current Password 
const changeCurrentPassword =asyncHandler(async(req, res)=>{

   const{oldPassword , newPassword} = req.body  // old password is required to change the password 
   const user = await User.findById(req.user?._id)
   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
      throw new ApiError(400 , "Inavlid old password")
   }
   user.password=newPassword  // password is updated 

   await user.save({validateBeforeSave :false}) // save the password 

   return res
   .status(200)
   .json(new ApiResponse(200 ,{} , "Password changed Successfully"))
})

//-----Get Current USER-------

const getCurrentUser = asyncHandler(async(req, res)=>{
   return res
   .status(200)
   .json(new ApiResponse(200 ,req.user,"Current user fetched successfully"))
})

//--------update account details---------

const updateAccountDetails = asyncHandler(async(req, res)=>{

   const{fullname, email}=req.body

   if(!fullname || !email){
      throw new ApiError(400 ,"All field are Required")
   }
   const user= await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            fullname,
            email:email
         }
      },
      {new :true} // return info after update  
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200 ,user , "AccountDetails Updated Successfully"))

})

// ---------Update Avatar----------
const updateUserAvatar=asyncHandler(async(req ,res)=>{

   const avatarLocalPath= req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400 , "Avatar file is missing")
   }
   const avatar =await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(400 , "Error while uploading in avatar")
   }
  const user= await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:avatar.url
         }
      },
      {new:true}

   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200 ,user , "Avatar updated Successfuly"))
})

// --------Update user coverImage ------

const updateUserCoverImage=asyncHandler(async(req ,res)=>{

   const CoverImageLocalPath= req.file?.path
   if(!CoverImageLocalPath){
      throw new ApiError(400 , "CoverImage file is missing")
   }
   const coverImage  = await uploadOnCloudinary(CoverImageLocalPath)
   if(!coverImage.url){
      throw new ApiError(400 , "Error while uploading in Coverimage")
   }
  const user= await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage:coverImage.url
         }
      },
      {new:true}

   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200 ,user , "CoverImages updated Successfuly"))
})


//------Get UserChannel Profile----------------------

const getUserChannelProfile=asyncHandler(async(req,res)=>{
   const {username} = req.params  // access from databse url
   if(!username?.trim()){
      throw new ApiError(400 ,"Username is missing")
   }

  const channel= await User.aggregate([
   {
      $match:{  
         username:username?.toLowerCase()
      }
   },

   // findout no of Subscribers 
   {  
      $lookup:{
         from:"subscriptions",//from which collection field will be add
         localField:"_id", //field from the current user 
         foreignField:"channel",//field  from the <from> collection.will be matched against the localField
         as:"subscribers"//The name of the new field to add to the output documents
      }
   },

   // How many channel is sub Subscribed by me 
   {
      $lookup:{
         from:"subscriptions", // from which model field will be added
         localField:"_id",  // it's the field of the current  user 
         foreignField:"subscriber", // it's the field of the from
         as:"subscribedTo" ,//The name of the new field to add to the output documents
      }
      
   },
   // Add previous two field to User
   {
      $addFields:{
         subscibersCount:{
            $size:"$subscribers"
         },
         channelsSubscribedToCount:{
            $size:"$subscribedTo"
         },
         isSubscribed:{ // user is subscribed or not 
            $cond:{
               if:{$in:[req.user?._id ,"$subscribers.subscriber"]},
               then:true,
               else:false,
            }
         }
      }
   },
   {
      $project:{
         fullname:1,
         username:1,
         subscibersCount:1,
         channelsSubscribedToCount:1,
         isSubscribed:1,
         avatar:1,
         coverImage:1,
         email:1,
      }
   }
  ])

  if(!channel?.length){
   throw new ApiError(404 ,"Channel does not exits ")
  }

  return res
  .status(200)
  .json(
   new ApiResponse(200 ,channel[0],"User Channel Fetched Successfully ")
  )
   
})


// ---------Get  Watch History ---------------
const getWatchHistory = asyncHandler(async(req, res)=>{
     
    const user =await User.aggregate([
      {
         $match:{
            _id:new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
               {
                  $lookup:{
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"owner",
                     pipeline:[
                        { 
                           $project:{
                              fullname:1,
                              username:1,
                              avatar:1,
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner:{
                        $first:"$owner" // gives a object 
                     }
                  }
               }
            ]
         }
      },
    ])

    return res
    .status(200)
    .json(
      new ApiResponse(
         200 , 
         user[0].watchHistory,
         "Watch History Fetched Successfully "
      )
    )
     
})


export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
   

}