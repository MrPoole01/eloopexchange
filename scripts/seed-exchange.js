const Token = artifacts.require("Token")
const Exchange = artifacts.require("Exchange")
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

// Convert Large Number to Readable Value ('Ether')
 const ether = (n) => {
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
}

// Same as  Ether
 const tokens = (n) => ether(n)

 // Wait Until
 const wait = (seconds) => {
     const milliseconds = seconds * 1000
     return new Promise(resolve => setTimeout(resolve, milliseconds))
 }

module.exports = async function (callback) {
  try {
    // Fetch accounts from wallet - these are unlocked
    const accounts = await web3.eth.getAccounts();

    // Fetch the deployed Token
    const token = await Token.deployed();
    console.log("Token fetched", token.address);

    // Fetch the deployed Exchange
    const exchange = await Exchange.deployed();
    console.log("Exchange fetched", exchange.address);

    // Give tokens to account[1]
    let sender = accounts[0];
    let receiver = accounts[1];
    let amount = web3.utils.toWei("10000", "ether"); // 10,000 Tokens

    await token.transfer(receiver, amount, { from: sender });
    console.log(`Transfer ${amount} from ${sender} to ${receiver}`);

    // Set up Users
    const user1 = accounts[0];
    const user2 = accounts[1];
    console.log(`User2 address is ${user2}`);

    // User1 Deposits Ether
    amount = 1;
    await exchange.depositEther({ from: user1, value: ether(amount) });
    console.log(`Deposit ${amount} Ether from ${user1}`);

    // User2 Appproves Tokens
    amount = 10000;
    await token.approve(exchange.address, tokens(amount), { from: user2 });
    console.log(`Approved ${amount} tokens from ${user2}`);

    // User2 Deposits Tokens
    await exchange.depositToken(token.address, tokens(amount), { from: user2 });
    console.log(`Deposited ${amount} tokens from ${user2}`);

    ////////////////////////////////////////////////////////////////
    // Seed a Cancelled Order
    //

    // User1 Makes Order to get Tokens
    let result;
    let orderId;
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // User1 Cancels Order
    orderId = result.logs[0].args.id;
    await exchange.cancelOrder(orderId, { from: user1 });
    console.log(`Cancelled order from ${user1}`);

    ///////////////////////////////////////////////////////////////////////////////
    // Seed Filled Ordres
    //

    // User1 Makes Order
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // User2 Fills Order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`Filled order from ${user1}`);

    // Wait 1 second
    await wait(1);

    // User1 Makes Order
    result = await exchange.makeOrder(
      token.address,
      tokens(50),
      ETHER_ADDRESS,
      ether(0.01),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // User2 Fills Order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`Filled order from ${user1}`);

    // Wait 1 second
    await wait(1);

    // User1 Makes Order
    result = await exchange.makeOrder(
      token.address,
      tokens(200),
      ETHER_ADDRESS,
      ether(0.15),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // User2 Fills Order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`Filled order from ${user1}`);

    // Wait 1 second
    await wait(1);

    for (let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(
        token.address,
        tokens(10 * i),
        ETHER_ADDRESS,
        ether(0.01),
        { from: user1 }
      );
      console.log(`Made order from ${user1}`);
      // Wait 1 second
      await wait(1);
    }

    for (let i = 1; i <= 10; i++) {
      result = await exchange.makeOrder(
        ETHER_ADDRESS,
        ether(0.01),
        token.address,
        tokens(10 * i),
        { from: user2 }
      );
      console.log(`Made order from ${user2}`);
      // Wait 1 second
      await wait(1);
    }
  } catch (err) {
    console.log(err);
  }

  callback();
};