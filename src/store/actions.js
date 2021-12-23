// Web3
export function web3Loaded(connection) {
    return {
        type: 'WEB3_LOADED',
        connection
    }
}
export function web3AccountLoaded(account) {
    return {
        type: 'WEB3_ACCOUNT_LOADED',
        account
    }
}
// Token
export function tokenLoaded(contract) {
    return {
        type: 'TOKEN_LOADED',
        contract
    }
}
// Exchange
export function  exchangeLoaded(contract) {
    return {
        type: 'EXCHANGE_LOADED',
        contract
    }
}