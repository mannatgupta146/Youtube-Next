import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const videoSchema = new mongoose.Schema({

    videoFile:{
        type:String,
        required:true,
        trim:true
    },
    title:{
        type:String,
        required:true
    },

    description:{
        type:String,
        required:true,
        trim:true
    },

    videoUrl:{
        type:String,
        required:true,
        trim:true
    },

    thumbnail:{
        type:String,
        required:true,
    },

    views:{
        type:Number,
        default:0
    },

    duration:{
        type:String,
        required:true
    },

    likes:{
        type:Number,
        default:0
    },

    dislikes:{
        type:Number,
        default:0
    },

    comments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    }],

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},
    {
        timestamps:true
    }

)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video=mongoose.model("Video",videoSchema);
