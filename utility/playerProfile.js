const { Player } = require('../models/player.js');
const { Counter } = require('../models/utility.js');

async function onGuildAvailableInfoLog(guild) {
    console.debug('[DEBUG][onGuildAvailableInfoLog]');
    console.debug(`Guild available: ${guild.name}`);
    console.debug(`Guild ID: ${guild.id}`);
    console.debug(`Guild member count: ${guild.memberCount}`);
    console.debug(`Guild owner: ${guild.ownerId}`);
}

async function onGuildAvailableScanUsers(guild) {
    console.debug('[DEBUG][onGuildAvailableScanUsers]');
    guild.members.fetch().then((members) => {
        members.forEach(member => {
            console.debug(`\nMember: ${member.user.id} | ${member.user.tag}`);
        });
    }).catch(console.error);
}

async function addUserToStore(member, guild, supabase) {
    console.debug('[DEBUG][addUserToStore]', member.user.tag, guild.id);
    // skip bot users
    if (member.user.bot) {
        console.debug(`[DEBUG] ${member.user.tag} is a bot user. Skipping.`);
        return;
    }
    console.debug(`[DEBUG] ${member.user.tag} is not found in the store.`);
    const player = new Player(member.user.id, member.user.tag, guild.id);
    const playerData = player.returnAttributeToStore();
    supabase.from('Player').insert(playerData)
        .then((r) => {
            console.debug(`[DEBUG] Inserted data ${JSON.stringify(r)}.`);
        });
}

async function onUserAddToGuild(member, guild, supabase) {
    console.debug('[DEBUG][onUserAddToGuild]', member.user.tag, guild.name);
    supabase.from('Player').select().eq('dcId', member.user.id).eq('guildId', guild.id)
        .then((res) => {
            if (res.data.length === 0) {
                addUserToStore(member, guild, supabase);
            }
            else {
                console.debug(`[DEBUG] ${member.user.tag} is found in the store. No action is taken!`);
            }
        });
}

async function onUserRemoveFromGuild(member, guild, supabase) {
    console.debug('[DEBUG][onUserRemoveFromGuild]', member.user.tag, guild.name);
    supabase.from('Player').delete().eq('dcId', member.user.id).eq('guildId', guild.id)
        .then((res) => {
            console.debug(`[DEBUG] Removed user data ${JSON.stringify(res)}.`);
        });
}

async function onGuildAvailableBatchInitUsers(guild, supabase) {
    console.debug('[DEBUG][onGuildAvailableBatchInitUsers]', guild.name);
    guild.members.fetch().then((members) => {
        // for every user check if supabase has the user data in Player table
        // if yes, fetch the data, store to a variable
        // if no, create a new player profile
        // then update the player profile to the store
        members.forEach(member => {
            supabase.from('Player').select().eq('dcId', member.user.id).eq('guildId', guild.id)
                .then((res) => {
                    if (res.error !== null) {
                        console.error(res.error);
                    }
                    if (res.data.length === 0) {
                        addUserToStore(member, guild, supabase);
                    }
                });
        });
    });
}

async function getUserProfile(interaction, supabase) {
    const user = interaction.user;
    const guild = interaction.guild;
    return supabase.from('Player').select().eq('dcId', user.id).eq('guildId', guild.id)
        .then((res) => {
            if (res.data.length === 0) {
                return null;
            }
            else {
                const player = new Player(res.data[0].dcId, res.data[0].dcTag, guild.id);
                player.updateAttributeFromStore(res.data[0]);

                // also update the player profile
                supabase.from('Player').update(player.returnAttributeToStore()).eq('dcId', player.dcId).eq('guildId', guild.id)
                    .then((res) => {
                        if (res.error !== null) {
                            console.error(res.error);
                        }
                    });

                console.debug(JSON.stringify(player));
                return player;
            }
        });
}

async function updateUserExp(supabase, player, dcId, expChange) {
    console.debug('[DEBUG][updateUserExp]', dcId, expChange);
    const currentExp = player['exp'];
    supabase.from('Player').update({ 'exp': currentExp + expChange }).eq('dcId', dcId).eq('guildId', player.guildId)
        .then((res) => {
            if (res.error !== null) {
                console.error(res.error);
            }
            else {
                console.debug(`[DEBUG][updateUserExp] Exp for ${dcId} updated by ${expChange}, Current Exp: ${currentExp + expChange}`);
            }
        });
}

async function accumulateExp(client, supabase, userId, exp, expDailyLimit, counterKey) {
    console.debug('[DEBUG][accumulateExp]', userId, exp, expDailyLimit, counterKey);
    const dcTag = client.users.cache.get(userId).username;
    console.log(client.guilds.cache);
    supabase.from('Counter').select('*').eq('dcId', userId)
        .then((res) => {
            if (res.error !== null) {
                console.error(res.error);
            }
            else {
                return res['data'];
            }
        })
        .then((data) => {
            const counter = new Counter();
            if (data && data.length > 0) {
                const counterData = data[0];
                counter.updateAttributeFromStore(counterData);
                console.debug('[DEBUG][accumulateExp] Counter found: ', counter.returnAttributeToStore());
                // check if need reset
                const today = new Date();
                // 86400000 is 24 hours in milliseconds
                if (today - counter.lastResetTime > 86400000) {
                    console.debug('[DEBUG][accumulateExp] Reset Daily Counter', today);
                    counter.resetDaily();
                }

                console.debug('[DEBUG][accumulateExp] Counter before update:', counter.returnAttributeToStore());
                const actualExpChange = (counter[counterKey] + exp) >= expDailyLimit ? expDailyLimit - counter[counterKey] : exp;
                console.debug('[DEBUG][accumulateExp] Actual Exp Change:', actualExpChange);
                counter[counterKey] += actualExpChange;
                const counterToStore = counter.returnAttributeToStore();
                console.debug('[DEBUG][accumulateExp] Counter after update:', counter.returnAttributeToStore());
                supabase.from('Counter').update(counterToStore).eq('dcId', userId)
                    .then((res) => {
                        if (res.error !== null) {
                            console.error(res.error);
                        }
                        else {
                            console.debug(`Counter for ${userId} updated. Current Daily Counter: `, counter.returnAttributeToStore());
                        }
                    });
                return actualExpChange;
            }
            else {
                // setup a new counter
                console.debug('[DEBUG][accumulateExp] New counter setup.');
                counter.setDcId(userId);
                counter.setDcTag(dcTag);
                counter.resetDaily();

                console.debug('[DEBUG][accumulateExp] Counter before update:', counter.returnAttributeToStore());
                const actualExpChange = (counter[counterKey] + exp) >= expDailyLimit ? expDailyLimit - counter[counterKey] : exp;
                counter[counterKey] += actualExpChange;
                const counterToStore = counter.returnAttributeToStore();
                console.debug('[DEBUG][accumulateExp] Counter after update:', counter.returnAttributeToStore());

                supabase.from('Counter').insert(counterToStore)
                    .then((res) => {
                        if (res.error !== null) {
                            console.error(res.error);
                        }
                        else {
                            console.debug(`[DEBUG][accumulateExp] Counter for ${userId} inserted. Current Daily Counter:`, counter.returnAttributeToStore());
                        }
                    });

                return actualExpChange;
            }

        })
        .then((actualExpChange) => {
            supabase.from('Player').select('*').eq('dcId', userId)
                .then((res) => {
                    if (res.error !== null) {
                        console.error(res.error);
                    }
                    else {
                        return res['data'];
                    }
                })
                .then((data) => {
                    if (data && data.length > 0) {
                        const player = data[0];
                        updateUserExp(supabase, player, userId, actualExpChange);
                    }
                });
        });

}


module.exports = {
    onGuildAvailableInfoLog,
    onGuildAvailableScanUsers,
    onGuildAvailableBatchInitUsers,
    onUserAddToGuild,
    onUserRemoveFromGuild,
    getUserProfile,
    updateUserExp,
    accumulateExp,
};