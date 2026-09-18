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
import {
  normalizeIncidentDateTime,
  isIncidentDateTimeValid,
} from "./incidentDateTime.js";
import {
  hashRemoteImage,
  ImageValidationError,
  isImageHash,
  isAllowedImageUrl,
  validateImageFiles,
} from "./imageValidation.js";

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

app.get('/api/admin/users/:userId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await db.collection("User").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
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
 * This route allows the app to update user's first name and last name - Other profile page fields should stay as they are
 **/
app.put('/api/user/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid } = req.params;
    const { firstName, lastName } = req.body;

    // Build update object using only the fields users are allowed to change
    const updates = {};

    // Validate first name if it was provided
    if (firstName !== undefined) {
      if (typeof firstName !== "string" || firstName.trim().length < 2) {
        return res.status(400).json({
          error: "First name must be at least 2 characters"
        });
      }

      updates.firstName = firstName.trim();
    }

    // Validate last name if it was provided
    if (lastName !== undefined) {
      if (typeof lastName !== "string" || lastName.trim().length < 2) {
        return res.status(400).json({
          error: "Last name must be at least 2 characters"
        });
      }

      updates.lastName = lastName.trim();
    }

    // Make sure there is at least one field to update
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No valid profile fields to update"
      });
    }

    // Update only the user's first name and/or last name
    // Email, role, isAdmin and firebaseUid cannot be changed by the user
    const result = await db.collection("User").findOneAndUpdate(
      { firebaseUid },
      { $set: updates },
      { returnDocument: "after", upsert: false }
    );

    if (!result) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(result);

  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({
      error: "Failed to update user"
    });
  }
});

// update user role
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

    if (role !== undefined && role !== "Staff") {
      updates.isAdmin = false;
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

app.delete('/api/admin/users/:userId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { userId } = req.params;
    const { adminFirebaseUid } = req.body;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!adminFirebaseUid) {
      return res.status(400).json({ error: "adminFirebaseUid is required" });
    }

    const requestingAdmin = await db.collection("User").findOne({
      firebaseUid: adminFirebaseUid,
      isAdmin: true,
    });

    if (!requestingAdmin) {
      return res.status(403).json({ error: "Administrator access required" });
    }

    const targetUser = await db.collection("User").findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser.firebaseUid === adminFirebaseUid) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    if (targetUser.isAdmin) {
      const adminCount = await db.collection("User").countDocuments({ isAdmin: true });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "The final administrator cannot be deleted" });
      }
    }

    const result = await db.collection("User").deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Failed to delete managed user:", err);
    res.status(500).json({ error: "Failed to delete user" });
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
    const { campus, title, location, issueDescription, witnessNames, dateTimeIssueOccurred, imageURLs, imageHashes } = req.body;
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
    if (dateTimeIssueOccurred && !isIncidentDateTimeValid(dateTimeIssueOccurred, now)) {
      return res.status(400).json({ error: "Incident date and time cannot be later than the report time." });
    }
    const normalizedIncidentDateTime = normalizeIncidentDateTime(dateTimeIssueOccurred, now);

    const submittedImageURLs = Array.isArray(imageURLs) ? imageURLs : [];
    const submittedImageHashes = Array.isArray(imageHashes) ? imageHashes : [];
    if (submittedImageURLs.length > 5 || submittedImageURLs.length !== submittedImageHashes.length) {
      return res.status(400).json({ error: "Image data is invalid." });
    }
    if (submittedImageURLs.some((imageURL) => !isAllowedImageUrl(imageURL))) {
      return res.status(400).json({ error: "Only trusted Cloudinary image URLs are allowed." });
    }
    if (submittedImageHashes.some((imageHash) => !isImageHash(imageHash))) {
      return res.status(400).json({ error: "Image hashes are invalid." });
    }
    if (new Set(submittedImageHashes).size !== submittedImageHashes.length) {
      return res.status(400).json({ error: "The same image cannot be attached more than once." });
    }

    const newIssue = {
      campus,
      title,
      location,
      issueDescription,
      assignedTo: null,
      isArchived: false,
      dateTimeReported: now,
      dateTimeIssueOccurred: normalizedIncidentDateTime,
      dateTimeIssueClosed: null,
      reportedBy: userExists._id,
      reportedByName: `${userExists.firstName} ${userExists.lastName}`,
      status: "Open",
      priority: "Medium",
      witnessNames: witnessNames || [],
      imageURLs: submittedImageURLs,
      imageHashes: submittedImageHashes,
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
    const issuesWithUnreadMessages = await Promise.all(issues.map(async (issue) => ({
      ...issue,
      unreadMessageCount: await db.collection("Notification").countDocuments({
        issueId: issue._id,
        recipientId: user._id,
        isRead: false,
        type: "NewMessage",
      }),
    })));
    res.json(issuesWithUnreadMessages); //Return the issues

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

const getIssueMessages = (db, issueId) => db.collection("Message")
  .find({ issueId })
  .sort({ createdAt: 1 })
  .toArray();

// Check if the user is a participant in the issue (either reported by or assigned to) or is an admin, all admins have access to all issues and messages
const isIssueParticipant = (issue, user) => (
  issue.reportedBy?.toString() === user?._id?.toString()
  || user?.isAdmin === true
);

const createNotification = async (db, notification) => {
  if (!notification.recipientId) return;

  await db.collection("Notification").insertOne({
    ...notification,
    isRead: false,
    createdAt: new Date(),
  });
};

const createParticipantNotifications = async (db, issue, notification) => {
  const recipientIds = [issue.reportedBy, issue.assignedTo]
    .filter(Boolean)
    .map((recipientId) => recipientId.toString());

  for (const recipientId of [...new Set(recipientIds)]) {
    await createNotification(db, {
      ...notification,
      recipientId: new ObjectId(recipientId),
    });
  }
};

app.get('/api/notifications/:firebaseUid', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await findUserByIdentity(db, req.params.firebaseUid);

    if (!user) return res.status(404).json({ error: "User not found" });

    const notifications = await db.collection("Notification")
      .find({ recipientId: user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    res.json(notifications);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await findUserByIdentity(db, req.body?.firebaseUid);

    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid notification ID" });
    if (!user) return res.status(404).json({ error: "User not found" });

    const result = await db.collection("Notification").updateOne(
      { _id: new ObjectId(req.params.id), recipientId: user._id },
      { $set: { isRead: true } },
    );

    if (!result.matchedCount) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

const getMessageSenderRole = (user) => (
  user.isAdmin ? "Admin" : ["Student", "Staff", "Visitor", "Contractor"].includes(user.role)
    ? user.role
    : "Student"
);

app.get('/api/issues/:id/messages', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const user = await findUserByIdentity(db, req.query.firebaseUid);

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid issue ID" });
    if (!user) return res.status(404).json({ error: "User not found" });

    const issueId = new ObjectId(id);
    const issue = await db.collection("Issue").findOne({ _id: issueId });
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    if (!isIssueParticipant(issue, user)) return res.status(403).json({ error: "Access denied" });

    const messages = await getIssueMessages(db, issueId);
    await db.collection("Message").updateMany(
      { issueId, readBy: { $ne: user._id } },
      { $addToSet: { readBy: user._id } },
    );
    await db.collection("Notification").updateMany(
      { issueId, recipientId: user._id, isRead: false },
      { $set: { isRead: true } },
    );

    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch issue messages:", err);
    res.status(500).json({ error: "Failed to fetch issue messages" });
  }
});

app.post('/api/issues/:id/messages', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { firebaseUid, messageText } = req.body || {};
    const user = await findUserByIdentity(db, firebaseUid);

    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid issue ID" });
    if (!user) return res.status(404).json({ error: "User not found" });

    const trimmedMessage = typeof messageText === "string" ? messageText.trim() : "";
    if (!trimmedMessage || trimmedMessage.length > 1000) {
      return res.status(400).json({ error: "Message must be between 1 and 1000 characters" });
    }

    const issueId = new ObjectId(id);
    const issue = await db.collection("Issue").findOne({ _id: issueId });
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    if (!isIssueParticipant(issue, user)) return res.status(403).json({ error: "Access denied" });

    const senderName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
    const message = {
      issueId,
      senderId: user._id,
      senderName,
      senderRole: getMessageSenderRole(user),
      messageText: trimmedMessage,
      createdAt: new Date(),
      readBy: [user._id],
    };
    const result = await db.collection("Message").insertOne(message);

    if (user.isAdmin) {
      // Notify the issue reporter when an administrator sends a message.
      await createNotification(db, {
        recipientId: issue.reportedBy,
        issueId,
        issueTitle: issue.title,
        messageId: result.insertedId,
        type: "NewMessage",
        title: "New issue message",
        notificationText: `${senderName}: ${trimmedMessage}`.slice(0, 250),
      });
    } else if (issue.assignedTo) {
      // Notify the assigned administrator when the reporter sends a message.
      await createNotification(db, {
        recipientId: issue.assignedTo,
        issueId,
        issueTitle: issue.title,
        messageId: result.insertedId,
        type: "NewMessage",
        title: "New issue message",
        notificationText: `${senderName}: ${trimmedMessage}`.slice(0, 250),
      });
    } else {
      // If the issue has not been assigned, notify all administrators.
      const admins = await db.collection("User").find({
        isAdmin: true,
      }).toArray();

      for (const admin of admins) {
        await createNotification(db, {
          recipientId: admin._id,
          issueId,
          issueTitle: issue.title,
          messageId: result.insertedId,
          type: "NewMessage",
          title: "New issue message",
          notificationText: `${senderName}: ${trimmedMessage}`.slice(0, 250),
        });
      }
    }

    res.status(201).json({ ...message, _id: result.insertedId });
  } catch (err) {
    console.error("Failed to add issue message:", err);
    res.status(500).json({ error: "Failed to add issue message" });
  }
});

/* Add a new comment to an issue. 
* This API route allows an administrator to add a comment to a specific issue.
* The route validates the issue ID, comment length, and admin privileges. 
* 
* It also handles file uploads for attachments (up to 5 files) and validates their types (JPEG, PNG, GIF, WebP images, and PDF files).
* If the comment is valid and the admin has the necessary permissions, the comment is added to the "IssueComments" collection in MongoDB, and any attachments are uploaded to Cloudinary.
*/
app.post('/api/issues/:id/comments', upload.array("attachments", 5), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    const { firebaseUid, comment } = req.body || {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    const trimmedComment =
      typeof comment === "string" ? comment.trim() : "";

    if (!trimmedComment || trimmedComment.length > 300) {
      return res.status(400).json({
        error: "Comment must be between 1 and 300 characters",
      });
    }

    const admin = await findUserByIdentity(db, firebaseUid);

    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!admin.isAdmin) {
      return res.status(403).json({
        error: "Only admins can add comments",
      });
    }

    const issueId = new ObjectId(id);

    const issue = await db.collection("Issue").findOne(
      { _id: issueId },
      { projection: { _id: 1 } }
    );

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Validate the uploaded attachments.
    const files = req.files || [];

    const allowedAttachmentTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    const invalidFile = files.find(
      (file) => !allowedAttachmentTypes.includes(file.mimetype)
    );

    if (invalidFile) {
      return res.status(400).json({
        error:
          "Only JPEG, PNG, GIF, WebP images and PDF files can be attached.",
      });
    }

    // Upload attachments to Cloudinary.
    const attachments =
      files.length > 0
        ? await uploadCommentAttachmentsToCloudinary(files, id)
        : [];

    const commentedByName =
      `${admin.firstName || ""} ${admin.lastName || ""}`.trim();

    const newComment = {
      issueId,
      commentedBy: admin._id,
      commentedByName,
      comment: trimmedComment,
      dateTimeCommented: new Date(),
      attachments,
    };

    const result = await db
      .collection("IssueComments")
      .insertOne(newComment);

    res.status(201).json({
      ...newComment,
      _id: result.insertedId,
    });
  } catch (err) {
    console.error("Failed to add issue comment:", err);

    res.status(500).json({
      error: "Failed to add issue comment",
    });
  }
});
// This function uploads admin comment attachments to Cloudinary.
// Images are stored as image resources and PDFs are stored as raw resources.
const uploadCommentAttachmentsToCloudinary = (files = [], issueId) =>
  Promise.all(
    files.map((file) => (
      new Promise((resolve, reject) => {
        const fileBase64 =
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

        const resourceType = file.mimetype === "application/pdf"
          ? "raw"
          : "image";

        cloudinary.uploader.upload(
          fileBase64,
          {
            folder: `uon_campus_hazards/issues/${issueId}/admin-comments`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                fileName: file.originalname,
                fileType: file.mimetype,
              });
            }
          }
        );
      })
    ))
  );

/**
 * Get all issues in the system for admin management - This route is used to populate the "All Issues" section of the admin dashboard. It retrieves all issues from the MongoDB database and sorts them by dateTimeReported in descending order (most recent first).
 */
app.get('/api/issues', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const admin = req.query.firebaseUid
      ? await findUserByIdentity(db, req.query.firebaseUid)
      : null;

    const issues = await issueWithAssigneeName(db, {});
    const issuesWithUnreadMessages = admin?.isAdmin
      ? await Promise.all(issues.map(async (issue) => ({
        ...issue,
        unreadMessageCount: await db.collection("Notification").countDocuments({
          issueId: issue._id,
          recipientId: admin._id,
          isRead: false,
          type: "NewMessage",
        }),
      })))
      : issues;

    res.json(issuesWithUnreadMessages);
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

    // Get the total number of issues, as well as counts for each status and assignment type,
    // and retrieve the active assigned issues and recent unassigned issues for the dashboard.

    const [total, open, inProgress, closed, unassigned, assignedToMe, assignedIssues, recentIssues] =
      await Promise.all([
        issueCollection.countDocuments(),
        issueCollection.countDocuments({ status: "Open" }),
        issueCollection.countDocuments({ status: "In Progress" }),
        issueCollection.countDocuments({ status: "Closed" }),

        //Only count unassigned issues that are currently active (Open or In Progress)
        issueCollection.countDocuments({
          assignedTo: null,
          status: { $in: ["Open", "In Progress"] },
        }),

        // Count only active issues currently assigned to the logged-in admin.
        issueCollection.countDocuments({
          assignedTo: user._id,
          status: { $in: ["Open", "In Progress"] },
        }),

        // Retrieve only the 5 most recent active issues assigned to the logged-in admin.
        getDashboardIssues(
          {
            assignedTo: user._id,
            status: { $in: ["Open", "In Progress"] },
          },
          5
        ),

        // Get the 5 most recent unassigned issues that are currently active (Open or In Progress) for the dashboard.
        getDashboardIssues(
          {
            assignedTo: null,
            status: { $in: ["Open", "In Progress"] },
          },
          5
        ),
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
    const issueMessages = await getIssueMessages(db, result._id);

    // Notify the issue reporter that an administrator has been assigned to their issue
    await createNotification(db, {
      recipientId: result.reportedBy,
      issueId: result._id,
      issueTitle: result.title,
      type: "IssueAssigned",
      title: result.title,
      notificationText: "An administrator has been assigned to your issue.",
    });

    // Notify the admin who was assigned with a different notification message
    await createNotification(db, {
      recipientId: result.assignedTo,
      issueId: result._id,
      issueTitle: result.title,
      type: "IssueAssigned",
      title: result.title,
      notificationText: "You have been assigned this issue.",
    });

    res.json({ ...enrichedIssues[0], issueComments, issueMessages });
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
    const issueMessages = await getIssueMessages(db, result._id);

    res.json({
      ...enrichedIssues[0],
      issueComments,
      issueMessages,
    });
  } catch (err) {
    console.error("Failed to unassign issue:", err);
    res.status(500).json({ error: "Failed to unassign issue" });
  }
});

/**
 * This route retrieves a single issue with a matching IssueID
 * Normal users will receive the issue without internal admin comments, while administrators will receive the issue along with any internal admin comments associated with it.
 */
app.get('/api/issues/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { firebaseUid } = req.query;

    // Validate the issue ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    const issues = await issueWithAssigneeName(
      db,
      { _id: new ObjectId(id) },
      1
    );

    if (issues.length === 0) {
      return res.status(404).json({ error: "Issue not found" });
    }

    const issue = issues[0];

    // Check whether the requesting user is an administrator
    let requestingUser = null;
    let isAdmin = false;

    if (firebaseUid) {
      requestingUser = await findUserByIdentity(db, firebaseUid);
      isAdmin = requestingUser?.isAdmin === true;
    }

    const issueMessages = requestingUser && isIssueParticipant(issue, requestingUser)
      ? await getIssueMessages(db, new ObjectId(id))
      : [];

    // Only administrators should receive internal admin comments
    if (isAdmin) {
      const issueComments = await getIssueComments(
        db,
        new ObjectId(id)
      );

      return res.json({
        ...issue,
        issueComments,
        issueMessages,
      });
    }

    // Normal users receive the issue without admin comments
    return res.json({
      ...issue,
      issueMessages,
    });

  } catch (err) {
    console.error("Failed to fetch issue:", err);
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
      dateTimeIssueOccurred,
    } = body;
    const witnessNames = parseArrayField(body.witnessNames);
    const imageURLs = parseArrayField(body.imageURLs ?? body.imageURL);

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    const issue = await db.collection("Issue").findOne({ _id: new ObjectId(id) }); // Retrieve the issue from the database if it exists

    if (dateTimeIssueOccurred && !isIncidentDateTimeValid(dateTimeIssueOccurred, new Date())) {
      return res.status(400).json({ error: "Incident date and time cannot be later than the report time." });
    }

    // Build update object dynamically (only update provided fields)
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (issueDescription !== undefined) updateFields.issueDescription = issueDescription;
    if (location !== undefined) updateFields.location = location;
    if (campus !== undefined) updateFields.campus = campus;
    if (dateTimeIssueOccurred !== undefined && dateTimeIssueOccurred !== "") {
      updateFields.dateTimeIssueOccurred = normalizeIncidentDateTime(dateTimeIssueOccurred, issue?.dateTimeIssueOccurred || new Date());
    }
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

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    if (updateFields.status === "Closed") {

      // Check that at least one progress or resolution comment exists
      const commentCount = await db.collection("IssueComments").countDocuments({
        issueId: new ObjectId(id),
        comment: { $type: "string", $regex: /\S/ },
      });

      if (commentCount === 0) {
        return res.status(400).json({
          error: "Add at least one progress or resolution comment before closing this issue",
        });
      }

      // Only record the closing date when the issue is actually being closed
      if (issue.status !== "Closed") {
        updateFields.dateTimeIssueClosed = new Date();
      }

    } else if (updateFields.status !== undefined) {
      // Clear the closing date if a closed issue is reopened
      updateFields.dateTimeIssueClosed = null;
    }

    const retainedImageURLs = imageURLs ?? issue.imageURLs ?? []; // Use the provided imageURLs or fallback to existing ones

    if (!Array.isArray(retainedImageURLs)) {
      return res.status(400).json({ error: "imageURLs must be an array" });
    }

    if (retainedImageURLs.some((imageURL) => !isAllowedImageUrl(imageURL))) {
      return res.status(400).json({ error: "Only trusted Cloudinary image URLs are allowed." });
    }

    const originalImageURLs = issue.imageURLs || [];
    if (retainedImageURLs.some((imageURL) => !originalImageURLs.includes(imageURL))) {
      return res.status(400).json({ error: "An image URL does not belong to this issue." });
    }

    if (retainedImageURLs.length + (req.files?.length || 0) > 5) { //Only allow a maximum of 5 images to be associated with an issue
      return res.status(400).json({ error: "Maximum 5 images allowed" });
    }

    const validatedFiles = await validateImageFiles(req.files);
    const existingImageHashes = await Promise.all(retainedImageURLs.map(async (imageURL) => {
      const existingIndex = originalImageURLs.indexOf(imageURL);
      const storedHash = issue.imageHashes?.[existingIndex];
      return isImageHash(storedHash) ? storedHash : hashRemoteImage(imageURL);
    }));
    const newImageHashes = validatedFiles.map(({ hash }) => hash);
    if (new Set([...existingImageHashes, ...newImageHashes]).size !== existingImageHashes.length + newImageHashes.length) {
      return res.status(400).json({ error: "The same image cannot be attached to an issue more than once." });
    }

    const uploadedImageURLs = await uploadFilesToCloudinary(validatedFiles.map(({ file }) => file));
    const updatedImageURLs = [...retainedImageURLs, ...uploadedImageURLs];
    updateFields.imageURLs = updatedImageURLs;
    updateFields.imageHashes = [...existingImageHashes, ...newImageHashes];

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

    if (status !== undefined && issue.status !== updateFields.status) {
      await createParticipantNotifications(db, result, {
        issueId: result._id,
        issueTitle: result.title,
        type: "StatusUpdated",
        title: "Issue status updated",
        notificationText: `Issue status changed from ${issue.status || "unknown"} to ${updateFields.status}.`,
      });
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
    const issueMessages = await getIssueMessages(db, result._id);

    res.json({ ...enrichedIssues[0], issueComments, issueMessages });

  } catch (err) {
    console.error("Failed to update issue:", err);
    res.status(err instanceof ImageValidationError ? 400 : 500).json({
      error: err instanceof ImageValidationError ? err.message : "Failed to update issue",
    });
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

    const validatedFiles = await validateImageFiles(req.files);

    // Upload only files whose signatures and content hashes passed validation.
    const uploadPromises = validatedFiles.map(({ file }) => {
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
    const imageHashes = validatedFiles.map(({ hash }) => hash);

    // 4. Return the Cloudinary CDN links straight back to the React app to be stored in the MongoDB Issue document as an array of strings
    return res.status(200).json({ imageURLs, imageHashes });

  } catch (err) {
    console.error("Cloudinary upload error:");
    console.error(err);

    res.status(err instanceof ImageValidationError ? 400 : 500).json({
      error: err instanceof ImageValidationError ? err.message : "Image upload failed.",
    });
  }
});

/**
 * Remove a message from an issue conversation.
 *
 * Only administrators can remove messages.
 * Messages are soft-deleted so the record remains in the database.
 */
app.delete('/api/issues/:issueId/messages/:messageId', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { issueId, messageId } = req.params;
    const { firebaseUid } = req.body || {};

    // Find the user making the request.
    const admin = await findUserByIdentity(db, firebaseUid);

    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only administrators can remove messages.
    if (!admin.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Validate the supplied IDs.
    if (!ObjectId.isValid(issueId) || !ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid issue or message ID" });
    }

    const issueObjectId = new ObjectId(issueId);
    const messageObjectId = new ObjectId(messageId);

    // Make sure the issue exists.
    const issue = await db.collection("Issue").findOne({
      _id: issueObjectId,
    });

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Find the message belonging to this issue.
    const message = await db.collection("Message").findOne({
      _id: messageObjectId,
      issueId: issueObjectId,
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Prevent an already removed message from being removed again.
    if (message.isDeleted) {
      return res.status(400).json({ error: "Message has already been removed" });
    }

    // Soft-delete the message.
    await db.collection("Message").updateOne(
      {
        _id: messageObjectId,
        issueId: issueObjectId,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: admin._id,
        },
      }
    );

    res.json({
      message: "Message removed successfully",
    });
  } catch (err) {
    console.error("Failed to remove message:", err);
    res.status(500).json({ error: "Failed to remove message" });
  }
});

/**
 * Allows an administrator to assign an issue to another administrator.
 */
app.put('/api/issues/:id/assign-to', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { firebaseUid, assignedTo } = req.body || {};

    if (!firebaseUid) {
      return res.status(400).json({ error: "firebaseUid is required" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid issue ID" });
    }

    if (!ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ error: "Invalid administrator ID" });
    }

    // Find the administrator making the request.
    const requestingAdmin = await findUserByIdentity(db, firebaseUid);

    if (!requestingAdmin) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!requestingAdmin.isAdmin) {
      return res.status(403).json({ error: "Administrator access required" });
    }

    const issueObjectId = new ObjectId(id);
    const assignedAdminId = new ObjectId(assignedTo);

    // Make sure the issue exists.
    const issue = await db.collection("Issue").findOne({
      _id: issueObjectId,
    });

    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Closed issues cannot be reassigned.
    if (issue.status === "Closed") {
      return res.status(400).json({
        error: "Closed issues cannot be reassigned",
      });
    }

    // Make sure the selected user is actually an administrator.
    const assignedAdmin = await db.collection("User").findOne({
      _id: assignedAdminId,
      isAdmin: true,
    });

    if (!assignedAdmin) {
      return res.status(404).json({
        error: "Selected administrator was not found",
      });
    }

    // Update the issue assignment.
    const result = await db.collection("Issue").findOneAndUpdate(
      { _id: issueObjectId },
      { $set: { assignedTo: assignedAdminId } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Get the updated issue with the administrator's display name.
    const enrichedIssues = await issueWithAssigneeName(
      db,
      { _id: issueObjectId },
      1
    );

    const issueComments = await getIssueComments(db, issueObjectId);
    const issueMessages = await getIssueMessages(db, issueObjectId);

    // Notify the issue reporter.
    await createNotification(db, {
      recipientId: result.reportedBy,
      issueId: result._id,
      issueTitle: result.title,
      type: "IssueAssigned",
      title: result.title,
      notificationText: "An administrator has been assigned to your issue.",
    });

    // Notify the administrator who received the assignment.
    await createNotification(db, {
      recipientId: result.assignedTo,
      issueId: result._id,
      issueTitle: result.title,
      type: "IssueAssigned",
      title: result.title,
      notificationText: "You have been assigned this issue.",
    });

    res.json({
      ...enrichedIssues[0],
      issueComments,
      issueMessages,
    });
  } catch (err) {
    console.error("Failed to assign issue to administrator:", err);
    res.status(500).json({
      error: "Failed to assign issue to administrator",
    });
  }
});

/**
  * Search for administrators who can be assigned to an issue.
  * Only users with isAdmin set to true are returned.
  * The optional search parameter matches first name, last name, or email.
  */
app.get('/api/admin/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { firebaseUid, search = "" } = req.query;

    // Verify that the requesting user is an administrator.
    const requestingAdmin = await findUserByIdentity(db, firebaseUid);

    if (!requestingAdmin) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!requestingAdmin.isAdmin) {
      return res.status(403).json({ error: "Administrator access required" });
    }

    const trimmedSearch = search.trim();

    const query = {
      isAdmin: true,
    };

    // Only apply the search filter when the user has entered something.
    if (trimmedSearch) {
      const searchRegex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    const admins = await db.collection("User")
      .find(query, {
        projection: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
        },
      })
      .sort({ firstName: 1, lastName: 1 })
      .limit(20)
      .toArray();

    res.json(admins);
  } catch (err) {
    console.error("Failed to search administrators:", err);
    res.status(500).json({ error: "Failed to search administrators" });
  }
});
