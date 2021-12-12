export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

// Error handling
export const EVM_REVERT = 'VM Exception while processing transaction: revert'

// Convert Large Number to Readable Value ('Ether')
export const ether = (n) => {
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}

// Same as  Ether
export const tokens = (n) => ether(n)

