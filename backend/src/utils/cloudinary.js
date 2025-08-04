import fs from "fs";
import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (loaclFilePath) => {
    try {
        if(!loaclFilePath) return null;
        //uplaod file on cloudinary
        const response = await cloudinary.uploader.upload(loaclFilePath, {
            resource_type: "auto"
        })

        fs.unlinkSync(loaclFilePath) // remove local saved file
        return response
    } catch (error) {
        fs.unlinkSync(loaclFilePath) // remove local saved file
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. public id ", publicId);

    } catch (error) {
        console.log("Error deleting from Cloudinary", error);
        return null
    }
}
export {uploadOnCloudinary, deleteFromCloudinary}