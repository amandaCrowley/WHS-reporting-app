import express from 'express';
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); //Load environment variables from .env

const PORT = process.env.PORT || 8000; //Use the PORT environment variable if it's set, otherwise default to 8000
const app = express(); //Create application using express

// Middleware
app.use(cors());  //Enable CORS to allow requests from the frontend running on a different origin (e.g. http://localhost:5173/)
app.use(express.json()); //Tells our server to parse incoming JSON data in the request body and make it available under req.body

const uri = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@ac-gu3hwzr-shard-00-00.1tuxpwj.mongodb.net:27017,ac-gu3hwzr-shard-00-01.1tuxpwj.mongodb.net:27017,ac-gu3hwzr-shard-00-02.1tuxpwj.mongodb.net:27017/?ssl=true&replicaSet=atlas-x07b7f-shard-0&authSource=admin`;

//Create a MongoClient as recommended on MongoDB website
const DBclient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function startServer() {
  try {
    await DBclient.connect(); // Connect to MongoDB database
    console.log("Connected to MongoDB");

    //Get the database and attach to app.locals
    const db = DBclient.db("WHS_App_DB");
    app.locals.db = db;

    // //-----------------------------TESTING Print current users and issues ---
    // const users = await db.collection("User").find().toArray();
    // console.log("Users in DB:", users);

    // const issues = await db.collection("Issue").find().toArray();
    // console.log("Issues in DB:", issues);
    // //-----------------------------------

    //Start Express server using app.listen
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

  } catch (e) {
    console.error("Database connection failed:", e);
    process.exit(1);
  }
}

//Run method to start everything
startServer();

/*
* This route handles the creation of new users. It expects a JSON body with the following fields:
- firebaseUid: The unique identifier for the user from Firebase Authentication.
- firstName: The user's first name. 
- lastName: The user's last name.
- email: The user's email address.
- role: The user's role (e.g. Student, Staff, Visitor, Contractor). This is optional and defaults to "Student" if not provided.
- isAdmin: A boolean indicating whether the user has admin privileges. This is optional and defaults to false if not provided.
* The route validates the required fields and the role, then creates a new user document in the MongoDB "User" collection with the provided information and a createdAt timestamp. 
*/
app.post('/api/user', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid, firstName, lastName, email, role, isAdmin } = req.body;

    //Validate required fields
    if (!firebaseUid || !email || !firstName || !lastName) {
      return res.status(400).json({
        error: "Missing required fields: firebaseUid, email, firstName, lastName are required."
      });
    }

    //Validate role
    const validRoles = ["Student", "Staff", "Visitor", "Contractor"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
      });
    }

    // Check for existing user by email or firebaseUid
    const existingUser = await db.collection("User").findOne({
      $or: [{ email }, { firebaseUid }]
    });

    if (existingUser) {
      return res.status(409).json({
        error: "A user with this email already exists."
      });
    }

    //Prepare new user object
    const newUser = {
      firebaseUid,
      firstName,
      lastName,
      email,
      role: role || "Student",
      isAdmin: isAdmin || false,
    };

    //Insert into MongoDB
    const result = await db.collection("User").insertOne(newUser);

    res.status(201).json({ message: "User created successfully", userId: result.insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

//Testing routes in postman
// --- USERS ROUTES ---
app.get('/api/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.collection("User").find().toArray();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
});

// app.post('/api/users', async (req, res) => {
//   try {
//     const db = req.app.locals.db;
//     const result = await db.collection("User").insertOne(req.body);
//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error creating user");
//   }
// });

// --- ISSUES ROUTES ---
app.get('/api/issues', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const issues = await db.collection("Issue").find().toArray();
    res.json(issues);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching issues");
  }
});

app.post('/api/issues', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.collection("Issue").insertOne(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating issue");
  }
});
