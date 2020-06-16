/*
 * Copyright ©️ 2020 Curio AG (Company Number FL-0002.594.728-9)
 * Incorporated and registered in Liechtenstein
 *
 * Copyright ©️ 2020 Curio Capital AG (Company Number CHE-211.446.654)
 * Incorporated and registered in Zug, Switzerland.
 */

pragma solidity ^0.5.13;


interface ICarToken {
  function balanceOf(address account) external view returns (uint256);

  function mint(address account, uint256 amount) external;

  function burn(address account, uint256 amount) external;

  function allowance(address owner, address spender) external view returns (uint256);
}