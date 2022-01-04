import { get } from 'lodash'
import { createSelector } from "reselect"

const account = state => get(state, 'web3.account')
// const account = state => get(state, "web3.connection.currentProvider.selectedAddress")
export const accountSelector = createSelector(account, acct => acct)

const tokenLoaded = state => get(state, 'token.loaded', false)
export const tokenLoadedSelector = createSelector(tokenLoaded, tknld => tknld)

const exchangeLoaded = state => get(state, 'exchange.loaded', false)
export const exchangeLoadedSelector = createSelector(exchangeLoaded, exchld => exchld)

export const contractsLoadedSelector =  createSelector(
    tokenLoaded, 
    exchangeLoaded,
    (tknld, exchld) => (tknld && exchld)
)
