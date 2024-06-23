// Description: This file contains the player model.
const {
    Role,
    ExpTotalMapping,
    ExpLevelMapping,
} = require('./static.js');


class Player {
    constructor(dcId, dcTag, guildId, role = Role.MEMBER) {
        // Primary Keys
        this.dcId = dcId;
        this.guildId = guildId;

        // Attributes
        this.dcTag = dcTag;
        this.role = role;

        this.level = 1;
        this.exp = 0;
        this.expCurrentLevel = 0;
        this.currentTaskId = null;
        this.currencies = {
            'silverCoin': 0,
            'royalPoint': 0,
        };
    }

    hasTask() {
        return this.currentTaskId !== null;
    }

    acceptTask(taskId) {
        if (this.hasTask()) {
            return false;
        }
        this.currentTaskId = taskId;
        return true;
    }

    updateAttributeFromStore(attributes) {
        // get player data from object "attributes"
        this.role = attributes['role'];
        this.exp = attributes['exp'];
        this.updateLevel();
        this.currentTaskId = attributes['currentTaskId'];
        // map key value pairs in currencies to this.currencies
        this.currencies = attributes['currencies'];
    }

    returnAttributeToStore() {
        this.updateLevel();
        return {
            'dcId': this.dcId,
            'dcTag': this.dcTag,
            'guildId': this.guildId,
            'role': this.role,
            'level': this.level,
            'exp': this.exp,
            'currentTaskId': this.currentTaskId,
            'currencies': this.currencies,
        };
    }

    updateCurrency(currency, amount) {
        // if currency to update does not exist
        if (!Object.prototype.hasOwnProperty.call(this.currencies, currency)) {
            return false;
        }

        // if the amount of currency is less than 0 after update
        if (this.currencies[currency] + amount < 0) {
            return false;
        }

        this.currencies[currency] += amount;
        return true;
    }

    updateRole(role) {
        this.role = role;
    }

    updateLevel() {
        this.expCurrentLevel = this.exp;
        for (let i = 1; i <= 100; i++) {
            if (this.exp >= ExpTotalMapping[i]) {
                // say lv1 need 10 exp
                // then by having 10+ exp, you are lv2
                // and we deduct the exp needed for lv2 from the expCurrentLevel
                // which is initialized to the total exp
                this.level = i + 1;
                this.expCurrentLevel -= ExpLevelMapping[i];
            }
            else {
                break;
            }
        }
    }

    updateExp(exp) {
        this.exp += exp;
        this.updateLevel();
    }
}


module.exports = {
    Player,
};