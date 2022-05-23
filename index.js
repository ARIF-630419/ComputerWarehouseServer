const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// use middleware 
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xwity.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const storeCollection = client.db("computer-warehouse").collection("store");
        const myCollection = client.db("computer-warehouse").collection("MyItems");

        // AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        // inventory app 
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

        // POST
        app.post('/inventory', async (req, res) => {
            const newInventory = req.body;
            const result = await storeCollection.insertOne(newInventory);
            res.send(result);
        });

        // DELETE
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await storeCollection.deleteOne(query);
            res.send(result);
        });

        // my Collection api
        app.get("/MyItems", verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = myCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }

        })
        app.post('/MyItems', async (req, res) => {
            const MyItems = req.body;
            const result = await myCollection.insertOne(MyItems);
            res.send(result);
        })

        app.delete('/MyItems/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await myCollection.deleteOne(query);
            res.send(result);
        });
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