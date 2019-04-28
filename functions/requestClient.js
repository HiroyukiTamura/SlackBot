'use strict';

class RequestClient {

    constructor(){
        this.request = require('request');
        this.rp = require('request-promise');
        this.env = require('./env');
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
     * @param text {string}
     * @return {Promise<string>}
     */
    getEmoji(text){
        return new Promise((resolve, reject) => {
            const option = {
                url: 'https://slack.com/api/emoji.list',
                headers: {
                    'Authorization': `Bearer ${this.env.TOKEN_EMOJI}`
                },
                json: true
            };

            this.request(option, (error, response, body) => {
                if (error)
                    reject(error);
                else if (response.statusCode !== 200) {
                    console.log(body);
                    reject(new Error(`response.statusCode === ${response.statusCode}`));
                } else if (!body.ok || !body.emoji) {
                    console.log(body);
                    reject(new Error('!body.ok'))
                } else {
                    console.log(body);
                    const imgUrl = body.emoji[text];
                    if (!imgUrl) {
                        //標準の絵文字
                        resolve(`https://www.webfx.com/tools/emoji-cheat-sheet/graphics/emojis/${text}.png`)
                    } else if (RequestClient.isAlias(imgUrl)) {
                        //alias:black_large_square等の場合に対応
                        const alias = imgUrl.substring('alias:'.length);
                        const imgUrlNew = body.emoji[alias];
                        resolve(imgUrlNew ? imgUrlNew : `https://www.webfx.com/tools/emoji-cheat-sheet/graphics/emojis/${text}.png`);
                    } else
                        resolve(imgUrl);//カスタム絵文字
                }
            });
        });
    }

    /**
     * @private
     * @param url {string}
     * @return {boolean}
     */
    static isAlias(url){
        return url.startsWith('alias:');
    }
}

module.exports = {
    RequestClient: RequestClient
};