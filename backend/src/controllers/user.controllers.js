import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessTokenAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        if(!user) throw new ApiError(404, "User not Found");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return{accessToken, refreshToken}

    } catch (error) {
        throw new ApiError (500, "Something went wrong while generating refresh token and access token");
    }
}

const registerUser = asyncHandler (async (req, res) => {
    const { username, email, password } = req.body;

    if (
        [username, email, password].some((Field) => Field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{email}],
    });

    if(existingUser) {
        throw new ApiError(409, "User already exits");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avtar file is required local path");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);


    // user creation and database entry

    const user = await User.create({
        username,
        avatar: avatar?.url || "",
        email,
        password
    });

    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createUser) {
        throw new ApiError(500, "Something went wrong - While regestring the user");
    }

    return res 
    .status(201)
    .json(new ApiResponse(200, createUser, "user registresd successfully") )
});

const loginUser = asyncHandler( async(req, res) => {
    const { email, username, password} = req.body;

    if(!email){
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({email});

    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {refreshToken, accessToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        // secure: true
         secure: process.env.NODE_ENV === "production", // false on localhost
         sameSite: "Strict", // Optional but recommended
    }

   

    return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
      },
      "User logged in successfully"
    )
  );

})


const logoutUser = asyncHandler( async(req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    });
    return res
    .status(200)
    .json(
        new ApiError(
            200, 
            null,
            "User logged out sucessfully"
        )
    );
});

const getProfile = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Profile fetched successfully"))
});

const avatarUpload = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.path;
    if(!avatarLocalPath) throw new ApiError(400, "Please upload an avatar image");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar?.url || !avatar?.public_id)
        throw new ApiError(500, "Failed to upload avatar image");

    const user = await User.findById(req.user?._id).select("-password -refreshToken");
    if(!user) throw new ApiError(400, "User not found");

    //Delete old image from Cloudinary if exits

    if(user.avatar?.public_id){
        await deleteFromCloudinary(user.avatar.public_id);
    }

    user.avatar = {
        url: avatar.url,
        public_id: avatar.public_id,
    };

    await user.save({validateBeforeSave: flase});

    return res 
    .status(200)
    .json(new ApiResponse(200, user, "Avatar uploaded sucessfully"));
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    if(!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.comparePassword(currentPassword);
    if(!isPasswordValid) throw new ApiError(401, "Current password is incorrect");

    user.password = newPassword;

    await user.save({validateBeforeSave: flase});

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password chnaged successfully"));

})

export { registerUser, loginUser, logoutUser, getProfile, avatarUpload, changeCurrentPassword};