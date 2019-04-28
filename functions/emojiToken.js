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