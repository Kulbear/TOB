// Description: Static data for the application.
const Role = {
    SUPER_ADMIN: 0,
    ADMIN: 1,
    PREMIUM_MEMBER: 2,
    MEMBER: 3,
};


const RoleIDToText = {
    0: 'Super Admin',
    1: 'Admin',
    2: 'Premium Member',
    3: 'Member',
};


const QuestExpRewardCoefficient = {
    REWARD_INTRO: 0.5,
    REWARD_NORMAL: 1,
    REWARD_HIGH: 1.5,
    REWARD_VERY_HIGH: 2,
    REWARD_EXTREME: 2.5,
    REWARD_LEGENDARY: 3,
};


const ExpLevelMapping = {
    1: 10,
};


const ExpTotalMapping = {
    1: 10,
};

// each level need 1.3 times exp than compared with the previous level
// ExpLevelMapping contains exp value needed for each of the level
// ExpTotalMapping contains exp value needed in totol for reaching certain level
// create a for loop to calculate the exp value needed for each of the level until level 100
for (let i = 2; i <= 100; i++) {
    ExpLevelMapping[i] = Math.ceil(ExpLevelMapping[i - 1] * 1.3);
    ExpTotalMapping[i] = ExpTotalMapping[i - 1] + ExpLevelMapping[i];
}

module.exports = {
    Role,
    RoleIDToText,
    ExpLevelMapping,
    ExpTotalMapping,
    QuestExpRewardCoefficient,
};
