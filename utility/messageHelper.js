const { accumulateExp } = require('./playerProfile.js');

const { dailyTextChatExpLimit } = require('../botConfig.json');

async function onUserMessageCreate(client, supabase, message) {
    console.debug('[DEBUG][onUserMessageCreate]', message.content);

    const userId = message.author.id;
    const exp = 1;
    const expDailyLimit = dailyTextChatExpLimit;
    const counterKey = 'textChatDailyCounter';

    accumulateExp(client, supabase, userId, exp, expDailyLimit, counterKey);
}


module.exports = {
    onUserMessageCreate,
};
