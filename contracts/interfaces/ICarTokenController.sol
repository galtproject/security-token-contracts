/*
 * Copyright ©️ 2020 Curio AG (Company Number FL-0002.594.728-9)
 * Incorporated and registered in Liechtenstein
 *
 * Copyright ©️ 2020 Curio Capital AG (Company Number CHE-211.446.654)
 * Incorporated and registered in Zug, Switzerland.
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