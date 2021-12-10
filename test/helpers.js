// Error handling
export const EVM_REVERT = 'VM Exception while processing transaction: revert'

// Convert Large Number to Readable Value ('Ether')
export const tokens = (n) => {
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}

