const express = require("express");

// this is so that I can use this as a render web service
const app = express();
app.listen(process.env.PORT || 3000, () => {
  console.log("app listening");
});
app.get("/", (req, res) => {
  res.send("OK");
});
let numLogs = 0;

const log = () => {
  console.log("hello I am a logline", Math.random());
  numLogs++;
  if (numLogs % 1000 === 0) console.log("NUM LOGLINES", numLogs);
  log();
};

log();
