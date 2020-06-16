/*
 * Copyright ©️ 2020 Curio AG (Company Number FL-0002.594.728-9)
 * Incorporated and registered in Liechtenstein
 *
 * Copyright ©️ 2020 Curio Capital AG (Company Number CHE-211.446.654)
 * Incorporated and registered in Zug, Switzerland.
 */

pragma solidity ^0.5.13;


interface ITokenReserve {
  event SetTokenSaleRegistry(address indexed tokenSaleRegistry, address indexed admin);
  event SetWallet(address indexed wallet, address indexed admin);
  event UpdateCustomerToken(address indexed token, uint256 rateMul, uint256 rateDiv, address indexed admin);
  event RemoveCustomerToken(address indexed token, address indexed admin);
  event ReserveTokens(
    uint256 orderId,
    address indexed spender,
    address indexed customer,
    address indexed token,
    uint256 tokenAmount,
    uint256 resultAmount
  );
  event AddReserveTokens(
    uint256 orderId,
    address indexed admin,
    address indexed customer,
    address indexed token,
    uint256 tokenAmount,
    uint256 resultAmount,
    string paymentDetails
  );
  event DistributeReservedTokens(address indexed admin, address indexed customer, uint256 amount);
}