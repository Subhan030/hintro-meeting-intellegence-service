import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/User";
import { ApiError } from "../utils/ApiError";

export class AuthService {
  async register(
    email: string,
    password: string
  ) {
    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      throw new ApiError(
        400,
        "DUPLICATE_USER",
        "User with this email already exists"
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
    });

    return user;
  }

  async login(
    email: string,
    password: string
  ) {
    const user =
      await User.findOne({ email });

    if (!user) {
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid credentials"
      );
    }

    const valid =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!valid) {
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid credentials"
      );
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    return token;
  }
}

export const authService =
  new AuthService();