import mongoose , {Schema} from "mongoose";

import jwt from "jsonwebtoken"  // generate token
import bcrypt from "bcrypt"  // Encript od decript the password 

const userSchema = new Schema({
          username:{
                    type:String,
                    required:true,
                    unique:true,
                    lowercase:true,
                    trim:true,
                    index:true, // searching er subhidha hoba
          },
          email:{
                    type:String,
                    required:true,
                    unique:true,
                    lowercase:true,
                    trim:true,
                   
          },
          fullname:{
                    type:String,
                    required:true,
                    trim:true,
                    index:true,
                   
          },
          avatar:{
                    type:String, // cloudinary
                    required:true,//cloudinary
   
          },
          coverImage:{
                    type:String,

          },
          watchHistory:[
                    {
                    type:Schema.Types.ObjectId,
                    ref:"Video"
                    }
          ],
          password:{
                    type:String,
                    required:[true ,"Password is required"]
          },
          refreshToken:{
                    type:String,
          }
},{timestamps:true})


//**bcrypt: user er password ke encript kore  unreadable password e transfer kore
userSchema.pre("save" , async function(next){
          if(!this.isModified("password")) return next();  // it's check the password is modified or Not , (If tt's not modified it will exit...)  
          this.password = await bcrypt.hash(this.password ,10)
          next()
})

// User er input passworder sathe Database er password er compare kore 
userSchema.methods.isPasswordCorrect= async function (password){
       return await bcrypt.compare(password , this.password)
}

// generate  accesstoken  
userSchema.methods.generateAccessToken=function(){
        return jwt.sign(
                    {
                              _id:this._id,  // payload
                              email:this.email,
                              username:this.username,
                              fullname:this.fullname,

                    },
                    process.env.ACCESS_TOKEN_SECRET, // secret key
                    {
                              expiresIn:process.env.ACCESS_TOKEN_EXPIRY
                    }
          )

}

// generate refreshtoken
userSchema.methods.generateRefreshToken =function(){
          return jwt.sign(
                    {
                              _id:this.id,
                              email:this.email,
                              username:this.username,
                              fullname:this.fullname,

                    },
                    process.env.REFRESH_TOKEN_SECRET,
                    {
                              expiresIn:process.env.REFRESH_TOKEN_EXPIRY
                    }
          )
}

export const User=mongoose.model("User",userSchema)