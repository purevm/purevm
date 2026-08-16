// ===========================================================
// Private Functions
// ===========================================================

export function getPathKey(path: number[]): string {
    return path.join('.');
}

export function getEffectiveError(path: number[], errors: Record<string, string>): string | undefined {
    for (let i = path.length; i >= 0; i--) {
        const subpath = path.slice(0, i);
        const key = getPathKey(subpath);
        const error = errors[key];

        if (error) {
            return error;
        }
    }
    return undefined;
}
