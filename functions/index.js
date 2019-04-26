const functions = require('firebase-functions');
const {FirestoreClient} = require('./transpiled/index');

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send(new FirestoreClient().uploadInitialPhrases());
});
