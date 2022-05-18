const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// use middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xwity.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const storeCollection = client.db("computer-warehouse").collection("store");
        app.get("/inventory", async (req, res) => {
            const query = {};
            const cursor = storeCollection.find(query);
            const stores = await cursor.toArray();
            res.send(stores);
        })

        app.get("/inventory/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const store = await storeCollection.findOne(query);
            res.send(store);
        })
    }
    finally {

    }
}

run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("Running my computer warehouse");
});
app.listen(port, () => {
    console.log("Listening my port", port);
});