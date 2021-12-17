import { tokens, ether, EVM_REVERT, ETHER_ADDRESS } from './helpers';

// Pull in Token
const Token = artifacts.require('./Token');

// Pull in Exchange
const Exchange = artifacts.require('./Exchange');

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Exchange', ([deployer, feeAccount, user1, user2]) => {
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

    describe('making orders', async () => {
        let result
        let amount
        let coin
        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.makeOrder(token.address, tokens(2), ETHER_ADDRESS, amount, { from: user1 })
        })
        it('tracks the newly created order' , async () => {
            // count increment is working
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1')
            // Order information is correct - Retrieve the Order
            const orders = await exchange.orders('1')
            orders.id.toString().should.equal('1', 'id is correct')
            orders.user.should.equal(user1, 'user is correct')
            orders.tokenGet.toString().should.equal(token.address, 'tokenGet is correct')
            orders.amountGet.toString().should.equal(tokens(2).toString(), 'amountGet is correct')
            orders.tokenGive.toString().should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            orders.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
            orders.timestamp.toString().length.should.be.at.least(1, 'timestamp iis present')
        })
        // Retrieve the Order
        it('emits a Order event', async () => {
            const log = result.logs[0]
            log.event.should.equal('Order')
            const event = log.args
            event.id.toString().should.equal('1', 'id is correct')
            event.user.should.equal(user1, 'user is correct')
            event.tokenGet.toString().should.equal(token.address, 'tokenGet is correct')
            event.amountGet.toString().should.equal(tokens(2).toString(), 'amountGet is correct')
            event.tokenGive.toString().should.equal(ETHER_ADDRESS, 'tokenGive is correct')
            event.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
            event.timestamp.toString().length.should.be.at.least(1, 'timestamp iis present')
        })
 
    })

    describe('order actions', async () => {
        let amount
        
        beforeEach(async () => {
            amount = ether(1)
            // user1 deposits Ether
            await exchange.depositEther({ from: user1, value: amount })
            // Give tokens to user2
            await token.transfer(user2, tokens(100), { from: deployer })
            // user2 deposit tokens only
            await token.approve(exchange.address, tokens(2), { from: user2 })
            await exchange.depositToken(token.address, tokens(2), { from: user2 })
            // user1 Makes an order to buy tokens with Ether
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, amount, { from: user1 })
        })

        describe('filling orders', async () => {
            let result
            let amount

            describe('success', async () => {
                beforeEach(async () => {
                    amount = ether(1)
                    // user2 fills orders
                    result = await exchange.fillOrder('1', { from: user2 })
                })

                it('executes the trade and charges fees', async () => {
                    let balance

                    balance = await exchange.balanceOf(token.address, user1)
                    balance.toString().should.equal(tokens(1).toString(), 'user1 receives tokens')

                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
                    balance.toString().should.equal(amount.toString(), 'user2 received Ether')

                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
                    balance.toString().should.equal('0', 'user1 Ether deducted')

                    balance = await exchange.balanceOf(token.address, user2)
                    balance.toString().should.equal(tokens(0.9).toString(), 'user2 Tokens deducted with the applied')

                    const feeAccount = await exchange.feeAccount()
                    balance = await exchange.balanceOf(token.address, feeAccount)
                    balance.toString().should.equal(tokens(0.1).toString(), 'feeAccount received fee')
                })

                it('updates filled orders', async () => {
                    const orderFilled = await exchange.orderFilled(1)
                    orderFilled.should.equal(true)
                })

                it('emits a "Trade" event', async () => {
                    const log = result.logs[0]
                    log.event.should.equal('Trade')
                    const event = log.args
                    event.id.toString().should.equal('1', 'id is correct')
                    event.user.should.equal(user1, 'user is correct')
                    event.tokenGet.toString().should.equal(token.address, 'tokenGet is correct')
                    event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
                    event.tokenGive.toString().should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                    event.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
                    event.userFill.toString().should.equal(user2, 'userFill is correct')
                    event.timestamp.toString().length.should.be.at.least(1, 'timestamp iis present')
                })
            })

            describe('failure', async () => {
                it('rejects invalid order ids' , async () => {
                    const invalidOrderId = 99999
                    await exchange.fillOrder(invalidOrderId, { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
                it('rejects already-filled orders' , async () => {
                    // Fill the Order
                    await exchange.fillOrder('1', { from: user2 }).should.be.fulfilled
                    // Try to fiil it again
                    await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
                it('rejects canceled ordered' , async () => {
                    //Cancel the Order
                    await exchange.cancelOrder('1', { from: user1 }).should.be.fulfilled
                    // Try to fill the cancceled order
                    await exchange.fillOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })
        
        describe('cancelling orders', async () => {
            let result
    
            describe('success', async () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder('1', { from: user1 })
                })
    
                it('updates cancelled orders', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                    })
                
                    it('emits a "Cancel" event', async () => {
                        const log = result.logs[0]
                        log.event.should.equal('Cancel')
                        const event = log.args
                        event.id.toString().should.equal('1', 'id is correct')
                        event.user.should.equal(user1, 'user is correct')
                        event.tokenGet.toString().should.equal(token.address, 'tokenGet is correct')
                        event.amountGet.toString().should.equal(tokens(1).toString(), 'amountGet is correct')
                        event.tokenGive.toString().should.equal(ETHER_ADDRESS, 'tokenGive is correct')
                        event.amountGive.toString().should.equal(amount.toString(), 'amountGive is correct')
                        event.timestamp.toString().length.should.be.at.least(1, 'timestamp iis present')
                    })
                })
    
            describe('failure', async () => {
                it('rejects invalid order ids', async () => {
                    const invalidOrderId = 999999
                    await exchange.cancelOrder(invalidOrderId, { from: user1 }).should.be.rejectedWith(EVM_REVERT)
                })
                // Try to cancel the order from another user
                it('rejects unauthorized cancelations', async () => {
                    await exchange.cancelOrder('1', { from: user2 }).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })
    }) 
})