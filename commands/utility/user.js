const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');
const { getUserProfile } = require('../../utility/playerProfile.js');
const { sendMessageToChannel } = require('../../utility/guildMessages.js');
const { debugChannelId } = require('../../config.json');
const { ExpLevelMapping } = require('../../models/static.js');
const { time } = require('console');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Provides information about the user.'),
    async execute(interaction, supabase) {

        const userNickname = interaction.member.nickname ? interaction.member.nickname : interaction.user.globalName;
        const userTag = interaction.user.tag;
        const client = interaction.user.client;

        getUserProfile(interaction, supabase)
            .then((player) => {
                if (player === null) {
                    sendMessageToChannel(
                        client,
                        debugChannelId,
                        `出了一些问题， @${userTag} 的资料好像消失在了虚空之中...`,
                    );
                    return null;
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
                        level: player.level,
                        expCurrentLevel: ExpLevelMapping[player.level],
                        expCurrentUser: player.expCurrentLevel,
                        tier: player.role,
                        avatarId: interaction.user.avatar,
                    };

                    return payload;
                }
            })
            .then((payload) => {
                if (payload === null) {
                    return;
                }
                fetch('http://127.0.0.1:5000/profile_image', {
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
                }).then((res) => {
                    if (res.status === 200) {
                        return client.channels.fetch(interaction.channel.id)
                            .then((channel) => {
                                interaction.reply({
                                    content: 'TOB 刚刚努力在一堆资料中翻出了你的名片...',
                                    ephemeral: false,
                                });
                                setTimeout(() => {
                                    channel.send({
                                        files: [
                                            {
                                                attachment: `python/profile_${userNickname}.jpg`,
                                                name: 'profile.jpg',
                                            },
                                        ],
                                    });
                                }, 1500);
                            });
                    }
                    else {
                        interaction.reply({
                            content: '其实 TOB 也不知道发生了什么，但是你的名片显然是没能生成。请联系管理员或稍后再试！',
                            ephemeral: false,
                        });
                    }
                }).catch(() => {
                    interaction.reply({
                        content: '其实 TOB 也不知道发生了什么，但是你的名片显然是没能生成。请联系管理员或稍后再试！',
                        ephemeral: false,
                    });
                });

            })
            .then(() => {
                // remove python/profile.jpg after a
                fs.unlink(`python/profile_${userNickname}.jpg`, () => { return; });
            });
    },
};
