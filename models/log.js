class ExpModLog {
    constructor() {
        this.missionId = 0;
        this.expModAmt = 0;
        this.createdAt = new Date();
        this.updatedBy = null;
        this.updatedByDcTag = null;
        this.note = null;
        this.targetPlayerId = null;
        this.targetPlayerDcId = null;
    }

    setMissionId(missionId) {
        this.missionId = missionId;
    }

    setExpModAmt(expModAmt) {
        this.expModAmt = expModAmt;
    }

    setCreatedAt(createdAt) {
        this.createdAt = createdAt;
    }

    setUpdatedBy(updatedBy) {
        this.updatedBy = updatedBy;
    }

    setUpdatedByDcTag(updatedByDcTag) {
        this.updatedByDcTag = updatedByDcTag;
    }

    setNote(note) {
        this.note = note;
    }

    setTargetPlayerId(targetPlayerId) {
        this.targetPlayerId = targetPlayerId;
    }

    setTargetPlayerDcId(targetPlayerDcId) {
        this.targetPlayerDcId = targetPlayerDcId;
    }

    getid() {
        return this.missionId;
    }

    getExpModAmt() {
        return this.expModAmt;
    }

    getCreatedAt() {
        return this.createdAt;
    }

    getUpdatedBy() {
        return this.updatedBy;
    }

    getNote() {
        return this.note;
    }

    getTargetPlayerId() {
        return this.targetPlayerId;
    }

    getTargetPlayerDcId() {
        return this.targetPlayerDcId;
    }

    getUpdatedByDcTag() {
        return this.updatedByDcTag;
    }

    updateAttributeFromStore(attributes) {
        this.missionId = attributes['missionId'];
        this.expModAmt = attributes['expModAmt'];
        this.createdAt = new Date(attributes['createdAt']);
        this.updatedBy = attributes['updatedBy'];
        this.updatedByDcTag = attributes['updatedByDcTag'];
        this.note = attributes['note'];
        this.targetPlayerId = attributes['targetPlayerId'];
        this.targetPlayerDcId = attributes['targetPlayerDcId'];
    }

    returnAttributeToStore() {
        return {
            'expModAmt': this.expModAmt,
            'createdAt': this.createdAt,
            'updatedBy': this.updatedBy,
            'updatedByDcTag': this.updatedByDcTag,
            'note': this.note,
            'targetPlayerId': this.targetPlayerId,
            'targetPlayerDcId': this.targetPlayerDcId,
        };
    }
}

module.exports = {
    ExpModLog,
};