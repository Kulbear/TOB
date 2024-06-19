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

function buildQuestListInfoEmbed(
    interaction,
    questsToShow,
    questIdx = 1,
    ops = '接受',
) {
    const questToShow = questsToShow[questIdx - 1];
    const questDescription = questToShow['description'];
    // const durationTextRaw = questToShow['durationTextRaw'];
    const questName = questToShow['name'];
    const author = questToShow['createdBy'];
    const questId = questToShow['questId'];
    const fromAdmin = questToShow['fromAdmin'];
    const questExpireTime = questToShow['expireAt'];

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(fromAdmin ? `${questName} - 🌟社区任务` : `${questName} - 👻玩家发布`) 
        .setAuthor({
            name: interaction.guild.members.cache.get(author).nickname,
            iconURL: `https://cdn.discordapp.com/avatars/${author}/${interaction.member.user.avatar}.png`,
            url: `https://discord.com/users/${author}`,
        })
        .setDescription(questDescription)
        // .setThumbnail(
        //     `https://cdn.discordapp.com/avatars/${author}/${interaction.member.user.avatar}.png`,
        // )
        .addFields({
            name: '任务截止时间 (UTC)',
            value: questExpireTime,
        }, {
            name: '任务发布人',
            value: `<@${author}>`,
        }, {
            name: '任务 ID',
            value: questId,
        }, {
            name: '任务列表顺序',
            value: `${questIdx}`,
        }, {
            name: '正在操作',
            value: ops,
        })
        .setTimestamp()
        .setFooter({
            text: `共${questsToShow.length}个可接任务，这是第${questIdx}个任务`,
        });

    return embed;
}


module.exports = {
    buildUserProfileEmbed,
    buildQuestListInfoEmbed,
};