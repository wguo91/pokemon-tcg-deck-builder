const express = require("express");
const app = express();
const path = require("path");
app.set("port", process.env.PORT || 3000);

// serve static files
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.listen(app.get("port"), () => {
  console.log("Application listening on port " + app.get("port"));
});
