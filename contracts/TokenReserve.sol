/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

pragma solidity ^0.5.13;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@galtproject/whitelisted-tokensale/contracts/interfaces/IWhitelistedTokenSale.sol";
import "@galtproject/whitelisted-tokensale/contracts/traits/Administrated.sol";
import "@galtproject/whitelisted-tokensale/contracts/traits/Pausable.sol";
import "./interfaces/ITokenReserve.sol";


contract TokenReserve is Administrated, ITokenReserve, Pausable {
  using EnumerableSet for EnumerableSet.AddressSet;
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  EnumerableSet.AddressSet internal customerTokens;

  IERC20 public tokenToSell;

  address public wallet;

  uint256 public currentReserved;
  uint256 public totalReserved;

  struct TokenInfo {
    uint256 rateMul;
    uint256 rateDiv;
    uint256 totalReserved;
    uint256 totalReceived;
    uint256 onWalletTotalReceived;
    uint256 totalSold;
  }

  mapping(address => TokenInfo) public customerTokenInfo;

  struct ReservedOrder {
    address customerTokenAddress;
    uint256 customerTokenAmount;
    uint256 tokenToSellAmount;
    address customerAddress;
    bool onWallet;
    string paymentDetails;
  }

  uint256 ordersReservedCount;
  mapping(uint256 => ReservedOrder) public reservedOrders;

  struct CustomerInfo {
    uint256 currentReserved;
    uint256 totalReserved;
  }

  mapping(address => CustomerInfo) public customerInfo;

  constructor() public {
  }

  function initialize(address _owner, address _tokenToSell) public initializer {
    Ownable.initialize(_owner);
    tokenToSell = IERC20(_tokenToSell);
  }

  function setWallet(address _wallet) external onlyAdmin {
    wallet = _wallet;
    emit SetWallet(_wallet, msg.sender);
  }

  function addOrUpdateCustomerToken(address _token, uint256 _rateMul, uint256 _rateDiv) external onlyAdmin {
    require(_rateMul > 0 && _rateDiv > 0, "TokenReserve: incorrect rate");
    customerTokens.add(_token);
    customerTokenInfo[_token].rateMul = _rateMul;
    customerTokenInfo[_token].rateDiv = _rateDiv;
    emit UpdateCustomerToken(_token, _rateMul, _rateDiv, msg.sender);
  }

  function removeCustomerToken(address _token) external onlyAdmin {
    customerTokens.remove(_token);
    emit RemoveCustomerToken(_token, msg.sender);
  }

  function reserveTokens(IERC20 _customerToken, address _customerAddress, uint256 _weiAmount) external whenNotPaused {
    uint256 _resultTokenAmount = _reserveTokens(_customerToken, _customerAddress, _weiAmount, true);

    emit ReserveTokens(ordersReservedCount, msg.sender, _customerAddress, address(_customerToken), _weiAmount, _resultTokenAmount);
  }

  function addReserveTokens(
    IERC20 _customerToken,
    address _customerAddress,
    uint256 _weiAmount,
    string calldata _paymentDetails
  )
    external
    onlyAdmin
  {
    uint256 _resultTokenAmount = _reserveTokens(_customerToken, _customerAddress, _weiAmount, false);

    reservedOrders[ordersReservedCount].paymentDetails = _paymentDetails;

    emit AddReserveTokens(ordersReservedCount, msg.sender, _customerAddress, address(_customerToken), _weiAmount, _resultTokenAmount);
  }

  function _reserveTokens(
    IERC20 _customerToken,
    address _customerAddress,
    uint256 _weiAmount,
    bool _transferToWallet
  )
    internal
    returns (uint256)
  {
    require(wallet != address(0), "TokenReserve: wallet is null");

    uint256 _resultTokenAmount = getTokenAmount(address(_customerToken), _weiAmount);

    TokenInfo storage _tokenInfo = customerTokenInfo[address(_customerToken)];
    _tokenInfo.totalReceived = _tokenInfo.totalReceived.add(_weiAmount);
    _tokenInfo.totalReserved = _tokenInfo.totalReserved.add(_resultTokenAmount);
    _tokenInfo.totalSold = _tokenInfo.totalSold.add(_resultTokenAmount);

    _addCustomerReserve(_customerAddress, _resultTokenAmount);

    ordersReservedCount = ordersReservedCount.add(1);
    reservedOrders[ordersReservedCount] = ReservedOrder(
      address(_customerToken),
      _weiAmount,
      _resultTokenAmount,
      _customerAddress,
      _transferToWallet,
      ""
    );

    if (_transferToWallet) {
      _tokenInfo.onWalletTotalReceived = _tokenInfo.onWalletTotalReceived.add(_weiAmount);

      _customerToken.safeTransferFrom(msg.sender, wallet, _weiAmount);
    }

    return _resultTokenAmount;
  }

  function _addCustomerReserve(address _customerAddress, uint256 _addAmount) internal {
    CustomerInfo storage _customerInfo = customerInfo[_customerAddress];
    _customerInfo.currentReserved = _customerInfo.currentReserved.add(_addAmount);
    _customerInfo.totalReserved = _customerInfo.totalReserved.add(_addAmount);

    currentReserved = currentReserved.add(_addAmount);
    totalReserved = totalReserved.add(_addAmount);
  }

  function distributeReserve(address[] calldata _customers) external onlyAdmin {
    uint256 len = _customers.length;

    for (uint256 i = 0; i < len; i++) {
      address _customerAddr = _customers[i];
      uint256 _amount = customerInfo[_customerAddr].currentReserved;

      tokenToSell.safeTransfer(_customerAddr, _amount);
      currentReserved = currentReserved.sub(customerInfo[_customerAddr].currentReserved);
      customerInfo[_customerAddr].currentReserved = 0;

      emit DistributeReservedTokens(msg.sender, _customerAddr, _amount);
    }
  }

  function getTokenAmount(address _customerToken, uint256 _weiAmount) public view returns (uint256) {
    require(_weiAmount > 0, "TokenReserve: weiAmount can't be null");
    require(isTokenAvailable(address(_customerToken)), "TokenReserve: _customerToken is not available");

    TokenInfo storage _tokenInfo = customerTokenInfo[_customerToken];
    uint256 _resultTokenAmount = _weiAmount.mul(_tokenInfo.rateMul).div(_tokenInfo.rateDiv);

    require(_resultTokenAmount > 0, "TokenReserve: _resultTokenAmount can't be null");

    return _resultTokenAmount;
  }

  function isTokenAvailable(address _customerToken) public view returns (bool) {
    return customerTokens.contains(_customerToken);
  }

  function getCustomerTokenList() external view returns (address[] memory) {
    return customerTokens.enumerate();
  }

  function getCustomerTokenCount() external view returns (uint256) {
    return customerTokens.length();
  }
}
