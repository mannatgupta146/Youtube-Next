import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },

    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },

    avatar:{
        type:String,
        required:true,
    },

    coverImage:{
        type:String,
    },

    watchHistory:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },

    password:{
        type:String,
        required:[true,'Password is required'],  
    },

    refreshToken:{
        type:String
    }
},

    {
        timestamps:true
    }
)

userSchema.pre("Save", async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = bcrypt.hash(this.password, 8);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

export const User =  mongoose.model("User", userSchema);