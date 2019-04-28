const functions = require('firebase-functions');

const admin = require('firebase-admin');
const request = require('request');
const rp = require('request-promise');
const {BigEmoji} = require('./bigemoji');
const {EmojiToken} = require('./emojiToken');
const { SLACK_TOKEN, EMOJI_STATE, EMOJI_SCOPES, EMOJI_CLIENT_ID, TOKEN_EMOJI_BOT, EMOJI_USER_ID, TOKEN_EMOJI, AUTH_URL } = require('./env');
const serviceAccount = require("./resources/slackbot-6314b-firebase-adminsdk-tapy4-9aaa95851d.json");
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://slackbot-6314b.firebaseio.com"
});

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
                const promiseList = onMentioned(request.body.token, request.body.event.channel, request.body.event.user, request.body.event.text);
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
    if (request.body.command === '/stamp')
        return new BigEmoji().onStampCommand(request).then(data => {
            console.log(data);
            return response.sendStatus(200);
        }).catch(e => {
            console.error(e);
        });
    return response.sendStatus(200);
});


app.post('/bigEmojiEvent', (request, response) => {
    if (request.body.type === 'event_callback'
        && request.body.event.user//botではundefinedとなる
        && request.body.event.channel_type === 'im') {

        console.log('exports.eventTriggered fired');
        console.log(JSON.stringify(request.body));

        switch (request.body.event.type) {
            case 'message':
            case 'app_mention': {
                console.log(request.body.event.channel, request.body.event.user);
                const emojiToken = new EmojiToken();
                return new emojiToken.checkUserTokenExists(request.body.event.channel, request.body.event.user).then(doc => {
                    let msgObj = emojiToken.createInteractiveMsg(request.body.event.channel, doc.exists);
                    return createSendMsgPrmWithBody(TOKEN_EMOJI_BOT, msgObj);
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
    console.log(JSON.stringify(request.query));

    const emojiToken = new EmojiToken();
    return emojiToken.requestUserAuthCode(request.query.code).then(data => {
        console.log(JSON.stringify(data));
        if (data.ok)
            return emojiToken.writeUserToken2Fb(data.access_token, data.user_id);

        const err = new Error('!data.ok');
        console.error(err);
        return err;

    }).then(data => {
        const msg = data instanceof Error
            ? '処理に失敗しました。しばらくしてからやり直してください'
            : '登録が完了しました。"/stamp :emoji:"で絵文字が書けます。';
        return createSendMsgPrm(TOKEN_EMOJI_BOT, EMOJI_USER_ID, msg);
    }).then(data => {
        return response.redirect(`https://slack.com/app_redirect?app=${EMOJI_USER_ID}`);
    }).catch(e => {
        console.error(e);
    });
});


exports.widgets = functions.https.onRequest(app);


/**
 * @param token {string}
 * @param channel {string}
 * @param user {string}
 * @param text {string}
 * @return {Array<Promise<T>>}
 */
function onMentioned(token, channel, user, text) {
    const t = text.replace(' ', '')
        .replace('　', '')
        .replace('!', '')
        .replace('！', '')
        .replace('<@UJ7GN8SJ0>', '');

    switch (t) {
        case '私がソクラテスだ': {
            console.log('yeah!');
            return [createFbTransaction(channel, user, true), createSendMsgPrm(token, channel, 'アガトン「違いない」（『饗宴』）')];
        }
        case 'うるさい': {
            console.log('うるさい!');
            return [createFbTransaction(channel, user, false), createSendMsgPrm(token, channel, 'カリクレス「仰せのとおりに。」（『饗宴』）')];
        }
        default:
            console.log(`text: ${t}`);
            //todo 説明整備すること
            return [createSendMsgPrm(token, channel, '「私がソクラテスだ！」で相づちを開始、「うるさい！」で相づちを止めます。文章が読点で終わるとき相づちを打ちます。')];
    }
}

/**
 * @param channel {string}
 * @param user {string}
 * @param enable {boolean}
 * @return {Promise<undefined>}
 */
function createFbTransaction(channel, user, enable) {
    console.log(channel, user, enable);
    const ref = admin.firestore().collection('registered');
    return admin.firestore()
        .collection('registered')
        .where('user', '==', user)
        .where('channel', '==', channel)
        .get()
        .then(snapshot => {
            let doc;
            let updated = false;
            snapshot.forEach(d => {
                if (d.exists && !updated) {
                    updated = true;
                    doc = d;
                }
            });

            if (doc)
                return ref.doc(doc.id).update({enabled: enable});
            else
                return ref.add({
                    channel: channel,
                    user: user,
                    enabled: enable
                });
        });
}


/**
 * @param token {string}
 * @param channel {string}
 * @param msg {string}
 * @return {Promise<T>}
 */
function createSendMsgPrm(token, channel, msg) {
    const option = {
        method: 'POST',
        url: 'https://slack.com/api/chat.postMessage',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Authorization': `Bearer ${SLACK_TOKEN}`
        },
        json: true,
        body: {
            channel: channel,
            text: msg
        },
    };
    return rp(option)
}


/**
 * @param token {string}
 * @param body
 * @return {Promise<T>}
 */
function createSendMsgPrmWithBody(token, body) {
    const option = {
        method: 'POST',
        url: 'https://slack.com/api/chat.postMessage',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Authorization': `Bearer ${token}`
        },
        json: true,
        body: body,
    };
    return rp(option)
}

/**
 * @param token {string}
 * @param channel {string}
 * @param user {string}
 * @param text {string}
 * @return {Promise<T>}
 */
function onMessaged(token, channel, user, text) {
    if (text.charAt(text.length - 1) !== '。')
        return Promise.resolve();

    console.log(token, channel, user, text);
    return admin.firestore().collection('registered')
        .where('user', '==', user)
        .where('channel', '==', channel)
        .get()
        .then(snapshot => {
            let isExists = false;
            let isSet = false;
            snapshot.forEach(doc => {
                if (!isSet) {
                    isSet = true;
                    isExists = doc.exists && doc.data()['enabled'];
                }
            });
            return isExists;
        }).then(enabled => {
            if (!enabled)
                return;
            return admin.firestore().collection('phrase').get();

        }).then(snapshot => {
            if (!snapshot)
                return;
            const position = getRandomInt(snapshot.size - 1);
            let count = 0;
            let phrase = '';
            snapshot.forEach(item => {
                if (position === count) {
                    phrase = item.data()['phrase'];
                }
                count++;
            });

            console.log(phrase);

            return createSendMsgPrm(token, channel, phrase);
        }).then(result => {
            if (result)
                console.log(JSON.stringify(result));
            return;
        }).catch(e => {
            console.error(e);
        });
}

/**
 * @param max {number}
 * @return {number}
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}