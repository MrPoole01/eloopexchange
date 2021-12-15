pragma solidity >=0.5.16;

import "./Token.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange {
    using SafeMath for uint; 
    // Variables
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // fee percentage
    address constant ETHER = address(0); // Store Ether in tokens mapping with blank address
    mapping(address => mapping(address => uint256)) public tokens;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint amount, uint balance);

    // Set the Fees
    constructor (address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: Revert if Ether is sent to this smart contract by mistake 
    function() external {
        revert();
    }

    // Deposit Ether
    function depositEther() payable public {
        // Manage Ether deposit - update balance
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
         // Emit Ether event
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    // Withdraw Ether
    function withdrawEther(uint _amount) public {
        // Makes sure there is a sufficient amouunt to make the transaction
        require(tokens[ETHER][msg.sender] >= _amount);
        //  Update balance
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        //  Transfer amount to sender
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }


    // Deposit Tokens
    function depositToken(address _token, uint _amount) public { 
        // Which Tokens
        // Don't allow Ether deposits
        require(_token != ETHER);
        // Send tokens to this contract
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // Manage token deposit - update balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        // Emit token event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // [ ] Withdraw Tokens
    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
         return tokens[_token][_user];
    }

// [ ] Check Balances
// [ ] Make Order
// [ ] Cancel Order
// [ ] Fill Order
// [ ] Charge Fees

// Deposit & Withdraw Orders
// Manage Orders - Make oor Cancel
// Handle Trades - Charge Fees


}