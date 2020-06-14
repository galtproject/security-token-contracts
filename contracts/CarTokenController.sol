/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

pragma solidity ^0.5.13;

import "@galtproject/whitelisted-tokensale/contracts/ERC20Token.sol";
import "@galtproject/whitelisted-tokensale/contracts/interfaces/ITokenSaleRegistry.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";


contract CarToken is ERC20Token, Ownable {
  ITokenSaleRegistry public tokenSaleRegistry;

  constructor (address _tokenSaleRegistry) public ERC20Token("CarToken1", "CT1", 0) {
    tokenSaleRegistry = ITokenSaleRegistry(_tokenSaleRegistry);
  }

  function checkTransfer(address from, address to, uint256 amount) public view returns(bool, string) {
    if (from == address(0)) {
      return (false, "ERC20: transfer from the zero address");
    }
    if (to == address(0)) {
      return (false, "ERC20: transfer to the zero address");
    }
    if (balances[from] < amount) {
      return (false, "ERC20: transfer amount exceeds balance");
    }
    return (true, "");
  }

  function checkTransferFrom(address sender, address from, address to, uint256 amount) public view returns(bool, string) {
    (bool success, string memory error) = checkTransfer(from, to, amount);
    if (!success) {
      return (success, error);
    }
    if (_allowances[from][sender] < amount) {
      return (false, "ERC20: transfer amount exceeds allowance");
    }
    return (true, "");
  }
}
