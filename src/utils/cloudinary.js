import { v2 as cloudinary } from "cloudinary";
import fs from "fs";  // file system of node js

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {

    if (!localFilePath) return null;  // if file path is empty 

     //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has beeen uploaded succesfully
    //console.log("File is uploaded on cloudinary", response.url);

    fs.unlinkSync(localFilePath)  // eta korle vs code file e image gulo asbe na 
    return response;

  } catch (error) {

    fs.unlinkSync(localFilePath); // remove loccaly saved temporary file as the upload operation  got failed

    return null;
  }
};

export { uploadOnCloudinary };
