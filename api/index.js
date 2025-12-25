require("dotenv").config();
require("../config/db_config");
const bodyParser = require("body-parser");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const homePageRoute = require("../routers/index");
const userRoute = require("../routers/userRoutes");
const quizRoute = require("../routers/quizRoutes");
const categoryRoute = require("../routers/categoryRoutes");
const resultRoute = require("../routers/resultRoutes");
const languageRoute = require("../routers/languageRoutes");
const walletRoute = require("../routers/walletRoutes");
const bankAccountRoute = require("../routers/bankAccountRoutes");
const certificateRoute = require("../routers/certificateRoutes");
const progressionRoute = require("../routers/userProgressionRoutes");
const luckyDrawRoute = require("../routers/luckyDrawRoutes");

const cloudinary = require('cloudinary').v2;

const app = express();

// Cloudinary Configuration (make sure you've replaced with your credentials)
cloudinary.config({
    cloud_name: 'dr6vcennd',
    api_key: '274691982799748',
    api_secret: 'qJfZxD_mhW2vxbD3zwUxesovlvw',
  });



app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));








//// ****** DEFINE ALL ROUTES HERE ******** ///////
app.use("/", homePageRoute);
app.use("/api/user", userRoute);
app.use("/api/quiz", quizRoute);
app.use("/api/category", categoryRoute);
app.use("/api/result", resultRoute);
app.use("/api/language", languageRoute);
app.use("/api/wallet", walletRoute);
app.use("/api/bankaccount", bankAccountRoute);
app.use("/api/certificate", certificateRoute);
app.use("/api/progression", progressionRoute);
app.use("/api/luckydraw", luckyDrawRoute);
/////////////////////////////////////////////////






////********** FOR Local Host ******//////////////
const PORT = process.env.PORT || "5001";
app.set("port", PORT);

var server = http.createServer(app);
server.on("listening", () => console.log("APP IS RUNNING ON PORT " + PORT));

server.listen(PORT);


//// for vercel deployment///////
// module.exports = app; // Export the Express app
