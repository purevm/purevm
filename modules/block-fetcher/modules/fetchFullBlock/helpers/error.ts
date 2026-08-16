/**
 * Logs an RPC error
 * @param name - The name of the promise
 * @returns A function that logs an RPC error
 */
export function rpcError(name: string): (err: any) => void {
    return (err: any) => {
        console.error(`${name} fetch failed:`, err);
    };
}