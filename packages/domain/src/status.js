const transitions = {
    draft: ["performed", "cancelled"],
    performed: ["approved", "rejected", "cancelled"],
    rejected: ["performed", "cancelled"],
    approved: ["certified", "cancelled"],
    certified: [],
    cancelled: []
};
export function canTransitionStatus(from, to) {
    if (from === to) {
        return true;
    }
    return transitions[from].includes(to);
}
export function ensureStatusTransition(from, to) {
    if (!canTransitionStatus(from, to)) {
        throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
}
export function listAllowedStatusTransitions(from) {
    return [from, ...transitions[from]];
}
