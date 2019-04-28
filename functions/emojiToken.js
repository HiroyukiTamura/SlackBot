class EmojiToken {

    constructor() {
        this.rp = require('request-promise');
        this.admin = require('firebase-admin');
        this.env = require('./env');
    }


    /**
     * @param channel {string}
     * @param userId {string}
     * @return {Promise<T>}
     */
    checkUserTokenExists(channel, userId){
        return this.admin.firestore()
            .collection('emoji_user_token')
            .doc(userId)
            .get();
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
     * @return {Promise<T>}
     */
    redirectToAuth(){
        const option = {
            url: 'https://slack.com/oauth/authorize',
            headers: {
                client_id: this.env.EMOJI_CLIENT_ID,
                scope: this.env.EMOJI_SCOPES,
                state: this.env.EMOJI_STATE,
                redirect_uri: 'https://us-central1-slackbot-6314b.cloudfunctions.net/widgets/bigEmojiAuthRedirected'
            },
        };
        return this.rp(option);
    }


    /**
     * @param code {string}
     * @return {Promise<T>}
     */
    requestUserAuthCode(code){
        const option = {
            uri: `https://slack.com/api/oauth.access?code=${code}`+
                `&client_id=${this.env.EMOJI_CLIENT_ID}`+
                `&client_secret=${this.env.EMOJI_SECRET}`+
                `&redirect_uri=${this.env.AUTH_REDIRECT_URL}`,
            method: 'GET',
            json: true
        };
        return this.rp(option);
    }

    /**
     * @param userToken {string}
     * @param userId {string}
     * @return {Promise<T>}
     */
    writeUserToken2Fb(userToken, userId){
        return this.admin.firestore()
            .collection('emoji_user_token')
            .doc(userId)
            .set({
                token: userToken
            });
    }
}

module.exports = {
    EmojiToken: EmojiToken
};