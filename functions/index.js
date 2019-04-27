const functions = require('firebase-functions');

const admin = require('firebase-admin');
const rp = require('request-promise');
const serviceAccount = require("./resources/slackbot-6314b-firebase-adminsdk-tapy4-9aaa95851d.json");

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
exports.eventTriggered = functions.https.onRequest((request, response) => {
    if (request.method === 'POST'
        && request.body.type === 'event_callback') {

        console.log('exports.eventTriggered fired');
        console.log(JSON.stringify(request.body));

        switch (request.body.event.type) {
            case 'message':

                break;
            case 'app_mention': {
                const promiseList = onMentioned(request.body.token, request.body.channel, request.body.user, request.body.event.text);
                return Promise.all(promiseList).then(data => {
                    console.log('app_mention', data);
                    return response.send(request.body.challenge);
                }).catch(e => {
                    console.error(e);
                });
            }
        }

        // if (request.body.type === 'event_callback'
        //     && request.body.event.type === 'message') {
        //     console.log(request.body.event.text);
        // }
    }

    return response.send(request.body.challenge);
});


/**
 * @param token {string}
 * @param channel {string}
 * @param user {string}
 * @param text {string}
 * @return {Array<Promise<T>>}
 */
function onMentioned(token, channel, user, text){
    const t = text.replace('/ |　|!|！|<@UJ7GN8SJ0>/g', '');
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
            return [createSendMsgPrm(token, channel, '「私がソクラテスだ！」で相づちを開始、「うるさい！」で相づちを止めます')];
    }
}

/**
 * @param channel {string}
 * @param user {string}
 * @param enable {boolean}
 * @return {Promise<undefined>}
 */
function createFbTransaction(channel, user, enable){
    const ref = admin.firestore().collection('registered');
    const queryRef = ref.where('user', '==', user)
        .where('channel', '==', channel);

    return admin.firestore().runTransaction(transaction => {
        return transaction.get(queryRef)
            .then(doc => {
                return transaction.update(queryRef, {enabled: enable});
            });
    });
}


/**
 * @param token {string}
 * @param channel {string}
 * @param msg {string}
 * @return {Promise<T>}
 */
function createSendMsgPrm(token, channel, msg){
    const option = {
        method: 'POST',
        url: 'https://slack.com/api/chat.postMessage',
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'Authorization': `Bearer ${require('./env').SLACK_TOKEN}`
        },
        json: true,
        body: {
            channel: 'CBD96M0AF',//todo これマジで謎
            text: msg
        },
    };
    return rp(option)
}