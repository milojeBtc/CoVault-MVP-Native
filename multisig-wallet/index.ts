import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import cron from "node-cron";

import { PORT, connectMongoDB } from "./config";
import http from "http";
import {
  SendBtcRoute,
  multiSigWalletRoute,
  testRoute,
} from "./routes";
import requestRouter from "./routes/request";
import runeRoute from "./routes/rune";
import { checkTxStatus } from "./controller/rune.controller";

// Swagger UI implementation
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

// Load environment variables from .env file
dotenv.config();

// Connect to the MongoDB database
connectMongoDB();

// Create an instance of the Express application
const app = express();

// Set up Cross-Origin Resource Sharing (CORS) options
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "./public")));

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const server = http.createServer(app);

// Initialize Swgger UI
let swaggerDocument: any = YAML.load("swagger.yaml");

// Define routes for different API endpoints
app.use("/api/sendBTC", SendBtcRoute);
app.use("/api/multisig", multiSigWalletRoute);
app.use("/api/request", requestRouter);
app.use("/api/rune", runeRoute);
app.use("/api/test", testRoute);

// Swagger endpoint Settings
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true })
);

// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Working Version Backend Server is Running now!");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

cron.schedule("*/10 * * * *", async () => {
  console.log("running a task every 10 minute");
  await checkTxStatus();
});
