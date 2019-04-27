class BigEmoji {

    constructor() {
        this.TOKEN_EMOJI = require('./env').TOKEN_EMOJI;
        this.rp = require('request-promise');
        this.request = require('request');
    }

    /**
     * @param request
     * @return {Promise<string | never>}
     */
    onRequest(request){
        if (request.body.command !== '/stamp')
            throw Error();
        console.log(request.body.command);
        console.log(request.body.response_url);
        const text = request.body.text.replace(/:([^:]+):/, '$1');

        return this.getEmoji(text).then(imgUrl => {
            return this.createSendMsgPrm(this.TOKEN_EMOJI, channel, imgUrl);
        }).catch(e => {
            console.error(e);
        })
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
                    'Authorization': `Bearer ${this.TOKEN_EMOJI}`
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
                    } else if (BigEmoji.isAlias(imgUrl)) {
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


    /**
     * @param userToken {string}
     * @param channel {string}
     * @param imgUrl {string}
     */
    createSendMsgPrm(userToken, channel, imgUrl) {
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
    BigEmoji: BigEmoji
};