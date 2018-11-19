const express = require("express");
const app = express();
const path = require("path");
const port = 3000;

// serve static files
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.listen(port, () => {
  console.log("Application listening on port " + port);
});
