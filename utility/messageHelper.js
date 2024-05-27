const { accumulateExp } = require('./playerProfile.js');

const {
    dailyTextChatExpLimit,
    gameRoleIDs,
    ruleReadRoleID,
    guideReadRoleID,
} = require('../botConfig.json');

async function onUserMessageCreate(client, supabase, message) {
    console.debug('[DEBUG][onUserMessageCreate]', message.content);

    const userId = message.author.id;


    const member = message.author;
    // now check if user is qualified to get a profile card
    let validRoleCounter = 0;
    // here we want to check if a member has at least 2 of the game roles
    // if they do, we want to log their tag
    for (const roleID in gameRoleIDs) {
        if (member.roles.cache.has(roleID)) {
            validRoleCounter++;
        }
    }
    if (member.roles.cache.has(ruleReadRoleID) && member.roles.cache.has(guideReadRoleID) && validRoleCounter >= 3) {
        const exp = 10;
        const expDailyLimit = dailyTextChatExpLimit;
        const counterKey = 'textChatDailyCounter';

        accumulateExp(client, supabase, userId, exp, expDailyLimit, counterKey);
    }
}


module.exports = {
    onUserMessageCreate,
};
