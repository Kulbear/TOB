const fs = require('fs');

const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getInteractionUserProfile } = require('../../utility/playerProfile.js');
const { sendMessageToChannel } = require('../../utility/guildMessages.js');
const { ExpLevelMapping } = require('../../models/static.js');
const { debugChannelId } = require('../../config.json');
const { dailyTextChatExpLimit, dailyVoiceChatExpLimit } = require('../../botConfig.json');
const { convertMsToDHMS } = require('../../utility/helpers.js');
const { buildUserProfileEmbed } = require('../../utility/embeds.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about the user.'),
    async execute(interaction, supabase) {

        const userNickname = interaction.member.nickname ? interaction.member.nickname : interaction.user.globalName;
        const userTag = interaction.user.tag;
        const client = interaction.user.client;

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
                    // send a post request to the python server at the given endpoint
                    // http://127.0.0.1:5000/profile_image
                    // the python server will return a response, check the status code
                    // if the status code is 200, then the image is successfully processed
                    // otherwise the image is not processed successfully
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
                            return interaction.reply({
                                content: 'TOB 刚刚在堆积如山的资料中翻出了你的档案...',
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
                fs.unlink(`python/profile_${userTag}.jpg`, () => { return; });
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
