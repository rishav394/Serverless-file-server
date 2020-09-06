require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { sign_s3, redirect, redirectTo } = require("./amazon.s3");
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.post("/sign_s3", sign_s3);

app.get("/redirect", redirect);
app.get("/redirect/:short", redirectTo);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send(err);
});

module.exports = app;
