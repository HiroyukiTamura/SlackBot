const fs = require('fs-extra');

const admin = require("firebase-admin");
const serviceAccount = require("../functions/resources/slackbot-6314b-firebase-adminsdk-tapy4-9aaa95851d.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackbot-6314b.firebaseio.com"
});


async function uploadInitialPhrases() {
    const json = await fs.readJson('./phrase.json');

    const batch = admin.firestore().batch();
    json['phrases'].forEach(item => {
        const ref = admin.firestore().collection('phrase').doc();
        batch.set(ref, item);
    });

    await batch.commit();
}

uploadInitialPhrases().catch(e => {
    console.error(e);
});
