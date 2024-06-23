// Description: This file contains the utility models for the bot.
class Counter {
    constructor() {
        this.dcId = null;
        this.dcTag = null;
        this.textChatDailyCounter = 0;
        this.voiceChatDailyCounter = 0;
        this.lastResetTime = null;
    }

    // Set the dcId
    setDcId(dcId) {
        this.dcId = dcId;
    }

    setDcTag(dcTag) {
        this.dcTag = dcTag;
    }

    // Reset last reset time
    resetDaily() {
        this.lastResetTime = new Date();
        this.resetAllCounters();
    }

    // Increment the text chat counter
    incrementTextChatCounter(exp) {
        this.textChatDailyCounter += exp;
    }

    // Increment the voice chat counter
    incrementVoiceChatCounter(exp) {
        this.voiceChatDailyCounter += exp;
    }

    // Decrement the text chat counter
    decrementTextChatCounter() {
        this.textChatDailyCounter--;
    }

    // Reset the text chat counter
    resetTextChatCounter() {
        this.textChatDailyCounter = 0;
    }

    // Reset the voice chat counter
    resetVoiceChatCounter() {
        this.voiceChatDailyCounter = 0;
    }

    // Reset the text and voice chat counter
    resetAllCounters() {
        this.textChatDailyCounter = 0;
        this.voiceChatDailyCounter = 0;
    }

    // Get the text chat counter
    getTextChatDailyCounter() {
        return this.textChatDailyCounter;
    }

    // Get the voice chat counter
    getVoiceChatDailyCounter() {
        return this.voiceChatDailyCounter;
    }

    updateAttributeFromStore(attributes) {
        this.dcId = attributes['dcId'];
        this.dcTag = attributes['dcTag'];
        this.textChatDailyCounter = attributes['textChatDailyCounter'];
        this.voiceChatDailyCounter = attributes['voiceChatDailyCounter'];
        this.lastResetTime = new Date(attributes['lastResetTime']);
    }

    returnAttributeToStore() {
        return {
            'dcId': this.dcId,
            'dcTag': this.dcTag,
            'textChatDailyCounter': this.textChatDailyCounter,
            'voiceChatDailyCounter': this.voiceChatDailyCounter,
            'lastResetTime': this.lastResetTime,
        };
    }
}


class VoiceChannelActivityRecord {
    constructor(dcId, dcTag, activity, timestamp) {
        this.dcId = dcId;
        this.dcTag = dcTag;
        this.activity = activity;
        this.timestamp = timestamp;
    }

    updateAttributeFromStore(attributes) {
        this.dcId = attributes['dcId'];
        this.dcTag = attributes['dcTag'];
        this.activity = attributes['activity'];
        this.timestamp = new Date(attributes['timestamp']);
    }

    returnAttributeToStore() {
        return {
            'dcId': this.dcId,
            'dcTag': this.dcTag,
            'activity': this.activity,
            'timestamp': this.timestamp,
        };
    }
}


module.exports = {
    Counter,
    VoiceChannelActivityRecord,
};
