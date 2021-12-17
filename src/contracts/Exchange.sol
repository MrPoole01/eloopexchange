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
    mapping(uint256 => _Order) public orders; // Store the order - mapping through all orders
    uint256 public orderCount; // ID Count
    mapping(uint256 => bool) public orderCancelled; // Canceled order storage
    mapping(uint256 => bool) public orderFilled; // Filled order

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    // Model the Order
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    // Trade Event
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
    );

    //  Struct
    struct _Order {
        // Order Atributes
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    // Set the Fees
    constructor (address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: Revert if Ether is sent to this smart contract by mistake 
    function() external {
        revert();
    }

    // Deposit & Withdraw Orders
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

    // Withdraw Tokens
    function withdrawToken(address _token, uint256 _amount) public {
        require(_token != ETHER);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Check Balances
    function balanceOf(address _token, address _user) public view returns (uint256) {
         return tokens[_token][_user];
    }

    // Manage Orders - Make or Cancel
     // Add Order to Storage
     function makeOrder(address _tokenGet, uint256 _amountGet,  address _tokenGive, uint256 _amountGive) public {
         // Extantiate a new order
         orderCount = orderCount.add(1);
        // Make Order
         orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
        // Retrieve the Order
         emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
     }

     // Cancel Order
    function cancelOrder(uint256 _id) public {
        // Fetch the Order from Storage
        _Order storage _order = orders[_id];
        // Must be my order - smae user
        require(address(_order.user) == msg.sender);
        // Must be a VALID Order
        require(_order.id == _id);
        // If all is good... Cancel the Order
        orderCancelled[_id] = true;
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }

    // Handle Trades - Charge Fee
    // Fill Order
    function fillOrder(uint256 _id) public {
        // Filling a valid order
        require(_id > 0 && _id <= orderCount);
        // Check to see if order already exists
        require(!orderFilled[_id]);
        require(!orderCancelled[_id]);
        // Fetch the Orders
        _Order storage _order = orders[_id];
        // Execute trade function
       _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        // Mark order as filled
        orderFilled[_order.id] = true;
    }

    function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
        //Fee paid by the user that fills the order, o.k.a msg.sender
        uint256 _feeAmount = _amountGet.mul(feePercent).div(100);

         // Execute the trades 
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount)); // Fee deducted  from _amountGet
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
       
        // Adding fees -  Charge fees
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);

        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
       
        // Emit trade Event
        emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }
}