const {
    Quest,
    QuestInstance,
} = require('../models/quest.js');

const {
    ExpModLog,
} = require('../models/log.js');

const {
    botErrorReply,
    sendMessageToChannel,
} = require('./guildMessages.js');

const {
    buildApproveCompletionModal,
} = require('./modalUtils.js');

const {
    missionAdminRoleID,
    missionBroadcastChannel,
} = require('../botConfig.json');

const {
    buildQuestListInfoEmbed,
    buildQuestReviewListInfoEmbed,
} = require('./embeds.js');

const {
    buildQuestInfoButtonRow,
    buildQuestDeleteButtonRow,
    buildQuestReviewButtonRow,
} = require('./componentUtils.js');


function getCurrentTime() {
    return new Date();
}

async function onQuestInstanceInfoButtonClick(interaction, supabase) {
    const questName = interaction.message.embeds[0].fields[0].value;
    const questId = interaction.message.embeds[0].fields[1].value;
    const questSubmitter = interaction.message.embeds[0].fields[2].value;
    const questIdx = parseInt(interaction.message.embeds[0].fields[3].value);
    // questSubmitter is something like <@123>, we need to remove <@ and > to get the id
    const questSubmitterId = questSubmitter.replace('<@', '').replace('>', '');

    const client = interaction.client;
    const guild = interaction.guild;
    // get quest list from the database
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
                if (interaction.customId === 'approveCompletion') {
                    const approveCompletionModal = buildApproveCompletionModal(questId, questSubmitterId, questName);
                    interaction.showModal(approveCompletionModal);
                }
                else if (interaction.customId === 'rejectCompletion') {
                    supabase.from('QuestInstance').update({ 'failAt': new Date(), 'completion': true, 'needReview': false }).eq('questId', questId).eq('dcId', questSubmitterId)
                        .then((res) => {
                            if (res.error !== null) {
                                botErrorReply(interaction);
                            }
                            console.log('QuestInstance rejectCompletion');
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                    supabase.from('Player').update({ 'currentTaskId': null }).eq('dcId', questSubmitterId).eq('guildId', guild.id)
                        .then((res) => {
                            if (res.error !== null) {
                                botErrorReply(interaction);
                            }
                            console.log('Player rejectCompletion');
                        })
                        .catch((err) => {
                            console.log(err);
                        });

                    client.users.fetch(questSubmitterId, false).then((user) => {
                        user.send('提交的任务已经被驳回！请联系任务部！');
                    });

                    interaction.reply({
                        content: `<@${questSubmitterId}> 提交的任务 ${questId} 已经被驳回！`,
                        ephemeral: true,
                    });
                }
                else {
                    const isPrevious = interaction.customId === 'previousQuestReview';
                    if (isPrevious && questIdx === 1) {
                        interaction.reply({
                            content: 'This is the first quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    else if (!isPrevious && questIdx === availableQuestData.length) {
                        interaction.reply({
                            content: 'This is the last quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    const newQuestIdx = isPrevious ? questIdx - 1 : questIdx + 1;
                    const embed = buildQuestReviewListInfoEmbed(interaction, availableQuestData, newQuestIdx);
                    const actionRow = buildQuestReviewButtonRow(1, availableQuestData.length, newQuestIdx);

                    interaction.reply({
                        content: '下列是待审核的任务列表。 \n可通过点击下方按钮查看不同待审核任务。',
                        ephemeral: true,
                        embeds: [embed],
                        components: [actionRow],
                    });
                }
            }
        })
        .catch((err) => {
            console.log(err);
        });

}


async function onQuestInfoButtonClick(interaction, supabase) {
    const questName = interaction.message.embeds[0].fields[0].value;
    const questReward = interaction.message.embeds[0].fields[1].value;
    const questId = interaction.message.embeds[0].fields[4].value;
    const questIdx = parseInt(interaction.message.embeds[0].fields[5].value);

    const client = interaction.client;
    // get quest list from the database
    supabase.from('Quest').select('*').filter('expireAt', 'gte', JSON.stringify(new Date()))
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
                // TODO: multipletakers track
                const availableQuestData = data.filter((quest) => {
                    return quest['repeatable'] === true || (quest['repeatable'] === false && quest['acceptedBy'].length === 0);
                });
                if (interaction.customId === 'acceptQuest') {
                    // check if the user has current task
                    supabase.from('QuestInstance').select('*').eq('dcId', interaction.user.id).eq('completion', false)
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
                                interaction.reply({
                                    content: '你已经有一个任务在进行中了，请先完成或者放弃任务后再接受新的任务。',
                                    ephemeral: true,
                                });
                                return;
                            }
                            else {
                                const newQuestInstance = new QuestInstance(questId, interaction.user.id);
                                newQuestInstance.questAcceptAt();
                                newQuestInstance.name = questName;

                                const questInstanceData = newQuestInstance.returnAttributeToStore();
                                // create a new quest instance
                                supabase.from('QuestInstance').insert(questInstanceData)
                                    .then((res) => {
                                        console.log(res);
                                        if (res.error === null) {
                                            // also updated the quest acceptedBy
                                            supabase.from('Player').update(
                                                { 'currentTaskId': questId },
                                            ).eq('dcId', interaction.user.id)
                                                .then((res) => {
                                                    console.log(res);
                                                });
                                            sendMessageToChannel(
                                                client,
                                                missionBroadcastChannel,
                                                `<@${interaction.user.id}> 接受了任务【${questName}】！`,
                                            );
                                            interaction.reply({
                                                content: `任务 ${questName} 已经接受成功！`,
                                                ephemeral: true,
                                            });


                                        }
                                        else {
                                            interaction.reply({
                                                content: '接受任务出错，请联系管理员。',
                                                ephemeral: true,
                                            });
                                        }
                                    });

                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }
                // TODO: not used at the moment
                else if (interaction.customId === 'deleteQuest') {
                    supabase.from('Quest').delete().eq('questId', questId)
                        .then((res) => {
                            if (res.error === null) {
                                return true;
                            }
                            else {
                                return false;
                            }
                        })
                        .then((success) => {
                            if (success) {
                                interaction.reply({
                                    content: `任务 ${questId} 已经删除成功！`,
                                    ephemeral: true,
                                });
                            }
                            else {
                                interaction.reply({
                                    content: '删除任务出错，请联系管理员。',
                                    ephemeral: true,
                                });
                            }
                        });

                }
                else {
                    const isPrevious = interaction.customId === 'previousQuest';
                    const ops = interaction.message.content.includes('删除') ? '删除' : '接受';
                    if (isPrevious && questIdx === 1) {
                        interaction.reply({
                            content: 'This is the first quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    else if (!isPrevious && questIdx === (ops === '删除' ? data.length : availableQuestData.length)) {
                        interaction.reply({
                            content: 'This is the last quest in the list.',
                            ephemeral: true,
                        });
                        return;
                    }
                    const newQuestIdx = isPrevious ? questIdx - 1 : questIdx + 1;
                    // if message content contains "删除" then ops is 删除 otherwise is 接受
                    const embed = buildQuestListInfoEmbed(interaction, ops === '删除' ? data : availableQuestData, newQuestIdx, ops);
                    const actionRow = ops === '删除' ? buildQuestDeleteButtonRow(1, data.length, newQuestIdx) : buildQuestInfoButtonRow(1, availableQuestData.length, newQuestIdx);

                    interaction.reply({
                        content: `下列是可${ops === '删除' ? '删除' : '接受'}的任务列表。 \n可通过点击下方按钮查看不同任务。`,
                        ephemeral: true,
                        embeds: [embed],
                        components: [actionRow],
                    });
                }
            }
            else {
                interaction.reply({
                    content: '现在没有可接任务。',
                    ephemeral: true,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });


}


async function onQuestApproveModalSubmit(interaction, supabase) {
    const questId = interaction.fields.getTextInputValue('questIdInput');
    const questName = interaction.fields.getTextInputValue('questNameInput');
    const questSubmitterId = interaction.fields.getTextInputValue('questSubmitterIdInput');
    const questReward = interaction.fields.getTextInputValue('questRewardInput');
    const guild = interaction.guild;
    const client = interaction.client;

    const expLog = new ExpModLog();
    expLog.setMissionId(questId);
    expLog.setExpModAmt(parseInt(questReward));
    expLog.setUpdatedBy(interaction.user.id);
    expLog.setNote(`任务【${questName}】完成奖励`);
    expLog.setTargetPlayerDcId(questSubmitterId);
    // get player dctag from guild
    const member = guild.members.cache.get(questSubmitterId);
    expLog.setTargetPlayerId(member.user.tag);

    // update quest instance
    supabase.from('QuestInstance').update({ 'completeAt': new Date(), 'completion': true, 'needReview': false }).eq('questId', questId).eq('dcId', questSubmitter)
        .then((res) => {
            if (res.error !== null) {
                botErrorReply(interaction);
            }
        })
        .catch((err) => {
            console.log(err);
        });

    // create expmodlog
    supabase.from('ExpModLog').insert(expLog.returnAttributeToStore())
        .then((res) => {
            // console.log(res);
            if (res.error !== null) {
                botErrorReply(interaction);
            }
            else {
                supabase.from('Player').select('*').eq('dcId', questSubmitterId).eq('guildId', guild.id)
                    .then((res) => {
                        // console.log(res);
                        if (res.error !== null) {
                            botErrorReply(interaction);
                        }
                        else {
                            return res['data'];
                        }
                    })
                    .then((data) => {
                        if (data && data.length > 0) {
                            const player = data[0];
                            const newExp = player['exp'] + parseInt(questReward);

                            supabase.from('Player').update({ 'exp': newExp, 'currentTaskId': null }).eq('dcId', questSubmitterId).eq('guildId', guild.id)
                                .then((res) => {
                                    if (res.error !== null) {
                                        botErrorReply(interaction);
                                    }
                                    else {
                                        console.log('Player approveCompletion');
                                        sendMessageToChannel(
                                            client,
                                            missionBroadcastChannel,
                                            `<@${questSubmitterId}> 提交的任务 【${questName}】 已经完成！\n获得奖励 ${questReward} 经验值！`,
                                        );
                                        client.users.fetch(questSubmitterId).then((user) => {
                                            user.send(`你提交的任务 【${questName}】 已经完成！\n获得奖励 ${questReward} 经验值！`);
                                        });
                                        interaction.reply({
                                            content: `你刚刚审核了 <@${questSubmitterId}> 提交的任务 【${questName}】！\n<@${questSubmitterId}> 获得奖励 ${questReward} 经验值！`,
                                            ephemeral: true,
                                        });
                                    }
                                });
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        });
}

async function onPublishQuestModalSubmit(interaction, supabase) {
    console.debug('[INFO] onSubmitQuestModalSubmit called!');
    const questNameDescription = interaction.fields.getTextInputValue('questDescriptionInput');
    const questDuration = interaction.fields.getTextInputValue('questDurationInput');
    const questReward = interaction.fields.getTextInputValue('questRewardInput');
    const questMultipleTaker = interaction.fields.getTextInputValue('questMultipleTakerInput');
    const questRepeatable = interaction.fields.getTextInputValue('questRepeatableInput');
    const submitter = interaction.user.id;

    console.debug(`[DEBUG] User ${interaction.user.id} is submitting a new quest.`);
    const questToSubmit = new Quest();
    questToSubmit.intializeQuest();
    // in questNameDescription, first line is quest name and the rest lines are quest description
    const questNameDescriptionArray = questNameDescription.split('\n');
    const questName = questNameDescriptionArray[0];
    const questDescription = questNameDescriptionArray.slice(1).join('\n');
    questToSubmit.setName(questName);
    questToSubmit.setDescription(questDescription);
    questToSubmit.setRewardText(questReward);
    questToSubmit.setMultipletakers(questMultipleTaker == 1 ? true : false);
    questToSubmit.setRepeatable(questRepeatable == 1 ? true : false);
    questToSubmit.setCreatedBy(submitter);
    questToSubmit.setDurationTextRaw(questDuration);
    questToSubmit.setCreatedAt(getCurrentTime());
    // force update
    questToSubmit.updateQuestStatus();
    if (interaction.member.roles.cache.has(missionAdminRoleID) || interaction.user.id == '1191572677165588538') {
        questToSubmit.updateQuestStatus({ adminUpdate: true });
    }
    else {
        questToSubmit.updateQuestStatus();
    }

    const newQuestData = questToSubmit.returnAttributeToStore();
    if (questToSubmit.fromAdmin) {
        supabase.from('Quest').insert(newQuestData)
            .then((res) => {
                console.debug(res);
                if (res.error === null) {
                    console.debug(`[DEBUG] Quest ${questToSubmit.questId} has been submitted by ${interaction.user.id}.\nQuest Data: ${JSON.stringify(newQuestData)}`);
                    if (questToSubmit.fromAdmin) {
                        interaction.reply({
                            content: '你的任务已经发布成功！可在任务列表中查看',
                            ephemeral: true,
                        // embeds: [buildQuestPublishEmbed(interaction, questToSubmit)],
                        });
                    }
                }
                else {
                    console.debug(JSON.stringify(res.error));
                    botErrorReply(interaction);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }
    else {
        interaction.reply({
            content: '该指令目前仅支持管理员使用！',
            ephemeral: true,
        });
    }
}

module.exports = {
    onPublishQuestModalSubmit,
    onQuestInfoButtonClick,
    onQuestInstanceInfoButtonClick,
    onQuestApproveModalSubmit,
};
