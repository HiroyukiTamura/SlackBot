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
        const blocks = registered
            ? [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: 'BigEmojiの承認を取り消しますか？'
                    },
                    accessory: {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: '取り消す'
                        },
                        value: "revoke",
                        action_id: this.env.ACTION_ID_REVOKE
                    }
                }
            ]
            : [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `BigEmojiを使用するには、<${this.env.AUTH_URL}|ここ>をクリックしてbotを承認します。承認はいつでも取り消すことができます。`
                    }
                }
            ];
        return {
            channel: channel,
            blocks: blocks
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


    /**
     * @param url {string}
     * @param msg {string}
     * @return Promise<T>
     */
    reply2IntaractiveAction(url, msg){
        const option = {
            method: 'POST',
            url: url,
            json: true,
            body: {
                text: msg
            },
        };
        return this.rp(option)
    }


    /**
     * @param userToken {string}
     * @param channel {string}
     * @param imgUrl {string}
     */
    postBigEmoji(userToken, channel, imgUrl) {
        const option = {
            method: 'POST',
            url: 'https://slack.com/api/chat.postMessage',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'Authorization': `Bearer ${userToken}`
            },
            json: true,
            body: {
                channel: channel,
                as_user: true,
                text: '',
                attachments: [{
                    color: '#fff',
                    text: '',
                    image_url: imgUrl,
                }],
            },
        };
        return this.rp(option)
    }
}

module.exports = {
    Messenger: Messenger
};