const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");
const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

//  this will forward any path starts with /api/places/.....  after this anything will be forwarded to placesRoutes.
//  Then its placesRoutes work to check with url endpoint then if exact then do the work else not.
app.use("/api/places", placesRoutes);

app.use("/api/users", usersRoutes);

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zcorqww.mongodb.net/${process.env.DB_NAME}`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log("error in connection .Error is", err);
  });
