/**
 * Returns the string value of the current network id.
 * Typical values:
 * 
 * 1        - ethereum mainnet
 * 2        - morden testnet (deprecated)
 * 3        - ropsten testnet
 * 4        - rinkeby testnet
 * 5        - goerli testnet
 * 11155111 - sepolia testnet
 * 10       - optimism mainnet
 * 69       - optimism kovan testnet
 * 42       - kovan testnet
 * 137      - matic/polygon mainnet
 * 80001    - matic/polygon mumbai testnet
 * 250      - fantom mainnet
 * 100      - xdai mainnet
 * 56       - bsc mainnet
 * 196      - X Layer mainnet
 * 5042002  - Arc testnet
 * 1440000  - XRPL EVM mainnet
 * 42429    - Tempo testnet
 */
export type NetVersion = {
    method: "net_version";
    params?: undefined;
    /** The string value of the current network id */
    result: string;
};