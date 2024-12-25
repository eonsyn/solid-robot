const express = require("express");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectdb = require("./config/dbConnect");
const publicRoute = require("./Routes/publicRoutes");
const Film = require("./Models/Film");
const adminRoute = require("./Routes/adminRoute");
const app = express();
const port = 3000;
const corsConfig = {
  origin: ["https://moodyfilm.netlify.app"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
// app.options("",cors(corsConfig));
app.use(cors(corsConfig));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api", publicRoute);
app.use("/admin", adminRoute);

connectdb();
app.get("/", async (req, res) => {
  res.send("server is running ");
});
app.get("/home", async (req, res) => {
  try {
    // Fetch films from the database
    // Only select the fields _id, filmTitle, urlOfThumbnail, and imdbRating
    // Sort by createdAt in descending order to show the newest films first
    const films = await Film.find(
      {},
      "_id filmTitle urlOfThumbnail imdbRating"
    ).sort({ createdAt: -1 });

    // If no films are found, send a 404 response
    if (!films || films.length === 0) {
      return res.status(404).json({ error: "No films found." });
    }

    // If films are found, send them in the response
    res.status(200).json(films);
  } catch (error) {
    // Handle server errors
    console.error("Error fetching films:", error);
    res.status(500).json({ error: "An error occurred while fetching films." });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
