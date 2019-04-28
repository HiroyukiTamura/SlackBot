'use strict';

class Firestore {

    constructor(){
        this.firestore = require('firebase-admin').firestore();
    }

    /**
     * @param channel {string}
     * @param user {string}
     * @param enable {boolean}
     * @return {Promise<undefined>}
     */
    subscribeNodding(channel, user, enable){
        const ref = this.firestore.collection('registered');
        return this.firestore
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
     * @param channel {string}
     * @param user {string}
     * @return {Promise<boolean>}
     */
    isNodding(channel, user){
        return this.firestore.collection('registered')
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
            });
    }


    /**
     * @param snapshot {DocumentSnapshot}
     * @return {null|string}
     */
    getRandomPhrase(snapshot){
        if (!snapshot)
            return null;
        const position = Firestore.getRandomInt(snapshot.size - 1);
        let count = 0;
        let phrase = null;
        snapshot.forEach(item => {
            if (position === count) {
                phrase = item.data()['phrase'];
            }
            count++;
        });

        return phrase;
    }


    /**
     * @param channel {string}
     * @param userId {string}
     * @return {Promise<T>}
     */
    checkUserTokenExists(channel, userId){
        return this.firestore
            .collection('emoji_user_token')
            .doc(userId)
            .get();
    }


    /**
     * @param userToken {string}
     * @param userId {string}
     * @return {Promise<T>}
     */
    writeUserToken2Fb(userToken, userId){
        return this.firestore.collection('emoji_user_token')
            .doc(userId)
            .set({
                token: userToken
            });
    }


    /**
     * @param max {number}
     * @return {number}
     */
    static getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
}

module.exports = {
    Firestore: Firestore
};