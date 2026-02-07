import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

//  middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//  auth routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

export default app;
