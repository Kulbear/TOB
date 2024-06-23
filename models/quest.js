// Description: This file contains class definition for the quest related data model.

const {
    QuestExpRewardCoefficient,
} = require('./static.js');


function generateUniqueID(prefix) {
    // generate a unique ID that start with the prefix and followed by a random text of 8 characters with numbers and letters
    return prefix + Math.random().toString(36).substring(2, 10);
}

function getCurrentTime() {
    return new Date();
}

function parseDurationText(durationText) {
    // duration text will be in format of "1w1d2h3m4s"
    // we will parse this text and calculate the total duration in time delta that can be added to Date() object
    const duration = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    };

    const durationTextArray = durationText.match(/\d+[wdhms]/g);
    for (const text of durationTextArray) {
        const unit = text[text.length - 1];
        const value = parseInt(text.slice(0, -1));
        switch (unit) {
        case 'w':
            duration.days = value * 7;
            break;
        case 'd':
            duration.days = value;
            break;
        case 'h':
            duration.hours = value;
            break;
        case 'm':
            duration.minutes = value;
            break;
        case 's':
            duration.seconds = value;
            break;
        default:
            break;
        }
    }
    return duration;
}

function addTimeDelta(currentTime, timeDelta) {
    currentTime.setDate(currentTime.getDate() + timeDelta.days);
    currentTime.setHours(currentTime.getHours() + timeDelta.hours);
    currentTime.setMinutes(currentTime.getMinutes() + timeDelta.minutes);
    currentTime.setSeconds(currentTime.getSeconds() + timeDelta.seconds);
    return currentTime;
}


/**
 * `Quest` is the class that represents a quest data model.
 */
class Quest {
    /**
	 * Create a Quest.
	 */
    constructor() {
        this.questId = null;
        this.name = null;
        this.description = null;
        this.multipletakers = true;
        this.repeatable = true;
        this.rewardText = null;
        this.durationTextRaw = null;

        // timestamps
        this.createdAt = null;
        this.expireAt = null;
        this.reviewedAt = null;

        // user related
        this.createdBy = null;
        this.reviewedBy = null;

        // status
        this.reviewed = false;
        this.approved = false;
        this.fromAdmin = false;
    }

    intializeQuest() {
        this.questId = generateUniqueID('Q-');
        this.createAt = getCurrentTime();
    }

    setName(name) {
        this.name = name;
    }

    setDescription(description) {
        this.description = description;
    }

    setMultipletakers(multipletakers) {
        this.multipletakers = multipletakers;
    }

    setRepeatable(repeatable) {
        this.repeatable = repeatable;
    }

    setRewardText(rewardText) {
        this.rewardText = rewardText;
    }

    setDurationTextRaw(durationTextRaw) {
        this.durationTextRaw = durationTextRaw;
    }

    setCreatedBy(createdBy) {
        this.createdBy = createdBy;
    }

    setReviewedBy(reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    setCreatedAt(createdAt) {
        this.createdAt = createdAt;
    }

    setReviewedAt(reviewedAt = new Date()) {
        this.reviewedAt = reviewedAt;
        const duration = parseDurationText(this.durationTextRaw);
        this.setExpireAt(addTimeDelta(this.reviewedAt, duration));
        this.reviewed = true;
    }

    setExpireAt(expireAt) {
        this.expireAt = expireAt;
    }

    setReviewed(reviewed) {
        this.reviewed = reviewed;
    }

    setApproved(approved) {
        this.approved = approved;
    }

    setFromAdmin(fromAdmin) {
        this.fromAdmin = fromAdmin;
    }

    updateQuestStatus(adminUpdate = false) {
        // is reviewed or not?
        if (this.reviewedAt) {
            this.reviewed = true;
        }
        else {
            this.reviewed = false;
        }

        // is this a community quest or an official quest?
        if (adminUpdate) {
            console.debug(`[DEBUG][Quest] ${this.questId} is an official quest.`);
            this.setFromAdmin(true);
            this.setReviewed(true);
            this.setReviewedAt(this.createAt);
            this.setReviewedBy(this.createdBy);
            this.setApproved(true);
        }

    }

    /**
	 * Update the attributes of the Quest from a store.
	 * @param {Object} attributes - The attributes to update.
	 */
    updateAttributeFromStore(attributes) {
        this.questId = attributes['questId'];
        this.name = attributes['name'];
        this.description = attributes['description'];
        this.multipletakers = attributes['multipletakers'];
        this.repeatable = attributes['repeatable'];
        this.rewardText = attributes['rewardText'];
        this.durationTextRaw = attributes['durationTextRaw'];

        this.createdAt = new Date(attributes['createdAt']);
        this.expireAt = new Date(attributes['expireAt']);
        this.reviewedAt = new Date(attributes['reviewedAt']);

        this.createdBy = attributes['createdBy'];
        this.reviewedBy = attributes['reviewedBy'];

        this.reviewed = attributes['reviewed'];
        this.approved = attributes['approved'];
        this.fromAdmin = attributes['fromAdmin'];
    }

    /**
	 * Return the attributes of the Quest to be stored.
	 * @returns {Object} - The attributes of the Quest.
	 */
    returnAttributeToStore() {
        return {
            'questId': this.questId,
            'name': this.name,
            'description': this.description,
            'multipletakers': this.multipletakers,
            'repeatable': this.repeatable,
            'rewardText': this.rewardText,
            'durationTextRaw': this.durationTextRaw,

            'createdAt': this.createdAt,
            'expireAt': this.expireAt,
            'reviewedAt': this.reviewedAt,

            'createdBy': this.createdBy,
            'reviewedBy': this.reviewedBy,

            'reviewed': this.reviewed,
            'approved': this.approved,
            'fromAdmin': this.fromAdmin,
        };
    }
}


/**
 * QuestInstance is the class that contains the instance of data related to a quest accepted by the user.
 * Each Quest object can be accepted by multiple users, and each user will have their own corresponding QuestInstance object.
 */
class QuestInstance {
    /**
	 * Create a QuestInstance.
	 * @param {string} questId - The ID of the quest.
	 * @param {string} dcId - The ID of the user.
	 */
    constructor(questId, dcId) {
        this.questId = questId;
        this.name = null;
        this.dcId = dcId;
        this.acceptAt = null;
        this.completeAt = null;
        this.failAt = null;
        this.createAt = null;
        this.completion = false;
        this.rewardCoefficient = QuestExpRewardCoefficient.REWARD_NORMAL;
        this.rewardExp = null;
        this.needReview = false;
    }

    /**
	 * Update the attributes of the QuestInstance from a store.
	 * @param {Object} attributes - The attributes to update.
	 */
    updateAttributeFromStore(attributes) {
        this.questId = attributes['questId'];
        this.name = attributes['name'];
        this.dcId = attributes['dcId'];
        this.acceptedAt = new Date(attributes['acceptedAt']);
        this.completedAt = new Date(attributes['completedAt']);
        this.failedAt = new Date(attributes['failedAt']);
        this.createAt = new Date(attributes['createAt']);
        this.completion = attributes['completion'];
        this.rewardCoefficient = attributes['rewardCoefficient'];
        this.rewardExp = attributes['rewardExp'];
        this.needReview = attributes['needReview'];
    }

    /**
	 * Return the attributes of the QuestInstance to be stored.
	 * @returns {Object} - The attributes of the QuestInstance.
	 */
    returnAttributeToStore() {
        return {
            'questId': this.questId,
            'name': this.name,
            'dcId': this.dcId,
            'acceptAt': this.acceptAt,
            'completeAt': this.completeAt,
            'failAt': this.failedAt,
            'completion': this.completion,
            'rewardCoefficient': this.rewardCoefficient,
            'rewardExp': this.rewardExp,
            'needReview': this.needReview,
        };
    }

    setRewardCoefficient(rewardCoefficient) {
        this.rewardCoefficient = rewardCoefficient;
    }

    setRewardExp(rewardExp) {
        this.rewardExp = rewardExp;
    }

    /**
	 * Set the accepted_at attribute to the current time.
	 */
    questAcceptAt() {
        this.acceptAt = getCurrentTime();
    }

    /**
	 * Set the completed_at attribute to the current time.
	 */
    questCompleteAt() {
        this.completeAt = getCurrentTime();
    }

    /**
	 * Set the failed_at attribute to the current time.
	 */
    questFailedAt() {
        this.failAt = getCurrentTime();
    }
}


module.exports = {
    Quest,
    QuestInstance,
};