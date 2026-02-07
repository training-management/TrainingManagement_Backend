import express from "express";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/",function(req,res){
    res.send("backend is live server")
})
// Routes
app.use("/api/users", userRoutes);

export default app;
