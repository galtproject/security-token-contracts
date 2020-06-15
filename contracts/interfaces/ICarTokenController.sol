/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

pragma solidity ^0.5.13;


interface ICarTokenController {
  event SetToken(address indexed token);
  event AddNewInvestor(bytes32 indexed key, address indexed addr);
  event SetInvestorActive(bytes32 indexed key, bool active);
  event MigrateBalance(address indexed sender, address indexed from, address indexed to);
  event ChangeInvestorAddress(address indexed sender, bytes32 indexed key, address indexed oldAddr, address newAddr);
  event MintTokens(address indexed sender, address indexed addr, uint256 amount);

  function requireInvestorsAreActive(address _investor1, address _investor2) external view;
}