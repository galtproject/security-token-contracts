/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

pragma solidity ^0.5.13;

import "@galtproject/whitelisted-tokensale/contracts/traits/Pausable.sol";
import "@galtproject/whitelisted-tokensale/contracts/traits/Managed.sol";
import "./interfaces/ICarToken.sol";
import "./interfaces/ICarTokenController.sol";


contract CarTokenController is ICarTokenController, Managed, Pausable {

  ICarToken public token;

  struct Investor {
    address addr;
    bool active;
  }

  mapping(bytes32 => Investor) public investors;
  mapping(address => bytes32) public keyOfInvestor;

  constructor () public {}

  function initialize(address _owner) public initializer {
    Ownable.initialize(_owner);
  }

  function setToken(ICarToken _token) external onlyOwner {
    token = _token;

    emit SetToken(address(_token));
  }

  function addNewInvestors(bytes32[] calldata _keys, address[] calldata _addrs) external onlyAdminOrManager {
    uint256 len = _keys.length;
    require(len == _addrs.length, "Lengths of keys and address does not match");

    for (uint256 i = 0; i < len; i++) {
      _setInvestorAddress(_keys[i], _addrs[i]);

      emit AddNewInvestor(_keys[i], _addrs[i]);
    }
  }

  function setInvestorActive(bytes32 _key, bool _active) external onlyAdminOrManager {
    require(investors[_key].addr != address(0), "Investor does not exists");
    investors[_key].active = _active;

    emit SetInvestorActive(_key, _active);
  }

  function migrateBalance(address _from, address _to) public onlyAdmin {
    _migrateBalance(_from, _to);
  }

  function changeInvestorAddress(bytes32 _investorKey, address _newAddr) external onlyAdmin {
    _changeInvestorAddress(_investorKey, _newAddr);
  }

  function changeInvestorAddressAndMigrateBalance(bytes32 _investorKey, address _newAddr) external onlyAdmin {
    address oldAddress = investors[_investorKey].addr;
    _changeInvestorAddress(_investorKey, _newAddr);
    _migrateBalance(oldAddress, _newAddr);
  }

  function changeMyAddress(bytes32 _investorKey, address _newAddr) external whenNotPaused {
    require(investors[_investorKey].addr == msg.sender, "Investor address and msg.sender does not match");

    _changeInvestorAddress(_investorKey, _newAddr);
  }

  function changeMyAddressAndMigrateBalance(bytes32 _investorKey, address _newAddr) external whenNotPaused {
    require(investors[_investorKey].addr == msg.sender, "Investor address and msg.sender does not match");

    address oldAddress = investors[_investorKey].addr;
    _changeInvestorAddress(_investorKey, _newAddr);
    _migrateBalance(oldAddress, _newAddr);
  }

  function mintTokens(address _addr, uint256 _amount) external onlyAdmin {
    token.mint(_addr, _amount);

    emit MintTokens(msg.sender, _addr, _amount);
  }

  function isInvestorAddressActive(address _addr) public view returns (bool) {
    return investors[keyOfInvestor[_addr]].active;
  }

  function requireInvestorsAreActive(address _investor1, address _investor2) public whenNotPaused view {
    require(
      isInvestorAddressActive(_investor1) && isInvestorAddressActive(_investor2),
      "The address has no Car token transfer permission"
    );
  }

  function _migrateBalance(address _from, address _to) internal {
    require(isInvestorAddressActive(_to), "Recipient investor does not active");

    uint256 fromBalance = token.balanceOf(_from);
    token.burn(_from, fromBalance);
    token.mint(_to, fromBalance);

    emit MigrateBalance(msg.sender, _from, _to);
  }

  function _changeInvestorAddress(bytes32 _investorKey, address _newAddr) internal {
    address oldAddress = investors[_investorKey].addr;
    require(oldAddress != _newAddr, "Old address and new address the same");

    keyOfInvestor[investors[_investorKey].addr] = bytes32(0);
    investors[_investorKey] = Investor(address(0), false);

    _setInvestorAddress(_investorKey, _newAddr);

    emit ChangeInvestorAddress(msg.sender, _investorKey, oldAddress, _newAddr);
  }

  function _setInvestorAddress(bytes32 _key, address _addr) internal {
    require(investors[_key].addr == address(0), "Investor already exists");
    require(keyOfInvestor[_addr] == bytes32(0), "Address already claimed");

    investors[_key] = Investor(_addr, true);
    keyOfInvestor[_addr] = _key;
  }

  function checkTransfer(address from, address to, uint256 amount) public view returns(bool success, string memory error) {
    if (from == address(0)) {
      return (false, "ERC20: transfer from the zero address");
    }
    if (to == address(0)) {
      return (false, "ERC20: transfer to the zero address");
    }
    if (token.balanceOf(from) < amount) {
      return (false, "ERC20: transfer amount exceeds balance");
    }
    if (!isInvestorAddressActive(from) || !isInvestorAddressActive(to)) {
      return (false, "The address has no Car token transfer permission");
    }
    if (paused()) {
      return (false, "Pausable: paused");
    }
    return (true, "");
  }

  function checkTransferFrom(
    address sender,
    address from,
    address to,
    uint256 amount
  )
    external
    view
    returns (bool success, string memory error)
  {
    (bool success, string memory error) = checkTransfer(from, to, amount);
    if (!success) {
      return (success, error);
    }
    if (token.allowance(from, sender) < amount) {
      return (false, "ERC20: transfer amount exceeds allowance");
    }
    return (true, "");
  }
}
