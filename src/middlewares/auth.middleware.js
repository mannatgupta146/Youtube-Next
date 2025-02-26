import jwt from 'jsonwebtoken';
import {asyncHandler} from '../middlewares/asyncHandler.middleware.js';
import {ApiErrors} from '../utils/ApiErrors.js';
import {User} from '../models/user.model.js';
import {JWT_SECRET} from '../config.js';


export const verifyJWT= asyncHandler(async(req,_,next)=>{
    try {
        const token= req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ','');
        if(!token){
            throw new ApiErrors(401,'Please authenticate');
        }
        const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select('-password -refreshToken');
        if(!user){
            throw new ApiErrors(401,'Invalid Access Token');
        }       
        req.user=user;
    } catch (error) {
        throw new ApiErrors(401,'Invalid Access Token');
        
    }
    next();
}
)
