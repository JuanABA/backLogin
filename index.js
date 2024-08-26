const express = require("express");
const cors = require("cors");
const userRoutes = require("./controllers/userController");

const app = express();

app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.use(userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
