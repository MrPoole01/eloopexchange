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

    describe('fallack', () => {
        it('reverts when Ether is sent', async () => {
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    })

    describe('depositing Ether', async () => {
        let result
        let amount

        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({ from: user1, value: amount })
        })

        it('tracks the ether deposit', async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })

        it('emits a Deposit event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Deposit')
            const event = log.args
            event.token.toString().should.equal(ETHER_ADDRESS, 'token address is correct')
            event.user.should.equal(user1, 'user address is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    } )

    describe('withdrawing Ether', async () => {
        let result
        let amount

        beforeEach(async () => {
            // Deposit Ether first (test example only to get Ether into user1 accnt)
            amount = ether(1)
            await exchange.depositEther({ from: user1, value: amount })
        })

        describe('success', async () => {
            beforeEach(async () => {
            // Withdraw Ether
            result = await exchange.withdrawEther(amount, { from: user1 })
            })
            it('withdraws ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal('0')
            })
            it('emits a Withdraw event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.toString().should.equal(ETHER_ADDRESS, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0')
            })
        })
         describe('failure', async () => {

         })       
    })

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

    describe('withdraw tokens', async () => {
        let result
        let amount

        describe('success', async () => {
            
            beforeEach(async () => {
                // Deposit tokens first
                amount = tokens(10)
                // Approve to token deposit
                await token.approve(exchange.address, amount, { from: user1 })
                // Deposit tokens
                await exchange.depositToken(token.address, amount, { from: user1 })
                // Withdraw Tokens
                result = await exchange.withdrawToken(token.address, amount, { from: user1 })
            })

            it('withdraws token funds', async () => {
                const balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal('0')
            })

            it('emits a Withdraw event', async () => {
                const log = result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.toString().should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0')
            })
        })

        describe('failure', async () => {
            it('rejects for insufficient balance', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
            it('fails for insufficient balance', async () => {
                // Attempt to withdraw tokens without depositing any first
                await exchange.withdrawToken(token.address, amount, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('checking balances', async () => {
        let amount

        beforeEach(async () => {
            amount = ether(1)
            exchange.depositEther({ from: user1, value: amount})
        })
        it('returns user balances', async () => {
            const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
            result.toString().should.equal(amount.toString())
        })
    })
})