const {
    SlashCommandBuilder,
    PermissionsBitField,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Batch assign roles to users.')
        .addStringOption(option =>
            option.setName('role')
                .setDescription('The role id to assign to users.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('requiredlevel')
                .setDescription('The required level to assign roles')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('The mode to assign roles. Assign or remove.')
                .setRequired(true)
                .addChoices(
                    { name:'assign', value:'assign' },
                    { name:'remove', value:'remove' },
                )),
    async execute(interaction, supabase) {
        const roleId = interaction.options.getString('role');
        const lvReq = interaction.options.getInteger('requiredlevel');
        const mode = interaction.options.getString('mode');
        const guild = interaction.guild;

        if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            // select all players with level > lvReq from supabase
            supabase.from('Player').select().eq('guildId', guild.id).gte('level', lvReq)
                .then((res) => {
                    if (res.data.length === 0) {
                        console.debug('[DEBUG][Slash Command][role] No player found in the store.');
                        interaction.reply({
                            content: 'TOB 没有找到符合条件的玩家，你是不是秀逗了？',
                            ephemeral: true,
                        });
                    }
                    else {
                        // assign role to players
                        res.data.forEach((player) => {
                            const member = guild.members.cache.get(player.dcId);
                            // get the role object from guild
                            const role = guild.roles.cache.get(roleId);
                            if (mode === 'assign') {
                                member.roles.add(role);
                            }
                            else if (mode === 'remove') {
                                member.roles.remove(role);
                            }
                        });
                        interaction.reply({
                            content: 'TOB 已经帮你把角色分配好了！',
                            ephemeral: true,
                        });
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
