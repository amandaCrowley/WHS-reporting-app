import express from 'express';
 
const PORT = process.env.PORT || 8000; //Use the PORT environment variable if it's set, otherwise default to 8000
const app = express();

app.use(express.json()); //Tells our server to parse incoming JSON data in the request body and make it available under req.body

function startServer() {
    app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
}

app.on("error", (error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});

//Start the server and listen on a port
startServer();

