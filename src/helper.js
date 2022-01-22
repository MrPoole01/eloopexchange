export const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";
export const GREEN = 'success'
export const RED = 'danger'

export const DECIMALS = (10**18)

// Shortcut to avoid passing a web3 connection
export const ether = (wei) => {
    if(wei) {
        return (wei / DECIMALS)
    }
}

// Tokens and ether have the same decimal  resolution
export const tokens = ether

