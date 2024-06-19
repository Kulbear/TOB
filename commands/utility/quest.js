const {
    SlashCommandBuilder,
} = require('discord.js');

const {
    buildQuestPublishModal,
} = require('../../utility/modalUtils.js');
const {
    Player,
} = require('../../models/player.js');
const {
    Quest,
} = require('../../models/quest.js');
const {
    missionBroadcastChannel,
} = require('../../botConfig.json');
const {
    sendMessageToChannel,
} = require('../../utility/guildMessages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Quest related options...')
    // Subcommand for general users
        .addStringOption(option =>
            option.setName('ops')
                .setDescription('[General] Publish a quest...')
                .setRequired(true)
                .addChoices(
                    { name:'publish', value:'publish' },
                    { name:'review', value:'review' },
                    { name:'complete', value:'complete' },
                    { name:'list', value:'list' },
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
        }
    },
};