/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

pragma solidity ^0.5.13;

import "@galtproject/whitelisted-tokensale/contracts/traits/Managed.sol";
import "./interfaces/ICarToken.sol";


contract CarTokenController is Managed {

  ICarToken token;

  struct Member {
    address addr;
    bool active;
  }

  mapping(bytes32 => Member) public members;
  mapping(address => bytes32) public keyOfMember;

  constructor () public {}

  function initialize(address _owner) public initializer {
    Ownable.initialize(_owner);
  }

  function setToken(ICarToken _token) public onlyOwner {
    token = _token;
  }

  function addNewMember(bytes32 _key, address _addr) public onlyAdminOrManager {
    _setMemberAddress(_key, _addr);
  }

  function setMemberActive(bytes32 _key, bool _active) public onlyAdminOrManager {
    require(members[_key].addr != address(0), "Member does not exists");
    members[_key].active = _active;
  }

  function migrateBalance(address _from, address _to) public onlyAdmin {
    require(isMemberAddressActive(_to), "Recipient member does not active");

    uint256 fromBalance = token.balanceOf(_from);
    token.burn(_from, fromBalance);
    token.mint(_to, fromBalance);
  }

  function changeMemberAddress(bytes32 _memberKey, address _newAddr) public onlyAdmin {
    keyOfMember[members[_memberKey].addr] = bytes32(0);
    members[_memberKey] = Member(address(0), false);

    _setMemberAddress(_memberKey, _newAddr);
  }

  function mintTokens(address _addr, uint256 _amount) public onlyAdmin {
    token.mint(_addr, _amount);
  }

  function isMemberAddressActive(address _addr) public view returns (bool) {
    return members[keyOfMember[_addr]].active;
  }

  function requireMembersAreActive(address _member1, address _member2) public view {
    require(
      isMemberAddressActive(_member1) && isMemberAddressActive(_member2),
      "The address has no Car token transfer permission"
    );
  }

  function _setMemberAddress(bytes32 _key, address _addr) internal {
    require(members[_key].addr == address(0), "Member already exists");
    require(keyOfMember[_addr] == bytes32(0), "Address already claimed");

    members[_key] = Member(_addr, true);
    keyOfMember[_addr] = _key;
  }
}
