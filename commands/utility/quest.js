const {
    SlashCommandBuilder,
    PermissionsBitField,
} = require('discord.js');

const {
    buildQuestPublishModal,
} = require('../../utility/modalUtils.js');

const {
    checkMemberRole,
    checkMemberPermission,
} = require('../../utility/helpers.js');

const {
    buildQuestInfoEmbed,
    buildQuestListInfoEmbed,
    buildQuestReviewListInfoEmbed,
} = require('../../utility/embeds.js');

const {
    buildQuestInfoButtonRow,
    buildQuestReviewButtonRow,
} = require('../../utility/componentUtils.js');

const {
    Player,
} = require('../../models/player.js');

const {
    Quest,
    QuestInstance,
} = require('../../models/quest.js');

const {
    missionBroadcastChannel,
    missionAdminRoleID,
} = require('../../botConfig.json');

const {
    sendMessageToChannel,
    botErrorReply,
} = require('../../utility/guildMessages.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Quest related options...')
        .addStringOption(option =>
            option.setName('ops')
                .setDescription('请在列表中选择一个操作')
                .setRequired(true)
                .addChoices(
                    { name:'publish', value:'publish' },
                    { name:'review', value:'review' },
                    { name:'complete', value:'complete' },
                    { name:'list', value:'list' },
                    { name:'info', value:'info' },
                    { name:'abandon', value:'abandon' },
                )),
    async execute(interaction, supabase) {
        if (interaction.options.getString('ops') === 'publish') {
            console.debug('[DEBUG] "/quest publish" command received.');

            const modal = buildQuestPublishModal();

            // expected to be handled by onPublishQuestModalSubmit
            interaction.showModal(modal);
        }
        if (interaction.options.getString('ops') === 'review') {
            console.debug('[DEBUG] "/quest review" command received.');


            if (checkMemberRole(interaction.member, missionAdminRoleID) || checkMemberPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
                // const now = new Date();
            // select quest that is not expired based on the expiredAt column, which is a datetime column
                supabase.from('QuestInstance').select('*').eq('completion', false).eq('needReview', true)
                    .then((res) => {
                        if (res.error !== null) {
                            botErrorReply(interaction);
                        }
                        else {
                            return res['data'];
                        }
                    })
                    .then((data) => {
                        if (data && data.length > 0) {
                            const availableQuestData = data;
                            const embed = buildQuestReviewListInfoEmbed(interaction, availableQuestData, 1);

                            const actionRow = buildQuestReviewButtonRow(1, availableQuestData.length, 1);

                            interaction.reply({
                                content: '下列是可审核的任务列表。\n可通过点击下方按钮查看不同任务。',
                                ephemeral: true,
                                embeds: [embed],
                                components: [actionRow],
                            });
                        }
                        else {
                            interaction.reply({
                                content: '现在没有可审核任务。',
                                ephemeral: true,
                            });
                        }
                    });
            }
            else {
                interaction.reply({
                    content: '你没有权限执行这个命令！',
                    ephemeral: true,
                });
            }
        }
        if (interaction.options.getString('ops') === 'complete') {
            console.debug('[DEBUG] "/quest complete" command received.');

            // check if the user has a current task
            // if not, return an error message
            // if yes, notify the admin channel this quest is pending review
            const user = interaction.user;
            const guild = interaction.guild;
            const client = interaction.client;

            supabase.from('Player').select().eq('dcId', user.id).eq('guildId', guild.id)
                .then((res) => {
                    if (res.data.length === 0) {
                        console.debug(`[DEBUG][Quest Complete] ${user.tag} is not found in the store.`);
                        return null;
                    }
                    else {
                        const player = new Player(res.data[0].dcId, res.data[0].dcTag, guild.id);
                        player.updateAttributeFromStore(res.data[0]);
                        return player;
                    }
                })
                .then((player) => {
                    if (player.currentTaskId === null) {
                        interaction.reply({
                            content: '你没有正在进行的任务！',
                            ephemeral: true,
                        });
                    }
                    else {
                        // notify the admin channel
                        const questId = player.currentTaskId;
                        supabase.from('QuestInstance').select().eq('dcId', player.dcId).eq('questId', questId).eq('completion', false)
                            .then((res) => {
                                if (res.data.length === 0) {
                                    console.debug(`[DEBUG][Quest Complete] ${player.dcTag} has a task but the task is not found in the store.`);
                                    return null;
                                }
                                else {
                                    const quest = new QuestInstance(questId, player.dcId);
                                    quest.updateAttributeFromStore(res.data[0]);
                                    return quest;
                                }
                            })
                            .then((quest) => {
                                if (quest === null) {
                                    interaction.reply({
                                        content: '任务实例出现了神秘的错误，请联系管理员！',
                                        ephemeral: true,
                                    });
                                }
                                else {
                                    quest.needReview = true;
                                    supabase.from('QuestInstance').update({ 'needReview': true }).eq('dcId', player.dcId).eq('questId', questId).eq('completion', false)
                                        .then((res) => {
                                            if (res.error !== null) {
                                                botErrorReply(interaction);
                                            }
                                        });
                                }
                            });


                        supabase.from('Quest').select().eq('questId', questId)
                            .then((res) => {
                                if (res.data.length === 0) {
                                    console.debug(`[DEBUG][Quest Complete] ${player.dcTag} has a task but the task is not found in the store.`);
                                    return null;
                                }
                                else {
                                    const quest = new Quest();
                                    quest.updateAttributeFromStore(res.data[0]);
                                    return quest;
                                }
                            }).then((quest) => {
                                if (quest === null) {
                                    interaction.reply({
                                        content: '出现了神秘的错误，请联系管理员！',
                                        ephemeral: true,
                                    });
                                }
                                else {
                                    sendMessageToChannel(
                                        client,
                                        missionBroadcastChannel,
                                        `<@${user.id}> 已经完成任务【${quest.name}】，现在等待审核中...`,
                                    );
                                    interaction.reply({
                                        content: `TOB 已经为你通知管理员审核任务【${quest.name}】！`,
                                        ephemeral: true,
                                    });
                                }
                            });
                    }

                });

        }
        if (interaction.options.getString('ops') === 'list') {
            console.debug('[DEBUG] "/quest list" command received.');

            const now = new Date();
            // select quest that is not expired based on the expiredAt column, which is a datetime column
            supabase.from('Quest').select('*').filter('expireAt', 'gte', JSON.stringify(now))
                .then((res) => {
                    if (res.error !== null) {
                        botErrorReply(interaction);
                    }
                    else {
                        return res['data'];
                    }
                })
                .then((data) => {
                    if (data && data.length > 0) {
                        const availableQuestData = data.filter((quest) => {
                            return quest['repeatable'] === true || (quest['repeatable'] === false && quest['acceptedBy'].length === 0);
                        });
                        const embed = buildQuestListInfoEmbed(interaction, availableQuestData, 1, '接受');

                        const actionRow = buildQuestInfoButtonRow(1, availableQuestData.length, 1);

                        interaction.reply({
                            content: '下列是可接受的任务列表。 \n可通过点击下方按钮查看不同任务。',
                            ephemeral: true,
                            embeds: [embed],
                            components: [actionRow],
                        });
                    }
                    else {
                        interaction.reply({
                            content: '现在没有可接任务。',
                            ephemeral: true,
                        });
                    }
                });
        }
        if (interaction.options.getString('ops') === 'info') {
            console.debug('[DEBUG] "/quest info" command received.');

            const user = interaction.user;
            const guild = interaction.guild;

            supabase.from('Player').select().eq('dcId', user.id).eq('guildId', guild.id)
                .then((res) => {
                    if (res.data.length === 0) {
                        console.debug(`[DEBUG][Quest Info] ${user.tag} is not found in the store.`);
                        return null;
                    }
                    else {
                        const player = new Player(res.data[0].dcId, res.data[0].dcTag, guild.id);
                        player.updateAttributeFromStore(res.data[0]);
                        return player;
                    }
                })
                .then((player) => {
                    const currentTaskId = player.currentTaskId;
                    if (currentTaskId === null || currentTaskId === '') {
                        interaction.reply({
                            content: '你没有正在进行的任务！',
                            ephemeral: true,
                        });
                    }
                    else {
                        supabase.from('Quest').select().eq('questId', currentTaskId)
                            .then((res) => {
                                if (res.data.length === 0) {
                                    console.debug(`[DEBUG][Quest Info] ${player.dcTag} has a task but the task is not found in the store.`);
                                    return null;
                                }
                                else {
                                    const quest = new Quest();
                                    quest.updateAttributeFromStore(res.data[0]);
                                    return quest;
                                }
                            })
                            .then((quest) => {
                                if (quest === null) {
                                    interaction.reply({
                                        content: '任务实例出现了神秘的错误，请联系管理员！',
                                        ephemeral: true,
                                    });
                                }
                                else {
                                    const embed = buildQuestInfoEmbed(quest);
                                    interaction.reply({
                                        content: '下列是你正在进行的任务信息。',
                                        ephemeral: true,
                                        embeds: [embed],
                                    });
                                }
                            });
                    }
                });
        }
        if (interaction.options.getString('ops') === 'abandon') {
            console.debug('[DEBUG] "/quest abandon" command received.');

            const user = interaction.user;
            const guild = interaction.guild;
            const client = interaction.client;

            supabase.from('Player').select().eq('dcId', user.id).eq('guildId', guild.id)
                .then((res) => {
                    if (res.data.length === 0) {
                        console.debug(`[DEBUG][Quest Abandon] ${user.tag} is not found in the store.`);
                        return null;
                    }
                    else {
                        const player = new Player(res.data[0].dcId, res.data[0].dcTag, guild.id);
                        player.updateAttributeFromStore(res.data[0]);
                        return player;
                    }
                })
                .then((player) => {
                    const currentTaskId = player.currentTaskId;
                    if (currentTaskId === null || currentTaskId === '') {
                        interaction.reply({
                            content: '你没有正在进行的任务！',
                            ephemeral: true,
                        });
                    }
                    else {
                        supabase.from('Player').update({ 'currentTaskId': null }).eq('dcId', player.dcId).eq('guildId', guild.id)
                            .then((res) => {
                                if (res.error !== null) {
                                    botErrorReply(interaction);
                                }
                            });

                        supabase.from('QuestInstance').select().eq('dcId', player.dcId).eq('questId', currentTaskId).eq('completion', false)
                            .then((res) => {
                                if (res.error !== null) {
                                    botErrorReply(interaction);
                                }
                                else {
                                    return res['data'];
                                }
                            })
                            .then((data) => {
                                if (data && data.length > 0) {
                                    supabase.from('QuestInstance').update({ 'failAt': new Date(), 'completion': true }).eq('dcId', player.dcId).eq('questId', currentTaskId).eq('completion', false)
                                        .then((res) => {
                                            if (res.error !== null) {
                                                botErrorReply(interaction);
                                            }
                                            else {
                                                sendMessageToChannel(
                                                    client,
                                                    missionBroadcastChannel,
                                                    `@${user.username} 已经放弃任务【${data[0].name}】！`,
                                                );

                                                interaction.reply({
                                                    content: '你当前的任务已经被放弃！',
                                                    ephemeral: true,
                                                });
                                            }
                                        });
                                }

                            });


                    }
                });
        }
    },
};