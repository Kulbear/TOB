const { EmbedBuilder } = require('discord.js');


function buildUserProfileEmbed(payload) {
    const { userNickname, userTag, dailyTextChatExpLimit, dailyVoiceChatExpLimit, counter, diffStr } = payload;

    const embed = new EmbedBuilder()
        .setTitle(`⭐丨${userNickname} 的机密档案已经泄露...丨⭐`)
        .setImage(`attachment://profile_${userTag}.jpg`)
        .addFields(
            { name: '今日发言剩余经验', value: `${dailyTextChatExpLimit - counter.textChatDailyCounter}`, inline: true },
            { name: '今日语音剩余经验', value: `${dailyVoiceChatExpLimit - counter.voiceChatDailyCounter}`, inline: true },
            { name: '重置时间', value: `${diffStr}`, inline: true },
        )
        .setColor('#7A76EB');

    return embed;
}


module.exports = {
    buildUserProfileEmbed,
};