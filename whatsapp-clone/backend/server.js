//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';
//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1418410",
    key: "aa23cb38606b2f0e0bc1",
    secret: "8f7d9c61f313f952162b",
    cluster: "ap2",
    useTLS: true
});

//middleware
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
})
app.use(cors());

// //DB config
const connection_url = 'mongodb+srv://kr040902:ttbW5d5BybA6mZmu@cluster0.nmdpa.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(connection_url, err => {
    if (err) throw err;
    console.log('connected to mongodb')
});
//?????
const db = mongoose.connection;

db.once('open', () => {
    console.log('DB is connected');
    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();
    changeStream.on('change', (change) => {
        console.log("a changed occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.user,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                recieved: messageDetails.recieved,
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});
//api.routes
app.get('/', (req, res) => res.status(200).send("Hello Rashmi"));

app.get('/messages/sync', (req, res) => {
    console.log('sync message')
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
});

//Listen
app.listen(port, () => console.log(`listening on localhost: ${port}`));