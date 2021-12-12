import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from './helpers';

// Pull in Token
const Token = artifacts.require('./Token');

// Pull in Exchange
const Exchange = artifacts.require('./Exchange');

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Exchange', ([deployer, feeAccount, user1]) => {
    let token
    let exchange
    const feePercent = 10

    beforeEach(async () => {
        // Fetch token from blockchain - Deploy Token
        token = await Token.new()
        // Test transfer token to user1
        token.transfer(user1, tokens(100), { from: deployer })
        // Fetch Exchange Info - Deploy Exchange
         exchange = await Exchange.new(feeAccount, feePercent)
    })

    describe('deployment', () => {
        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })
        it('tracks the fee percent', async () => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
    })

    describe('depositing Ether', async () => {
        let result
        let amount

        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({ from: user1, value: amount })
        })
    } )

    describe('depositing tokens', () => {
        let result
        let amount

      describe('succces', () => {

         // Test to see if token is approved
         beforeEach(async () => {
            amount = tokens(10)
            await token.approve(exchange.address, amount, { from: user1 })
            result = await exchange.depositToken(token.address, amount, { from: user1 })
        })
        
          it('tracks the token deposit', async () => {
            let balance

            // Check exchange token balance
            balance = await token.balanceOf(exchange.address)
            balance.toString().should.equal(amount.toString())
            // Check user token balance
            balance = await exchange.tokens(token.address, user1)
            balance.toString().should.equal(amount.toString())
          })

          it('emits a Deposit event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Deposit')
            const event = log.args
            event.token.toString().should.equal(token.address, 'token address is correct')
            event.user.should.equal(user1, 'user address is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
      })

      describe('failure', () => {
        it('rejects Ether deposits', async () => {
            await exchange.depositToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
        it('fails when the tokens are approved', async () => {
            // Don't approve any tokens before deposit
            await exchange.depositToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
      })
    })
})