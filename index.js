const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || "5000";
const jwt = require("jsonwebtoken");

// dotenv
require("dotenv").config();

// middle wares
app.use(cors());
app.use(express.json());

// Home page
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Connect With MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mzkazhr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  // If user doesn’t have token it will send error
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  // Verify token for invalid, wrong, expired user
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next(); // If you don’t use next() it will not go for next condition
  });
}

async function run() {
  try {
    const serviceCollection = client
      .db("NU-Immigration")
      .collection("services");
    const reviewCollection = client.db("NU-Immigration").collection("reviews");
    const blogCollection = client.db("NU-Immigration").collection("blogs");

    // Create JWT Token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // CREATE (Service)
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    //   READ (Services)
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    //   READ (Three Services)
    app.get("/threeservices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });

    // CREATE (Review)
    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // Read (Review)
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // Read (Review)
    app.get("/myreviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      // If users email doesn’t match searching email it will send error
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "Unauthorized access" });
      }

      let query = {};
      // Make query as dynamically
      if (req.query.email) {
        query = { email: req.query.email };
      }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // DELETE (Review)
    app.delete("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    //   READ (Single Service)
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //   READ (Blogs)
    app.get("/blogs", async (req, res) => {
      const query = {};
      const cursor = blogCollection.find(query);
      const blogs = await cursor.toArray();
      res.send(blogs);
    });
  } catch (error) {
    console.log(error);
  }
}
run();

app.listen(port, () => {
  console.log("Hello World server comes from port: ", port);
});
