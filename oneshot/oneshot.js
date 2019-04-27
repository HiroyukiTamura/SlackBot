const fs = require('fs-extra');
const {BigEmoji} = require('../functions/bigemoji');
const { TOKEN_EMOJI } = require('../functions/env');

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

async function kickEmojiList() {
    const bigEmoji = new BigEmoji();
    const result = await bigEmoji.getEmoji('black_square')
        .then(imgUrl => {
            return bigEmoji.createSendMsgPrm(TOKEN_EMOJI, 'CBD96M0AF', imgUrl)
        }).then(data => {
            console.log(data);
        }).catch(e => {
            console.error(e);
        });
    console.log(result);
}


kickEmojiList().catch(e => {
    console.error(e);
});
