"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("./config");
const http_1 = __importDefault(require("http"));
const routes_1 = require("./routes");
const request_1 = __importDefault(require("./routes/request"));
const rune_1 = __importDefault(require("./routes/rune"));
const rune_controller_1 = require("./controller/rune.controller");
// Swagger UI implementation
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
// Load environment variables from .env file
dotenv_1.default.config();
// Connect to the MongoDB database
(0, config_1.connectMongoDB)();
// Create an instance of the Express application
const app = (0, express_1.default)();
// Set up Cross-Origin Resource Sharing (CORS) options
app.use((0, cors_1.default)());
// Serve static files from the 'public' folder
app.use(express_1.default.static(path_1.default.join(__dirname, "./public")));
// Parse incoming JSON requests using body-parser
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "50mb", extended: true }));
const server = http_1.default.createServer(app);
// Initialize Swgger UI
let swaggerDocument = yamljs_1.default.load("swagger.yaml");
// Define routes for different API endpoints
app.use("/api/sendBTC", routes_1.SendBtcRoute);
app.use("/api/multisig", routes_1.multiSigWalletRoute);
app.use("/api/request", request_1.default);
app.use("/api/rune", rune_1.default);
app.use("/api/test", routes_1.testRoute);
// Swagger endpoint Settings
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, { explorer: true }));
// Define a route to check if the backend server is running
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Working Version Backend Server is Running now!");
}));
server.listen(config_1.PORT, () => {
    console.log(`Server is running on port ${config_1.PORT}`);
});
node_cron_1.default.schedule("*/10 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("running a task every 10 minute");
    yield (0, rune_controller_1.checkTxStatus)();
}));
