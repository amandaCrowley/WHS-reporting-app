import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); //Load environment variables from .env

const PORT = process.env.PORT || 8000; //Use the PORT environment variable if it's set, otherwise default to 8000
const app = express();

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

    //-----------------------------TESTING Print current users and issues ---
    const users = await db.collection("User").find().toArray();
    console.log("Users in DB:", users);

    const issues = await db.collection("Issue").find().toArray();
    console.log("Issues in DB:", issues);
    //-----------------------------------

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

app.post('/api/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.collection("User").insertOne(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

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
