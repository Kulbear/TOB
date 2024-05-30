const { SlashCommandBuilder } = require('discord.js');
const { Player } = require('../../models/player.js');
const { ExpModLog } = require('../../models/log.js');
const { missionAdminRoleID } = require('../../botConfig.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('expmod')
        .setDescription('Modify the exp of a player.')
        .addStringOption(option =>
            option.setName('usertag')
                .setDescription('The user to modify exp for.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('exp')
                .setDescription('The amount of exp to modify.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('note')
                .setDescription('The reason to modify exp, optional.')
                .setRequired(true)),
    async execute(interaction, supabase) {
        // check role first, only with 任务部 tag
        const expAmt = interaction.options.getInteger('exp');
        const userDCTag = interaction.options.getString('usertag');
        const note = interaction.options.getString('note');
        const guild = interaction.guild;

        if (interaction.member.roles.cache.has(missionAdminRoleID) || interaction.user.id == '1191572677165588538') {
            const log = new ExpModLog();
            log.setUpdatedBy(interaction.user.id);
            log.setExpModAmt(expAmt);
            log.setNote(note);
            log.setTargetPlayerId(userDCTag);

            // find the user from the database
            supabase.from('Player').select().eq('dcTag', interaction.user.username).eq('guildId', guild.id)
                .then((res) => {
                    if (res.data.length === 0) {
                        console.debug(`[DEBUG][Slash Command][expmod] ${userDCTag} is not found in the store.`);
                        return null;
                    }
                    else {
                        const player = new Player(res.data[0].dcId, res.data[0].dcTag, guild.id);
                        player.updateAttributeFromStore(res.data[0]);
                        player.updateExp(expAmt);
                        // also update the player profile
                        supabase.from('Player').update(player.returnAttributeToStore()).eq('dcTag', interaction.user.username).eq('guildId', guild.id)
                            .then((res) => {
                                if (res.error !== null) {
                                    console.error(res.error);
                                }
                                else {
                                    // also update exp mod log
                                    supabase.from('ExpModLog').insert(log.returnAttributeToStore())
                                        .then((res) => {
                                            if (res.error !== null) {
                                                console.error(res.error);
                                            }
                                            else {
                                                interaction.reply({
                                                    content: `成功变更了 ${userDCTag} 的经验值 ${expAmt} 点！`,
                                                    ephemeral: false,
                                                });
                                            }
                                        });
                                }
                            });

                        return player;
                    }
                });
        }
        else {
            await interaction.reply({
                content: 'TOB 对你爱搭不理，也许是你没有权限做这件事！',
                ephemeral: true,
            });
        }
    },
};
