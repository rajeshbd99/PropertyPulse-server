const express = require("express");
const cors = require("cors");
require("dotenv").config();
const Stripe = require("stripe");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const admin = require("firebase-admin");
const serviceAccount = require('./config/real-estate-platform-653cf-firebase-adminsdk-3dosc-3be90f05f3.json');
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI and client setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.b3ce0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database and collections
let database;
let propertiesCollection;
let wishlistCollection;
let userCollection;
let offerCollection;

async function connectToDatabase() {
  try {
    await client.connect();
    database = client.db("propertypulse");
    propertiesCollection = database.collection("properties");
    wishlistCollection = database.collection("wishlist");
    userCollection = database.collection("users");
    offerCollection = database.collection("offers");
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.put("/user", async (req, res) => {
  try {
    const userData = req.body;
    const email = userData.email;
    const options = { upsert: true };
    const query = { email: email };
    const update = { $set: req.body };
    const result = await userCollection.updateOne(query, update, options);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update user" });
  }
});

app.get("/user-role/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const query = { email: email };
    const user = await userCollection.findOne(query);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send({ role: user.role ? user.role : "user" });
  } catch (error) {
    res.status(500).send({ error: "Failed to get user role" });
  }
});

//get all users
app.get("/get-all-users", async (req, res) => {
  try {
    const users = await userCollection.find({}).toArray();
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: "Failed to get users" });
  }
});

//Make Admin
app.patch("/make-admin/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const update = { $set: { role: "admin" } };
    const result = await userCollection.updateOne(query, update);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to make admin" });
  }
});

//check admin
app.get("/check-admin/:email", async (req, res) => {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(403).send({ error: "Forbidden access" });
    }
    const query = { email: email, role: "admin" };
    const isAdmin = await userCollection.findOne(query);
    res.send({ admin: true });
  } catch (error) {
    res.status(500).send({ error: "Failed to get admin" });
  }
});

//manage all users
app.get("/users", async (req, res) => {
  try {
    const users = await userCollection.find({}).toArray();
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: "Failed to get users" });
  }
});

//mark as fraud
app.put("/users/mark-fraud/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const update = { $set: { fraud: true } };
    const result = await userCollection.updateOne(query, update, {
      upsert: true,
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to mark as fraud" });
  }
});

//delete fraud user properties
app.delete("/properties/agent/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const query = { agentEmail: email };
    const result = await propertiesCollection.deleteMany(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to delete fraud user properties" });
  }
});

//make agent
app.put("/users/make-agent/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const update = { $set: { role: "agent" } };
    const result = await userCollection.updateOne(query, update, {
      upsert: true,
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to make agent" });
  }
});

//make admin
app.put("/users/make-admin/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const update = { $set: { role: "admin" } };
    const result = await userCollection.updateOne(query, update, {
      upsert: true,
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to make admin" });
  }
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//delete user
app.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id; 
       const query = { uid: id }; 
    const result = await userCollection.deleteOne(query);
    res.send(result);
    await admin.auth().deleteUser(id);

  } catch (error) {
    res.status(500).send({ error: "Failed to delete user" });
  }
});

//update advertise property
app.put("/properties/advertise/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const update = { $set: {advertise : true} };
    const result = await propertiesCollection.updateOne(query, update, {upsert: true});
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: "Failed to update property" });
  }
});

//get advertise properties
app.get("/advertise-properties", async (req, res) => {
  try {
    const query = { advertise: true };
    const result = await propertiesCollection.find(query).toArray();

    res.send(result
    );
  } catch (error) {
    res.status(500).send({ error: "Failed to get properties" });
  }
});


/**
 * Route: GET /properties
 * Description: Fetch all verified properties
 */
app.get("/properties", async (req, res) => {
  try {
    const verifiedProperties = await propertiesCollection
      .find({ verificationStatus: "verified" })
      .toArray();
    res.json(verifiedProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: POST /property
 * Description: Add a new property
 */
app.get("/my-properties/:email", async (req, res) => {
  const email = req.params.email;
  const result = await propertiesCollection
    .find({ agentEmail: email })
    .toArray();
  res.send(result);
});
app.post("/properties/add", async (req, res) => {
  const property = req.body;
  try {
    const result = await propertiesCollection.insertOne(property);
    res.send(result);
  } catch (error) {
    console.error("Error adding property:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Update property
app.get("/properties/details/:id", async (req, res) => {
  const id = req.params.id;
  const result = await propertiesCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.patch("/properties/update/:id", async (req, res) => {
  const id = req.params.id;
  const property = req.body;
  const result = await propertiesCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        propertyTitle: property.propertyTitle,
        location: property.location,
        priceRange: property.priceRange,
        agentEmail: property.agentEmail,
        verificationStatus: property.verificationStatus,
        agentName: property.agentName,
        image: property.image,
      },
    }
  );
  res.send(result);
});

app.delete("/properties/delete/:id", async (req, res) => {
  const id = req.params.id;
  const result = await propertiesCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

/**
 * Route: PATCH /property/:id/verify
 * Description: Verify a property
 */
app.patch("/properties/verify/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { verificationStatus: "verified" } }
    );
    res.send(result);
  } catch (error) {
    console.error("Error verifying property:", error);
    res.status(500).send("Internal Server Error");
  }
});

//fetch all properties
app.get("/all-properties", async (req, res) => {
  const result = await propertiesCollection.find({}).toArray();
  res.send(result);
});

/**
 * Route: PATCH /property/:id/reject
 * Description: Reject a property
 */
app.patch("/properties/reject/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { verificationStatus: "rejected" } }
    );
    res.send(result);
  } catch (error) {
    console.error("Error verifying property:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: GET /property/:id
 * Description: Fetch property details by ID
 */
app.get("/property/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (property) {
      res.json({
        ...property,
        priceRange: property.priceRange || { min: 0, max: Infinity },
      });
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error) {
    console.error("Error fetching property details:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: GET /property/:id/reviews
 * Description: Fetch all reviews for a specific property
 */
app.get("/property/:id/reviews", async (req, res) => {
  const { id } = req.params;
  try {
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (property) {
      res.json(property.reviews || []);
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: POST /property/:id/review
 * Description: Add a review to a specific property
 */
app.post("/property/:id/review", async (req, res) => {
  const { id } = req.params;
  const { review, reviewerName } = req.body;
  const newReview = { review, reviewerName, createdAt: new Date() };

  try {
    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { reviews: newReview } }
    );
    if (result.modifiedCount > 0) {
      res.json({ message: "Review added successfully!" });
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: GET /wishlist/:userId
 * Description: Fetch all wishlist items for a specific user
 */
app.get("/wishlist/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const wishlist = await wishlistCollection.find({ userId }).toArray();
    res.json(wishlist || []);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: POST /wishlist
 * Description: Add a property to the wishlist
 */
app.post("/wishlist", async (req, res) => {
  const wishlistItem = req.body;
  if (!wishlistItem.userId || !wishlistItem.propertyId) {
    return res.status(400).json({ message: "Invalid data format" });
  }
  try {
    const result = await wishlistCollection.insertOne(wishlistItem);
    res.json({
      message: "Property added to wishlist!",
      wishlistId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * Route: DELETE /wishlist/:id
 * Description: Remove a property from the wishlist
 */
app.delete("/wishlist/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await wishlistCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: POST /make-offer
// Description: Save an offer made by a user
app.post("/make-offer/:id", async (req, res) => {
  const offerDetails = req.body;
  const userId = offerDetails.userId;
  const id = req.params.id;
  const updateWislist = await wishlistCollection.updateOne({
    userId: userId,
    _id: new ObjectId(id),
  }, { $set: { offerStatus: "pending" } }, { upsert: true });
  if (updateWislist.modifiedCount > 0) {
    const result = await offerCollection.insertOne(offerDetails);
    res.send(result);
  } else {  
    res.status(404).json({ message: "Wishlist item not found" });
  }
});

// Route: PATCH /offer/:id/accept
// Description: Accept the offer made by a user (agent updates the offer status)
app.patch("/offer/:id/accept", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await offerDetails.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "accepted" } }
    );
    if (result.modifiedCount > 0) {
      res.json({ message: "Offer accepted successfully!" });
    } else {
      res.status(404).json({ message: "Offer not found" });
    }
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: PATCH /offer/:id/bought
// Description: Update the offer status to 'bought' after payment is completed
app.patch("/offer/:id/bought", async (req, res) => {
  const { id } = req.params;
  const { transactionId } = req.body; // Payment transaction ID

  try {
    const result = await offerDetails.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "bought", transactionId } }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: "Payment successful, offer marked as bought!" });
    } else {
      res.status(404).json({ message: "Offer not found" });
    }
  } catch (error) {
    console.error("Error updating offer to bought:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: POST /payment-success
// Description: Handle successful payment and update the offer status
app.post("/payment-success", async (req, res) => {
  const { offerId, transactionId } = req.body;

  try {
    const result = await offerDetails.updateOne(
      { _id: new ObjectId(offerId) },
      { $set: { status: "bought", transactionId } }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: "Payment processed successfully!" });
    } else {
      res.status(404).json({ message: "Offer not found" });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start server and connect to MongoDB
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server is running on port ${port}`);
});
