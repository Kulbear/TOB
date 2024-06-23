const {
    SlashCommandBuilder,
    AttachmentBuilder,
} = require('discord.js');

const {
    getInteractionUserProfile,
} = require('../../utility/playerProfile.js');

const {
    sendMessageToChannel,
} = require('../../utility/guildMessages.js');

const {
    ExpLevelMapping,
} = require('../../models/static.js');

const {
    debugChannelId,
} = require('../../config.json');

const {
    dailyTextChatExpLimit,
    dailyVoiceChatExpLimit,
} = require('../../botConfig.json');

const {
    convertMsToDHMS,
} = require('../../utility/helpers.js');

const {
    buildUserProfileEmbed,
} = require('../../utility/embeds.js');

const {
    gameRoleIDs,
    guideReadRoleID,
    ruleReadRoleID,
    botCommandChannel,
} = require('../../botConfig.json');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides profile card for the user.'),
    async execute(interaction, supabase) {
        const member = interaction.member;
        let userNickname = interaction.member.nickname ? interaction.member.nickname : interaction.user.globalName;
        if (!userNickname) {
            userNickname = interaction.user.username;
        }
        const userTag = interaction.user.tag;
        const client = interaction.user.client;
        // get the channel id where the interaction is created
        if (interaction.channelId !== botCommandChannel) {
            await interaction.reply({
                content: `由于 TOB 的放射性危害，有关部门已经规定:\nTOB 的 \`/user\` 指令需要前往 <#${botCommandChannel}> 执行！`,
                ephemeral: true,
            });
            return;
        }

        getInteractionUserProfile(interaction, supabase)
            .then((res) => {
                const player = res.player;
                const counter = res.counter;
                if (player === null) {
                    sendMessageToChannel(
                        client,
                        debugChannelId,
                        `出了一些问题，@${userTag} 的资料好像消失在了虚空之中...`,
                    );
                    return { payload: null, counter: null };
                }
                else {
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
                        const payload = {
                            dcName: userNickname,
                            dcId: player.dcId,
                            dcTag: userTag,
                            level: player.level,
                            expCurrentLevel: ExpLevelMapping[player.level],
                            expCurrentUser: player.expCurrentLevel,
                            tier: player.role,
                            avatarId: interaction.user.avatar,
                        };
                        return { payload: payload, counter: counter };
                    }
                    else {
                        const payload = {
                            dcName: userNickname,
                            dcId: player.dcId,
                            dcTag: userTag,
                            level: 0,
                            expCurrentLevel: 0,
                            expCurrentUser: 0,
                            tier: player.role,
                            avatarId: interaction.user.avatar,
                        };
                        return { payload: payload, counter: counter };
                    }

                }
            })
            .then((res) => {
                const payload = res.payload;
                const counter = res.counter;
                if (payload === null) {
                    return;
                }
                fetch('http://127.0.0.1:5000/profile_image',
                    {
                        method: 'POST',
                        mode: 'cors',
                        cache: 'no-cache',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        redirect: 'follow',
                        referrerPolicy: 'no-referrer',
                        body: JSON.stringify(payload),
                    })
                    .then((res) => {
                        const expireDate = new Date(counter.lastResetTime);
                        expireDate.setHours(counter.lastResetTime.getHours() + 22);
                        const { days, hours, minutes } = convertMsToDHMS(expireDate - new Date());
                        const diffStr = (days > 0 ? `${days} 天 ` : '') + (hours > 0 ? `${hours} 小时 ` : '') + (minutes > 0 ? `${minutes} 分钟 ` : '') + '后';

                        const profileCardImage = new AttachmentBuilder(`python/profile_${userTag}.jpg`, { name: `profile_${userTag}.jpg` });
                        const embed = buildUserProfileEmbed({
                            userNickname: userNickname,
                            userTag: userTag,
                            dailyTextChatExpLimit: dailyTextChatExpLimit,
                            dailyVoiceChatExpLimit: dailyVoiceChatExpLimit,
                            counter: counter,
                            diffStr: diffStr,
                        });

                        if (res.status === 200) {
                            const replayStr = payload.level === 0 ? 'TOB 刚刚在堆积如山的资料中翻出了你的档案...\n根据资料显示，你已有的经验和等级数据保存完好，但你需要完成初始任务来继续积累经验）\n1. 阅读【社区规则】并点击下方反应\n2. 阅读【频道指南】并点击下方反应\n3. 通过【领身份组】获取至少三个游戏的身份组' : 'TOB 刚刚在堆积如山的资料中翻出了你的档案...';
                            return interaction.reply({
                                content: replayStr,
                                ephemeral: false,
                                embeds: [embed],
                                files: [profileCardImage],
                            });
                        }
                        else {
                            interaction.reply({
                                content: 'TOB 费了九牛二虎之力也没有找到你的信息。请联系管理员或稍后再试！',
                                ephemeral: false,
                            });
                        }
                    });
            })
            .then(() => {
                // fs.unlink(`python/profile_${userTag}.jpg`, () => { return; });
            })
            .catch((err) => {
                console.error(err);
                interaction.reply({
                    content: 'TOB 的内核出现了损毁。请联系管理员或立即报警（千万别）！',
                    ephemeral: false,
                });
            });
    },
};
