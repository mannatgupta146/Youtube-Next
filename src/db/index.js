import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
            dbName: DB_NAME,
        });
        console.log(`✅ MongoDB connected at: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
    }
};

export default connectDB;
