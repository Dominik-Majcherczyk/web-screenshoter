const express = require("express");
const path = require("path");
const { takeScreenshots, makeZip, sendEmail } = require("./index");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/", async (req, res) => {
  const { url, email, password, receiverEmail } = req.body;
  try {
    await takeScreenshots(url);
    makeZip(url);
    const message = await sendEmail(url, email, password, receiverEmail);
    res.send(message);
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
