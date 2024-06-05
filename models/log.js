class ExpModLog {
    constructor() {
        this.missionId = 0;
        this.expModAmt = 0;
        this.createdAt = new Date();
        this.updatedBy = null;
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

    updateAttributeFromStore(attributes) {
        this.missionId = attributes['missionId'];
        this.expModAmt = attributes['expModAmt'];
        this.createdAt = new Date(attributes['createdAt']);
        this.updatedBy = attributes['updatedBy'];
        this.note = attributes['note'];
        this.targetPlayerId = attributes['targetPlayerId'];
        this.targetPlayerDcId = attributes['targetPlayerDcId'];
    }

    returnAttributeToStore() {
        return {
            'expModAmt': this.expModAmt,
            'createdAt': this.createdAt,
            'updatedBy': this.updatedBy,
            'note': this.note,
            'targetPlayerId': this.targetPlayerId,
            'targetPlayerDcId': this.targetPlayerDcId,
        };
    }
}

module.exports = {
    ExpModLog,
};