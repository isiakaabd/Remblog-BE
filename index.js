import "express-async-errors";
import express from "express";
import cors from "cors";
import Auth from "./src/routes/auth.js";
import User from "./src/routes/user.js";
import Post from "./src/routes/post.js";
import dotenv from "dotenv";
import helmet from "helmet";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import { connectDB } from "./src/db/index.js";
import errorHandlerMiddleWare from "./src/middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import { authenticationMiddleware } from "./src/middleware/auth.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

const port = process.env.PORT || 2023;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(cors({ credentials: true, origin: "http://localhost:2023" }));
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(limiter);
app.set("trust proxy", 1);
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//routes
app.use("/api/v1", Auth);
app.use("/api/v1", Post);
app.use("/api/v1", authenticationMiddleware, User);

//error handling
app.use(errorHandlerMiddleWare);

// 404 route
app.all("*", (req, res) => {
  res.status(404).json({ message: "RESOURCE NOT FOUND" });
});

const start = async () => {
  try {
    await connectDB();
    app.listen(port, () => console.log(`server listening on port ${port}`));
  } catch (error) {
    console.log(error.message);
  }
};
//
start();
