function convertMsToDHMS(ms) {
    const days = Math.floor(ms / 86400000);
    ms -= days * 86400000;
    const hours = Math.floor(ms / 3600000);
    ms -= hours * 3600000;
    const minutes = Math.floor(ms / 60000);
    ms -= minutes * 60000;
    const seconds = Math.floor(ms / 1000);
    return { days, hours, minutes, seconds };
}

function checkMemberRole(member, roleId) {
    return member.roles.cache.has(roleId);
}


function checkMemberPermission(member, permission) {
    return member.permissions.has(permission);
}

module.exports = {
    convertMsToDHMS,
    checkMemberRole,
    checkMemberPermission,
};
