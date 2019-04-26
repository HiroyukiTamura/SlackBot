const functions = require('firebase-functions');

const admin = require("firebase-admin");
const serviceAccount = require("../resources/slackbot-6314b-firebase-adminsdk-tapy4-9aaa95851d.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackbot-6314b.firebaseio.com"
});


exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
