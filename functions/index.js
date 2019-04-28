const functions = require('firebase-functions');

const admin = require('firebase-admin');
const {Messenger} = require('./messenger');
const {Firestore} = require('./firestore');
const {RequestClient} = require('./requestClient');
const { SLACK_TOKEN, TOKEN_EMOJI_BOT, EMOJI_USER_ID, TOKEN_EMOJI } = require('./env');
const serviceAccount = require("./resources/slackbot-6314b-firebase-adminsdk-tapy4-9aaa95851d.json");
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackbot-6314b.firebaseio.com"
});

const firestore = new Firestore();
const messenger = new Messenger();
const rc = new RequestClient();

/**
 * "type": "url_verification",
 "token": "3AiO4dvD6qVjelnUSJGldnFL",
 "challenge": "tj3uhlg58P7lhGaGMBkPpMfNgQ3m1oxI5FrPFeqRdjhKLyTDpZRC"
 }
 * @type {HttpsFunction}
 */
app.post('/eventTriggered', (request, response) => {
    if (request.method === 'POST'
        && request.body.event.user//botではundefinedとなる
        && request.body.type === 'event_callback') {

        console.log('exports.eventTriggered fired');
        console.log(JSON.stringify(request.body));

        switch (request.body.event.type) {
            case 'message':
                return onMessaged(request.body.token, request.body.event.channel, request.body.event.user, request.body.event.text).then(result => {
                    console.log(result);
                    return response.sendStatus(200);
                }).catch(e => {
                    console.log(e);
                });
            case 'app_mention': {
                const promiseList = onMentioned(request.body.event.channel, request.body.event.user, request.body.event.text);
                return Promise.all(promiseList).then(data => {
                    console.log('app_mention', data);
                    return response.sendStatus(200);
                }).catch(e => {
                    console.error(e);
                });
            }
        }
    }

    return response.status(200).send(request.body.challenge);
});


app.get('/bigEmoji', (request, response) => {
    console.log('bigEmoji fired');

    if (request.body.command === '/stamp') {
        const text = request.body.text.replace(/:([^:]+):/, '$1');

        return rc.getEmoji(text).then(imgUrl => {
            console.log(request.body.channel_id);
            return messenger.postBigEmoji(TOKEN_EMOJI, request.body.channel_id, imgUrl);
        }).then(data => {
            return response.sendStatus(200);
        }).catch(e => {
            console.error(e);
        });
    }

    return response.sendStatus(200);
});


app.post('/bigEmojiEvent', (request, response) => {
    console.log('bigEmojiEvent fired');
    if (request.body.type === 'event_callback'
        && request.body.event.user//botではundefinedとなる
        && request.body.event.channel_type === 'im') {

        console.log(JSON.stringify(request.body));

        switch (request.body.event.type) {
            case 'message':
            case 'app_mention': {
                console.log(request.body.event.channel, request.body.event.user);
                return new firestore.checkUserTokenExists(request.body.event.channel, request.body.event.user).then(doc => {
                    let msgObj = messenger.createInteractiveMsg(request.body.event.channel, doc.exists);
                    return messenger.createSendMsgPrmWithBody(TOKEN_EMOJI_BOT, msgObj);
                }).then(data => {
                    console.log(data);
                    return response.sendStatus(200);
                }).catch(e => {
                    console.error(e);
                })
            }
        }
    }

    console.log(request.body);

    return response.status(200).send(request.body.challenge);
});


app.get('/bigEmojiAuthRedirected', (request, response) => {
    console.log('bigEmojiAuthRedirected');
    console.log(JSON.stringify(request.query));

    return rc.requestUserAuthCode(request.query.code).then(data => {
        console.log(JSON.stringify(data));
        if (data.ok)
            return firestore.writeUserToken2Fb(data.access_token, data.user_id);

        const err = new Error('!data.ok');
        console.error(err);
        return err;

    }).then(data => {
        const msg = data instanceof Error
            ? '処理に失敗しました。しばらくしてからやり直してください'
            : '登録が完了しました。"/stamp :emoji:"で絵文字が書けます。';
        return new Messenger().sendMsgForPhrase(TOKEN_EMOJI_BOT, EMOJI_USER_ID, msg);
    }).then(data => {
        return response.redirect(`https://slack.com/app_redirect?app=${EMOJI_USER_ID}`);
    }).catch(e => {
        console.error(e);
    });
});


exports.widgets = functions.https.onRequest(app);


/**
 * @param channel {string}
 * @param user {string}
 * @param text {string}
 * @return {Array<Promise<T>>}
 */
function onMentioned(channel, user, text) {
    const t = text.replace(' ', '')
        .replace('　', '')
        .replace('!', '')
        .replace('！', '')
        .replace('<@UJ7GN8SJ0>', '');

    switch (t) {
        case '私がソクラテスだ': {
            console.log('yeah!');
            return [firestore.subscribeNodding(channel, user, true), messenger.sendMsgForPhrase(SLACK_TOKEN, channel, 'アガトン「違いない」（『饗宴』）')];
        }
        case 'うるさい': {
            console.log('うるさい!');
            return [firestore.subscribeNodding(channel, user, false), messenger.sendMsgForPhrase(SLACK_TOKEN, channel, 'カリクレス「仰せのとおりに。」（『饗宴』）')];
        }
        default:
            console.log(`text: ${t}`);
            return [messenger.sendMsgForPhrase(SLACK_TOKEN, channel, '「私がソクラテスだ！」で相づちを開始、「うるさい！」で相づちを止めます。文章が読点で終わるとき相づちを打ちます。')];
    }
}


/**
 * @param token {string}
 * @param channel {string}
 * @param user {string}
 * @param text {string}
 * @return {Promise<null>}
 */
function onMessaged(token, channel, user, text) {
    if (!text.endsWith('。'))
        return Promise.resolve();

    console.log(token, channel, user, text);
    return firestore.isNodding(channel, user)
        .then(enabled => {
            if (!enabled)
                return null;
            return admin.firestore().collection('phrase').get();

        }).then(snapshot => {
            const phrase = firestore.getRandomPhrase(snapshot);
            if (!phrase)
                return null;
            console.log(phrase);
            return new Messenger().sendMsgForPhrase(token, channel, phrase);
        }).then(result => {
            if (result)
                console.log(JSON.stringify(result));
            return null;
        }).catch(e => {
            console.error(e);
        });
}