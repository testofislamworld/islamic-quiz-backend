const mongoose = require("mongoose");

mongoose.connect(
  process.env.MONGOURL,
  console.log("database connected successfully 📅📅📅")
);

mongoose.connection.on("connected", () => {
  console.log("mongob connected 👌🏻👌🏻👌🏻");
});
mongoose.connection.on("disconnected", () => {
  console.log("mongodb  disconnected 🔥🔥🔥");
});