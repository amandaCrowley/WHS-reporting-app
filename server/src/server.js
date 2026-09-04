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
import { findUserByIdentity } from "./userIdentity.js";
import {
  normalizeAndValidateIssueStatus,
  normalizeIssueStatus,
  validateAdminEligibility,
  VALID_ISSUE_STATUSES,
} from "./issueStatus.js";

dotenv.config(); //Load environment variables from .env

const PORT = process.env.PORT || 8000; //Use the PORT environment variable if it's set, otherwise default to 8000
const app = express(); //Create application using express

//--------------------------- Image helper Functions --------------------------------

//This function helps get the Cloudinary public ID from the image URL - This is used to delete images from Cloudinary when an issue is deleted or an image is removed from an issue
const getCloudinaryPublicId = (imageURL) => {
  const uploadMarker = "/image/upload/";
  const uploadIndex = imageURL.indexOf(uploadMarker);

  if (uploadIndex === -1) return null;

  let assetPath = imageURL.slice(uploadIndex + uploadMarker.length);
  const versionMatch = assetPath.match(/^(?:[^/]+\/)*v\d+\/(.+)$/);

  if (versionMatch) assetPath = versionMatch[1];

  return decodeURIComponent(assetPath).replace(/\.[^/.]+$/, "");
};

//This function uploads an array of files to Cloudinary and returns an array of their secure URLs
const uploadFilesToCloudinary = (files = []) => Promise.all(files.map((file) => (
  new Promise((resolve, reject) => {
    const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    cloudinary.uploader.upload(
      fileBase64,
      { folder: "uon_campus_hazards", resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
  })
)));

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
    const users = await db.collection("User").find().toArray(); //Retrieve all users from the User collection in MongoDB
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

    const user = await db.collection("User").findOne({ firebaseUid }); //Find the user in the database using their firebaseUid

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

/**
 * Allows an administrator to update another user's role or administrator status.
 */
app.put('/api/admin/users/:userId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId } = req.params;
    const { adminFirebaseUid, firstName, lastName, role, isAdmin } = req.body;
    const validRoles = ["Student", "Staff", "Visitor", "Contractor"];

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!adminFirebaseUid) {
      return res.status(400).json({ error: "adminFirebaseUid is required" });
    }

    const requestingAdmin = await db.collection("User").findOne({ //Find user in the database using their firebaseUid and check if they are an admin
      firebaseUid: adminFirebaseUid,
      isAdmin: true,
    });

    if (!requestingAdmin) {
      return res.status(403).json({ error: "Administrator access required" });
    }

    if (isAdmin === false && requestingAdmin._id.toString() === userId) {
      return res.status(400).json({ error: "You cannot remove your own administrator status" });
    }

    const updates = {};

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || firstName.trim().length < 2) {
        return res.status(400).json({ error: "First name must be at least 2 characters" });
      }
      updates.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || lastName.trim().length < 2) {
        return res.status(400).json({ error: "Last name must be at least 2 characters" });
      }
      updates.lastName = lastName.trim();
    }

    if (role !== undefined) {
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
      }
      updates.role = role; // Add role to updates if valid
    }

    if (isAdmin !== undefined) {
      if (typeof isAdmin !== "boolean") {
        return res.status(400).json({ error: "isAdmin must be a boolean" });
      }

      const targetUser = await db.collection("User").findOne({ _id: new ObjectId(userId) });
      const roleToValidate = role ?? targetUser?.role;
      const adminEligibility = validateAdminEligibility({
        routeRole: roleToValidate,
        requestIsAdmin: isAdmin,
      });

      if (!adminEligibility.valid) {
        return res.status(400).json({ error: adminEligibility.error });
      }

      if (!isAdmin) {
        const adminCount = await db.collection("User").countDocuments({ isAdmin: true });

        // Make sure we don't remove the last admin from the system
        if (targetUser?.isAdmin && adminCount <= 1) {
          return res.status(400).json({ error: "The final administrator cannot be removed" });
        }
      }

      updates.isAdmin = isAdmin; // Add isAdmin to updates if valid
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No user fields to update" });
    }

    const updatedUser = await db.collection("User").findOneAndUpdate( //Update the user in the database using their ObjectId and return the updated document
      { _id: new ObjectId(userId) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Failed to update managed user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});


// --------------------- ISSUE ROUTES --------------------------------------

/*
* Add a new issue to the MongoDB database using the logged in user's userID - We may change this later to enable adding an issue without being logged in
* userID is a URL parameter
*/
app.post('/api/issue/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { campus, title, location, issueDescription, witnessNames, dateTimeIssueOccurred, imageURLs } = req.body;
    const { firebaseUid } = req.params;

    if (!firebaseUid) {
      return res.status(400).json({ error: "Firebase UID is required" });
    }

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

    const userExists = await findUserByIdentity(db, firebaseUid);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();

    const newIssue = {
      campus,
      title,
      location,
      issueDescription,
      assignedTo: null,
      dateTimeReported: now,
      dateTimeIssueOccurred: dateTimeIssueOccurred ? new Date(dateTimeIssueOccurred) : now,
      reportedBy: userExists._id,
      reportedByName: `${userExists.firstName} ${userExists.lastName}`,
      status: "Open",
      priority: "Medium",
      witnessNames: witnessNames || [],
      imageURLs: imageURLs || [],
    };

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

    const user = await findUserByIdentity(db, firebaseUid);
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

// Add the current assignee's display name without storing duplicate data in Issue documents
const issueWithAssigneeName = (db, query, limit) => {
  const pipeline = [
    { $match: query },
    { $sort: { dateTimeReported: -1 } },
  ];

  if (limit) pipeline.push({ $limit: limit });

  // Join the user and issue collections to get the assigned user's name for each issue. 
  // This uses a $lookup stage to perform a left outer join on the User collection, matching the assignedTo field in the Issue collection with the _id field in the User collection. 
  // The result is stored in an array called assignee. Then, it uses a $set stage to create a new field called assignedToName, which contains the full name of the assigned user 
  // if they exist, or "Unassigned" if there is no assigned user. Finally, it uses a $project stage to remove the assignee array from the final output.
  pipeline.push(
    {
      $lookup: {
        from: "User",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignee",
      },
    },
    {
      $set: {
        assignedToName: {
          $cond: [
            { $eq: [{ $size: "$assignee" }, 0] },
            { $cond: [{ $eq: ["$assignedTo", null] }, "Unassigned", "Assigned admin"] },
            {
              $let: {
                vars: { matchedAssignee: { $arrayElemAt: ["$assignee", 0] } },
                in: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ["$$matchedAssignee.firstName", ""] },
                        " ",
                        { $ifNull: ["$$matchedAssignee.lastName", ""] },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
    { $project: { assignee: 0 } },
  );

  return db.collection("Issue").aggregate(pipeline).toArray();
};

const getIssueComments = (db, issueId) => db.collection("IssueComments")
  .find({ issueId })
  .sort({ dateTimeCommented: 1 })
  .toArray();

app.post('/api/issues/:id/comments', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { firebaseUid, comment } = req.body || {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    const trimmedComment = typeof comment === "string" ? comment.trim() : "";
    if (!trimmedComment || trimmedComment.length > 300) {
      return res.status(400).json({ error: "Comment must be between 1 and 300 characters" });
    }

    const admin = await findUserByIdentity(db, firebaseUid);
    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!admin.isAdmin) {
      return res.status(403).json({ error: "Only admins can add comments" });
    }

    const issueId = new ObjectId(id);
    const issue = await db.collection("Issue").findOne({ _id: issueId }, { projection: { _id: 1 } });
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const commentedByName = `${admin.firstName || ""} ${admin.lastName || ""}`.trim();
    const newComment = {
      issueId,
      commentedBy: admin._id,
      commentedByName,
      comment: trimmedComment,
      dateTimeCommented: new Date(),
    };

    const result = await db.collection("IssueComments").insertOne(newComment);
    res.status(201).json({ ...newComment, _id: result.insertedId });
  } catch (err) {
    console.error("Failed to add issue comment:", err);
    res.status(500).json({ error: "Failed to add issue comment" });
  }
});

/**
 * Get all issues in the system for admin management - This route is used to populate the "All Issues" section of the admin dashboard. It retrieves all issues from the MongoDB database and sorts them by dateTimeReported in descending order (most recent first).
 */
app.get('/api/issues', async (req, res) => {
  try {
    const db = req.app.locals.db;

    const issues = await issueWithAssigneeName(db, {});

    res.json(issues);
  } catch (err) {
    console.error("Failed to fetch all issues:", err);
    res.status(500).json({ error: "Failed to fetch all issues" });
  }
});

/**
 * Get the issue data required by the admin dashboard.
 */
app.get('/api/admin/dashboard/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid } = req.params;
    const user = await db.collection("User").findOne({ firebaseUid }); //get the user using their firebase ID

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: "Administrator access required" });
    }

    const issueCollection = db.collection("Issue"); // Get the Issue collection from the database

    // Helper function to get issues for the dashboard with optional limit (This is used to get the 5 most recent unassigned issues)
    const getDashboardIssues = (query, limit) => { 
      const pipeline = [
        { $match: query },
        { $sort: { dateTimeReported: -1 } },
      ];


      if (limit) pipeline.push({ $limit: limit }); 

      //This pipeline joins the Issue collection with the User collection to get the assigned user's name for each issue. It uses a $lookup stage to perform a left outer join on the User collection, matching the assignedTo field in the Issue collection with the _id field in the User collection. The result is stored in an array called assignee. Then, it uses a $set stage to create a new field called assignedToName, which contains the full name of the assigned user if they exist, or "Unassigned" if there is no assigned user. Finally, it uses a $project stage to remove the assignee array from the final output.
      pipeline.push(
        {
          $lookup: {
            from: "User",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignee",
          },
        },
        {
          // Create a new field assignedToName based on the assignee array
          $set: {
            assignedToName: {

              // If there is no assignee, check if assignedTo is null. If so, return "Unassigned". If assignedTo is not null, return "Assigned admin". If there is an assignee, concatenate their first and last name.
              $cond: [
                { $eq: [{ $size: "$assignee" }, 0] }, 
                { $cond: [{ $eq: ["$assignedTo", null] }, "Unassigned", "Assigned admin"] },
                {
                  // Define a variable for the matched assignee
                  $let: { 
                    vars: { matchedAssignee: { $arrayElemAt: ["$assignee", 0] } }, // Get the first (and only) matched assignee
                    in: {
                      $trim: {
                        input: {
                          $concat: [ // Concatenate first and last name with a space in between
                            { $ifNull: ["$$matchedAssignee.firstName", ""] }, 
                            " ",
                            { $ifNull: ["$$matchedAssignee.lastName", ""] },
                          ],
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        { $project: { assignee: 0 } }, // Remove the assignee array from the final output
      );

      return issueCollection.aggregate(pipeline).toArray(); //Return the result of the joined query as an array of issues with the assigned user's name included
    };

    //Get the total number of issues, as well as counts for each status and assignment type, and retrieve the assigned issues and recent unassigned issues for the dashboard
    const [total, open, inProgress, closed, unassigned, assignedToMe, assignedIssues, recentIssues] =
      await Promise.all([
        issueCollection.countDocuments(),
        issueCollection.countDocuments({ status: "Open" }),
        issueCollection.countDocuments({ status: "In Progress" }),
        issueCollection.countDocuments({ status: "Closed" }),
        issueCollection.countDocuments({ assignedTo: null }),
        issueCollection.countDocuments({ assignedTo: user._id }),
        getDashboardIssues({ assignedTo: user._id }),
        getDashboardIssues({ assignedTo: null }, 5), // Get the 5 most recent unassigned issues
      ]);

    //Return the dashboard data as a JSON response
    res.json({
      stats: { total, open, inProgress, closed, unassigned, assignedToMe },
      assignedIssues,
      recentIssues,
    });
  } catch (err) {
    console.error("Failed to fetch admin dashboard data:", err);
    res.status(500).json({ error: "Failed to fetch admin dashboard data" });
  }
});

/**
 * Allows an admin user to assign an issue to themselves
 */
app.put('/api/issues/:id/assign', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: "firebaseUid is required" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    const user = await db.collection("User").findOne({ firebaseUid }); // Retrieve the admin user from the database using the provided Firebase UID
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const issue = await db.collection("Issue").findOne({ _id: new ObjectId(id) }); // Retrieve the issue from the database using the provided issue ID if it exists
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const result = await db.collection("Issue").findOneAndUpdate( // Update the issue in MongoDB to assign it to the admin user and return the updated document
      { _id: new ObjectId(id) },
      { $set: { assignedTo: user._id } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const enrichedIssues = await issueWithAssigneeName(db, { _id: result._id }, 1);
    const issueComments = await getIssueComments(db, result._id);
    res.json({ ...enrichedIssues[0], issueComments });
  } catch (err) {
    console.error("Failed to assign issue:", err);
    res.status(500).json({ error: "Failed to assign issue" });
  }
});

/**
 * Allows an admin user to clear the admin assignment on an issue
 */
app.put('/api/issues/:id/unassign', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    const issue = await db.collection("Issue").findOne({ _id: new ObjectId(id) }); // Retrieve the issue from the database using the provided issue ID if it exists
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const result = await db.collection("Issue").findOneAndUpdate( // Update the issue in MongoDB to clear the assignment by setting assignedTo to null and return the updated document
      { _id: new ObjectId(id) },
      { $set: { assignedTo: null } }, //Change it back to null to clear the assignment
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const enrichedIssues = await issueWithAssigneeName(db, { _id: result._id }, 1);
    const issueComments = await getIssueComments(db, result._id);
    res.json({ ...enrichedIssues[0], issueComments });
  } catch (err) {
    console.error("Failed to unassign issue:", err);
    res.status(500).json({ error: "Failed to unassign issue" });
  }
});

/**
 * This route retrieves a single issue with a matching IssueID
 */
app.get('/api/issues/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const issues = await issueWithAssigneeName(db, { _id: new ObjectId(id) }, 1); // Convert string ID to ObjectId and find matching issue

    if (issues.length === 0)
      return res.status(404).json({ error: "Issue not found" });

    const issueComments = await getIssueComments(db, new ObjectId(id));
    res.json({ ...issues[0], issueComments }); //Send back the issue and its comments

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issue" });
  }
});

/**
* This route allows updating an issue (e.g. description, location, etc.)
*/
app.put('/api/issues/:id', upload.array("images", 5), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const body = req.body || {};

    const parseArrayField = (value) => {
      if (value === undefined) return undefined;
      if (Array.isArray(value)) return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    // Fields that are allowed to be updated
    const {
      title,
      issueDescription,
      location,
      campus,
      status,
      priority,
    } = body;
    const witnessNames = parseArrayField(body.witnessNames);
    const imageURLs = parseArrayField(body.imageURLs ?? body.imageURL);

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
    if (priority !== undefined) {
      const validPriorities = ["Low", "Medium", "High", "Critical"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: "Priority must be Low, Medium, High, or Critical" });
      }
      updateFields.priority = priority;
    }
    if (status !== undefined) {
      const validation = normalizeAndValidateIssueStatus(status);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      updateFields.status = validation.normalizedStatus;
    }
    if (witnessNames !== undefined) updateFields.witnessNames = witnessNames;
    const issue = await db.collection("Issue").findOne({ _id: new ObjectId(id) }); // Retrieve the issue from the database if it exists

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    if (updateFields.status === "Closed") {
      const commentCount = await db.collection("IssueComments").countDocuments({
        issueId: new ObjectId(id),
        comment: { $type: "string", $regex: /\S/ },
      });
      if (commentCount === 0) {
        return res.status(400).json({
          error: "Add at least one progress or resolution comment before closing this issue",
        });
      }
    }

    const retainedImageURLs = imageURLs ?? issue.imageURLs ?? []; // Use the provided imageURLs or fallback to existing ones

    if (!Array.isArray(retainedImageURLs)) {
      return res.status(400).json({ error: "imageURLs must be an array" });
    }

    if (retainedImageURLs.length + (req.files?.length || 0) > 5) { //Only allow a maximum of 5 images to be associated with an issue
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }

    const uploadedImageURLs = await uploadFilesToCloudinary(req.files);     // Upload new images to Cloudinary and get their URLs
    const updatedImageURLs = [...retainedImageURLs, ...uploadedImageURLs];  // Combine retained and newly uploaded image URLs
    updateFields.imageURLs = updatedImageURLs;                              // Update the imageURLs field in the issue document

    const removedImageURLs = (issue.imageURLs || []) //Get the existing image URLs from the issue and filter out the ones that are retained, leaving only the removed ones
      .filter((existingImageURL) => !retainedImageURLs.includes(existingImageURL));

    const result = await db.collection("Issue").findOneAndUpdate( //Update the issue in mongoDB with the new fields and return the updated MongoDB document
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Remove images from Cloudinary that are no longer associated with the issue
    for (const imageURL of removedImageURLs) {
      const publicId = getCloudinaryPublicId(imageURL);

      if (!publicId) {
        console.error(`Unable to remove invalid Cloudinary image URL: ${imageURL}`);
        continue;
      }

      // Remove the image from Cloudinary using the public ID
      const cloudinaryResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image"
      });

      if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
        console.error(`Failed to remove image from Cloudinary: ${imageURL}`);
      }
    }

    const enrichedIssues = await issueWithAssigneeName(db, { _id: result._id }, 1);
    const issueComments = await getIssueComments(db, result._id);
    res.json({ ...enrichedIssues[0], issueComments });

  } catch (err) {
    console.error("Failed to update issue:", err);
    res.status(500).json({ error: "Failed to update issue" });
  }
});

//--------------------- IMAGE ROUTES ----------------------------
// This route allows a user to remove an image from an issue. It takes the issue ID as a URL parameter and the image URL to be removed in the request body. 
// The route first checks if the issue exists and if the image URL is associated with that issue. 
// If both checks pass, it removes the image from Cloudinary and updates the issue document in MongoDB to remove the image URL from the imageURLs array.
app.delete('/api/issues/:id/images', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { imageURL } = req.body;

    if (!ObjectId.isValid(id) || !imageURL) {
      return res.status(400).json({ error: "Invalid issue ID or image URL" });
    }

    const issue = await db.collection("Issue").findOne({ //Retrieve the issue from the database if it exists and check if the image's imageURL is in the stored issue's imageURLs array
      _id: new ObjectId(id),
      imageURLs: imageURL 
    });

    if (!issue) {
      return res.status(404).json({ error: "Issue or image not found" });
    }

    const publicId = getCloudinaryPublicId(imageURL); //Extract the public ID from the Cloudinary image URL to identify the image in Cloudinary for deletion

    if (!publicId) {
      return res.status(400).json({ error: "Invalid Cloudinary image URL" });
    }

    const cloudinaryResult = await cloudinary.uploader.destroy(publicId, { //Remove the image from Cloudinary using the public ID
      resource_type: "image"
    });

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
      return res.status(502).json({ error: "Failed to remove image from Cloudinary" });
    }

    //update the issue document in MongoDB to remove the image URL from the imageURLs array
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

    // 1. Check that files are actually present
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files were uploaded." });
    }

    // 2. Loop through all file buffers processed by Multer and prepare Cloudinary promises
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {

        // Create a data URI base64 string from the memory storage buffer
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

