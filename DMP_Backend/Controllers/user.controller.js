import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import  jwt  from 'jsonwebtoken';




//.............................................................
//.............This is the Registration controller.............
//.............................................................



const Register = async (req, res, next) => {

    const { fullName, dob, address, userName, email, password } = req.body;

    console.log('This is your req.body : ' ,req.body )
    
    const salt = await bcrypt.genSalt(5);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Your User name is : ", userName);

    try {
        const user = new User({
            fullName,
            dob,
            address,
            userName,
            email,
            password: hashedPassword
        });
        console.log(user),
            await user.save();
        res.status(201).json({
            status: true,
            message: 'User created successfully',
            data: user,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Error creating user',
            err: error,
        });
    }
};

export default Register;




//.............................................................
//.............This is the login controller....................
//.............................................................



export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Create Token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Generated JWT Token:", token);
    // Remove password
    const { password: _, ...userData } = user._doc;

    // ✅ Send token in httpOnly cookie
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      status: true,
      message: `Login successful, welcome ${user.userName}`,
      user: userData,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};


//.............................................................
//.............This is the GetUserById controller..............
//.............................................................






export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params; 
    console.log('your user id in backend after hitting the getuserby id api is : ' ,id)
    const user = await User.findById(id); 

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error retrieving user",
      err: error,
    });
  }
};