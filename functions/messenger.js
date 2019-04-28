'use strict';

class Messenger {
    constructor(){
        this.env = require('./env');
        this.rp = require('request-promise');
    }

    /**
     * @param channel {string}
     * @param registered {boolean}
     * @return {{blocks: {text: {text: string, type: string}, type: string}[], channel: string}}
     */
    createInteractiveMsg(channel, registered){
        const text = registered
            ? `BigEmojiの承認を取り消すには、<${this.env.AUTH_URL}|ここ>をクリックしてください。`
            : `BigEmojiを使用するには、<${this.env.AUTH_URL}|ここ>をクリックしてbotを承認します。承認はいつでも取り消すことができます。`;
        return {
            channel: channel,
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": text
                    }
                }
            ]
        };
    }


    /**
     * @param token {string}
     * @param body
     * @return {Promise<T>}
     */
    createSendMsgPrmWithBody(token, body) {
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
        return this.rp(option)
    }


    /**
     * @param token {string}
     * @param channel {string}
     * @param msg {string}
     * @return {Promise<T>}
     */
    sendMsgForPhrase(token, channel, msg) {
        const option = {
            method: 'POST',
            url: 'https://slack.com/api/chat.postMessage',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': `Bearer ${token}`
            },
            json: true,
            body: {
                channel: channel,
                text: msg
            },
        };
        return this.rp(option)
    }
}

module.exports = {
    Messenger: Messenger
};