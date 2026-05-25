import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },

    dob: {
        type: Date,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        requird: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
        trim: true
    }


})

export default mongoose.model('User', userSchema)