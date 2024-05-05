const { VoiceChannelActivityRecord } = require('../models/utility');

const { accumulateExp } = require('./playerProfile.js');

const {
    dailyVoiceChatExpLimit,
    numMinuteVoiceChatExpIncrease,
} = require('../botConfig.json');

async function onVoiceChannelUserActivity(client, supabase, userId, activity) {
    // find the user in the guild by userID
    const dcTag = client.users.cache.get(userId).username;
    const voiceActRecord = new VoiceChannelActivityRecord(userId, dcTag, activity, new Date());

    if (activity === 'UserJoinVC') {
        console.debug('[DEBUG][onVoiceChannelUserActivity] UserJoinVC');
        const data = voiceActRecord.returnAttributeToStore();
        supabase.from('VoiceChannelActivityRecord').insert(data)
            .then((res) => {
                if (res.error !== null) {
                    console.error(res.error);
                }
            });
    }
    else if (activity === 'UserLeaveVC' || activity === 'UserSwitchVC') {
        console.debug(`[DEBUG][onVoiceChannelUserActivity] ${activity}`);
        supabase.from('VoiceChannelActivityRecord').select('*').eq('dcId', userId).eq('activity', 'UserJoinVC').order('timestamp', { ascending: false }).limit(1)
            .then((res) => {
                if (res.error !== null) {
                    console.error(res.error);
                }
                else {
                    return res['data'];
                }
            })
            .then((data) => {
                if (data.length === 0) {
                    console.debug('[DEBUG][onVoiceChannelUserActivity] No UserJoinVC record found.');
                    return;
                }
                const userActivity = data[0];
                voiceActRecord.updateAttributeFromStore(userActivity);
                const userJoinTimestamp = voiceActRecord['timestamp'];
                const userLeaveTimestamp = new Date();
                const userActivityDuration = userLeaveTimestamp - userJoinTimestamp;
                console.debug(`[DEBUG][onVoiceChannelUserActivity] User <@${userId}> has been in the voice channel for ${userActivityDuration} ms.`);

                // accumulate exp
                const exp = Math.floor(userActivityDuration / (1 * 60 * 1000 * numMinuteVoiceChatExpIncrease));
                const counterKey = 'voiceChatDailyCounter';
                accumulateExp(client, supabase, userId, exp, dailyVoiceChatExpLimit, counterKey);

                supabase.from('VoiceChannelActivityRecord').delete().eq('dcId', userId)
                    .then((res) => {
                        if (res.error !== null) {
                            console.error(res.error);
                        }
                    });

                voiceActRecord['activity'] = 'UserJoinVC';
                const activityData = voiceActRecord.returnAttributeToStore();
                supabase.from('VoiceChannelActivityRecord').insert(activityData)
                    .then((res) => {
                        if (res.error !== null) {
                            console.error(res.error);
                        }
                    });
            });
    }

}


module.exports = {
    onVoiceChannelUserActivity,
    accumulateExp,
};