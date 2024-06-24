const {
    EmbedBuilder,
} = require('discord.js');


function buildQuestInfoEmbed(questToShow) {
    const questName = questToShow['name'];
    const questDescription = questToShow['description'] ? questToShow['description'] : '无';
    const author = questToShow['createdBy'];
    const questExpireAt = questToShow['expireAt'];
    const questReward = questToShow['rewardText'];

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(questName)
        .setDescription(questDescription)
        .addFields(
            {
                name: '任务截止时间',
                value: `${questExpireAt}`,
            },
            {
                name: '任务发布人',
                value: `<@${author}>`,
            },
            {
                name: '任务奖励',
                value: questReward,
            },
        )
        .setTimestamp()
        .setFooter(
            {
                text: '🤖 TOB is watching you!',
            },
        );

    return embed;
}

function buildUserProfileEmbed(payload) {
    const {
        userNickname,
        userTag,
        dailyTextChatExpLimit,
        dailyVoiceChatExpLimit,
        counter,
        diffStr,
    } = payload;

    const embed = new EmbedBuilder()
        .setTitle(`⭐丨${userNickname} 的机密档案已经泄露...丨⭐`)
        .setImage(`attachment://profile_${userTag}.jpg`)
        .addFields(
            {
                name: '今日发言剩余经验',
                value: `${dailyTextChatExpLimit - counter.textChatDailyCounter}`,
                inline: true,
            },
            {
                name: '今日语音剩余经验',
                value: `${dailyVoiceChatExpLimit - counter.voiceChatDailyCounter}`,
                inline: true,
            },
            {
                name: '重置时间',
                value: `${diffStr}`,
                inline: true,
            },
        )
        .setColor('#7A76EB')
        .setTimestamp()
        .setFooter(
            {
                text: '🤖 TOB is watching you!',
            },
        );

    return embed;
}

function buildQuestReviewListInfoEmbed(
    interaction,
    questsToShow,
    questIdx = 1,
) {
    const questToShow = questsToShow[questIdx - 1];
    const questId = questToShow['questId'];
    const questName = questToShow['name'];
    const submitter = questToShow['dcId'];

    const member = interaction.guild.members.cache.get(submitter);
    const displayName = (member.nickname ? member.nickname : member.user.globalName) || member.user.username;

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`任务审核 - ${questName}`)
        .setAuthor(
            {
                name: displayName,
                iconURL: `https://cdn.discordapp.com/avatars/${submitter}/${member.user.avatar}.png`,
                url: `https://discord.com/users/${submitter}`,
            },
        )
        .addFields(
            {
                name: '任务名称',
                value: questName,
            },
            {
                name: '任务 ID',
                value: questId,
            },
            {
                name: '提交人',
                value: `<@${submitter}>`,
            },
            {
                name: '任务列表顺序',
                value: `${questIdx}`,
            },
        )
        .setTimestamp()
        .setFooter(
            {
                text: `共${questsToShow.length}个待审核任务，这是第${questIdx}个任务`,
            },
        );

    return embed;
}

function buildQuestListInfoEmbed(
    interaction,
    questsToShow,
    questIdx = 1,
    ops = '接受',
) {
    const questToShow = questsToShow[questIdx - 1];
    const questDescription = questToShow['description'] ? questToShow['description'] : '无';
    const questName = questToShow['name'];
    const questReward = questToShow['rewardText'];
    const author = questToShow['createdBy'];
    const questId = questToShow['questId'];
    const fromAdmin = questToShow['fromAdmin'];
    const questExpireTime = questToShow['expireAt'];

    const member = interaction.guild.members.cache.get(author);
    const displayName = (member.nickname ? member.nickname : member.user.globalName) || member.user.username;

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor(
            {
                name: fromAdmin ? '社区任务板最新发布！' : displayName,
                iconURL: fromAdmin ? interaction.guild.iconURL() : `https://cdn.discordapp.com/avatars/${author}/${member.user.avatar}.png`,
                url: `https://discord.com/users/${author}`,
            },
        )
        .setDescription(questDescription)
        .addFields(
            {
                name: '任务名称',
                value: questName,
            },
            {
                name: '任务奖励',
                value: questReward,
            },
            {
                name: '任务截止时间 (UTC)',
                value: questExpireTime,
            },
            {
                name: '任务发布人',
                value: `<@${author}>`,
            },
            {
                name: '任务 ID',
                value: questId,
                inline: true,
            },
            {
                name: '任务列表顺序',
                value: `${questIdx}`,
                inline: true,
            },
            {
                name: '正在操作',
                value: ops,
                inline: true,
            },
        )
        .setTimestamp()
        .setFooter(
            {
                text: `共${questsToShow.length}个可接任务，这是第${questIdx}个任务`,
            },
        );

    return embed;
}


module.exports = {
    buildUserProfileEmbed,
    buildQuestInfoEmbed,
    buildQuestListInfoEmbed,
    buildQuestReviewListInfoEmbed,
};