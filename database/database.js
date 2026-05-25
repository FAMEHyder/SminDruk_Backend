import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


const DataBaseConnection = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected To DataBase successfully");
    }
    catch{
        console.log ("something went wrong");
    }
}


mongoose.connection.on('disconnected',()=>{
    console.log("disconnected")
});

export default DataBaseConnection;