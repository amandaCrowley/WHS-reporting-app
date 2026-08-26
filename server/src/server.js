/**
 * server.js
 * 
 * Express server for the WHS reporting App.
 * 
 * Key features:
 * - Connects to MongoDB Atlas
 * - Handles CORS (allows frontend/client pages to talk to this server safely) and JSON request bodies (using req.body, i.e without express.json the req.body would be undefined and we could'nmt recieve JSON requests from the frontend)
 * - Handles file uploads using multer and stores them in Cloudinary
 * - User routes: create user, get all users, get single user by id, update user last name
 * - Issue routes: fetch all issues for a single user, fetch single issue by ID

 * Author/s: Amanda Foxley
 * Date: 1/4/26
 */

import express from 'express';
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import upload from "./uploadMiddleware.js"; // Middleware for handling file uploads (using multer with memory storage)
import cloudinary from "./cloudinary.js";   // Cloudinary configuration for image storage and management

dotenv.config(); //Load environment variables from .env

const getCloudinaryPublicId = (imageURL) => {
  const uploadMarker = "/image/upload/";
  const uploadIndex = imageURL.indexOf(uploadMarker);

  if (uploadIndex === -1) return null;

  let assetPath = imageURL.slice(uploadIndex + uploadMarker.length);
  const versionMatch = assetPath.match(/^(?:[^/]+\/)*v\d+\/(.+)$/);

  if (versionMatch) assetPath = versionMatch[1];

  return decodeURIComponent(assetPath).replace(/\.[^/.]+$/, "");
};

const PORT = process.env.PORT || 8000; //Use the PORT environment variable if it's set, otherwise default to 8000
const app = express(); //Create application using express

// --------------------------Middleware--------------------------------
app.use(cors());  //Enable CORS to allow requests from the frontend running on a different origin (e.g. http://localhost:5173/)
app.use(express.json()); //Tells our server to parse incoming JSON data in the request body and make it available under req.body

//---------------------------Database setup
const uri = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@ac-gu3hwzr-shard-00-00.1tuxpwj.mongodb.net:27017,ac-gu3hwzr-shard-00-01.1tuxpwj.mongodb.net:27017,ac-gu3hwzr-shard-00-02.1tuxpwj.mongodb.net:27017/?ssl=true&replicaSet=atlas-x07b7f-shard-0&authSource=admin`;

//Create a MongoClient as recommended on MongoDB website
const DBclient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
//----------------------------------------------------------------------

/**
 * Start the Express server and connect to MongoDB
 */
async function startServer() {
  try {
    await DBclient.connect(); // Connect to MongoDB database
    console.log("Connected to MongoDB");

    //Get the database and attach to app.locals
    const db = DBclient.db("WHS_App_DB");
    app.locals.db = db;

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

// ---------------------- USER ROUTES ----------------------

/*
* This route handles the creation of new users (Register page). It expects a JSON body with the following fields:
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

    //Create new user object
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


/**
 * This route retrieves ALL users in the Users collection in MongoDB
 * */
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


/**
 * This route retrieves a single user using their Firebase UID
 */
app.get('/api/user/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid } = req.params;

    const user = await db.collection("User").findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/**
 * This route allows the app to update user's last name - Other profile page fields should stay as they are (Password can be updated seperately using usePasswordReset.js hook)
 **/
app.put('/api/user/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid } = req.params;
    const { lastName } = req.body;

    if (!lastName) {
      return res.status(400).json({ error: "lastName is required" });
    }

    // Use findOneAndUpdate to return the updated document
    const result = await db.collection("User").findOneAndUpdate(
      { firebaseUid }, // match by Firebase UID
      { $set: { lastName } }, // update only lastName
      { returnDocument: "after", upsert: false } // don't create new if not found
    );

    if (!result) {
      // Optional: Instead of returning 404, return current state
      // This avoids errors when UI calls update before fetchUser
      const user = await db.collection("User").findOne({ firebaseUid });
      if (user) {
        return res.json(user); // return existing user data
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    }

    res.json(result); // updated user

  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});


// --------------------- ISSUE ROUTES --------------------------------------

/*
* Add a new issue to the MongoDB database using the logged in user's userID - We may change this later to enable adding an issue without being logged in
* userID is a URL parameter
*/
app.post('/api/issue/:userID', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { campus, title, location, issueDescription, witnessNames, imageURLs } = req.body;
    const { userID } = req.params; //User id passed in using the request parameters and not in the JSON body

    //Validate required fields
    if (!location || !issueDescription || !campus || !title) {
      return res.status(400).json({
        error: "Missing required fields: Location, Issue description, Campus, and Title are required."
      });
    }

    //Validate Campus
    const validCampus = [
      "Callaghan",
      "Ourimbah",
      "Newcastle City",
      "Gosford Hospital",
      "Gosford Mann Street",
      "Sydney",
      "Port Macquarie"
    ];

    if (!campus || !validCampus.includes(campus)) {
      return res.status(400).json({
        error: `Invalid Campus. Must be one of: ${validCampus.join(", ")}`
      });
    }

    //Validate the userID
    if (!ObjectId.isValid(userID)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userObjectId = new ObjectId(userID);

    //CHeck that the userID exists in the user database
    const userExists = await db.collection("User").findOne({ _id: userObjectId }); //Retrieve the user data if they do exist
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();

    //Create new issue object
    const newIssue = {
      campus,
      title,
      location,
      issueDescription,
      assignedTo: null,
      dateTimeReported: now,               //Set the issue's reported date and time to the current date/time
      reportedBy: new ObjectId(userID),    //Must be an objectID
      reportedByName: `${userExists.firstName} ${userExists.lastName}`,   //Store the user's name if they exist or empty string if not
      status: "Open",                      //The issue will start off in an open state
      witnessNames: witnessNames || [],    //This is optional, these names are either passed in the JSON request body or they are empty
      imageURLs: imageURLs || [],             //This is optional as well, a user may choose to attach images to the issue which are stored with an external provider - These are the URL's to the images
    };

    //Insert into MongoDB
    const result = await db.collection("Issue").insertOne(newIssue);

    res.status(201).json({ message: "Issue created successfully", issueId: result.insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create issue" });
  }
});

/**
 * Get all issues for a specific user, has an optional limit (i.e. if limited by 5 then will retrieve the last 5 issues if not limited it will retrun all of them)
 **/
app.get('/api/issues/user/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid } = req.params;

    // Optional query parameter i.e.  ?limit=5  - would be limited to only return 5 issues
    const limit = parseInt(req.query.limit) || 0; // 0 = no limit

    // Find the user in MongoDB first to get their ObjectId
    const user = await db.collection("User").findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is allowed to access these issues (a user can only access their own)
    // if (!issue || issue.reportedBy.toString() !== user._id.toString()) {
    //   return res.status(403).json({ error: "Access denied" });
    // }

    // Find issues reported by this user
    let query = { reportedBy: user._id };
    let cursor = db.collection("Issue")
      .find(query)
      .sort({ "dateTimeReported": -1 }); // latest issues first

    // Check if there is a limit to the number of issues to be returned               
    if (limit > 0) {
      cursor = cursor.limit(limit);
    }

    const issues = await cursor.toArray();
    res.json(issues); //Return the issues

  } catch (err) {
    console.error("Failed to fetch user issues:", err);
    res.status(500).json({ error: "Failed to fetch user issues" });
  }
});

/**
 * This route retrieves a single issue with a matching IssueID
 */
app.get('/api/issues/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const issue = await db.collection("Issue").findOne({ _id: new ObjectId(id) }); // Convert string ID to ObjectId and find matching issue

    if (!issue)
      return res.status(404).json({ error: "Issue not found" });

    res.json(issue); //Send back the issue

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issue" });
  }
});

/**
* This route allows updating an issue (e.g. description, location, etc.)
*/
app.put('/api/issues/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Fields that are allowed to be updated
    const {
      title,
      issueDescription,
      location,
      campus,
      witnessNames,
      imageURLs,
    } = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    // Build update object dynamically (only update provided fields)
    const updateFields = {};

    if (title !== undefined) updateFields.title = title;
    if (issueDescription !== undefined) updateFields.issueDescription = issueDescription;
    if (location !== undefined) updateFields.location = location;
    if (campus !== undefined) updateFields.campus = campus;
    if (witnessNames !== undefined) updateFields.witnessNames = witnessNames;

    if (imageURLs !== undefined) {
      updateFields.imageURLs = imageURLs;
    }

    const result = await db.collection("Issue").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.json(result);

  } catch (err) {
    console.error("Failed to update issue:", err);
    res.status(500).json({ error: "Failed to update issue" });
  }
});

app.delete('/api/issues/:id/images', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { imageURL } = req.body;

    if (!ObjectId.isValid(id) || !imageURL) {
      return res.status(400).json({ error: "Invalid issue ID or image URL" });
    }

    const issue = await db.collection("Issue").findOne({
      _id: new ObjectId(id),
      imageURLs: imageURL
    });

    if (!issue) {
      return res.status(404).json({ error: "Issue or image not found" });
    }

    const publicId = getCloudinaryPublicId(imageURL);

    if (!publicId) {
      return res.status(400).json({ error: "Invalid Cloudinary image URL" });
    }

    const cloudinaryResult = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
      return res.status(502).json({ error: "Failed to remove image from Cloudinary" });
    }

    await db.collection("Issue").updateOne(
      { _id: new ObjectId(id) },
      { $pull: { imageURLs: imageURL } }
    );

    res.json({ message: "Image removed successfully" });
  } catch (err) {
    console.error("Failed to remove issue image:", err);
    res.status(500).json({ error: "Failed to remove issue image" });
  }
});

//This route handles image uploads using multer middleware to process the files and upload them to Cloudinary, then returns the URLs of the uploaded images to the frontend
app.post('/api/upload', upload.array("images", 5), async (req, res) => {
  try {
    // 1. Enforce that files are actually present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files were uploaded." });
    }

    // 2. Loop through all file buffers processed by Multer and prepare Cloudinary promises
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        // Formulate a data URI base64 string from the memory storage buffer
        const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        
        // Execute a secure server-side upload using your configured Cloudinary instance
        cloudinary.uploader.upload(
          fileBase64,
          { 
            folder: "uon_campus_hazards", // Groups student reports into an organized directory
            resource_type: "image"
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url); // Resolve with secure cloud asset string
          }
        );
      });
    });

    // 3. Resolve all async cloud uploads concurrently
    const imageURLs = await Promise.all(uploadPromises);

    // 4. Return the Cloudinary CDN links straight back to the React app to be stored in the MongoDB Issue document as an array of strings
    return res.status(200).json({ imageURLs });

  }catch (err) {
    console.error("Cloudinary upload error:");
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

