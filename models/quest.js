// Description: This file contains class definition for the quest related data model.

const { QuestExpRewardCoefficient } = require('./static.js');
const {
    generateUniqueID,
    getCurrentTime,
    parseDurationText,
    addTimeDelta,
} = require('../utility/questHelper.js');


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
        this.repeatable = false;
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
            this.setReviewedAt(this.createAt);
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


module.exports = {
    Quest,
};