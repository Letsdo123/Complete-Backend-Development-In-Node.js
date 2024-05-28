import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// uploading the file from the local url
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });
        console.log("Information about file::",response);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        // The local filepath is already available 
        // but in case there occurs any problem during fileupload then it will unlink the fule from the server
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}