export function canReadJob(user, job) {
    if (user.role === "admin" || user.role === "dispatcher") {
        return true;
    }
    if (user.role === "client") {
        return user.client_uid !== "" && user.client_uid === job.client_uid;
    }
    if (user.role === "technician") {
        return user.technician_uid !== "" && user.technician_uid === job.technician_uid;
    }
    return false;
}
export function canRequestSchedule(role) {
    return role === "client" || role === "dispatcher" || role === "admin";
}
export function canConfirmSchedule(role) {
    return role === "dispatcher" || role === "admin";
}
export function canGenerateDocument(role) {
    return role === "technician" || role === "dispatcher" || role === "admin";
}
export function canPublishDocument(role) {
    return role === "dispatcher" || role === "admin";
}
export function canUseAdmin(role) {
    return role === "admin";
}
export function canUpdateJobStatus(user, job, requestedStatus) {
    if (user.role === "admin" || user.role === "dispatcher") {
        return true;
    }
    if (user.role === "technician") {
        // Technician must be assigned to the job
        if (user.technician_uid === "" || user.technician_uid !== job.technician_uid) {
            return false;
        }
        // Technician can only transition to 'performed' or 'cancelled'
        if (requestedStatus && !["performed", "cancelled"].includes(requestedStatus)) {
            return false;
        }
        return true;
    }
    return false;
}
export function canWriteJobNote(user, job) {
    return canUpdateJobStatus(user, job);
}
