<p align="center"> <img src="https://user-images.githubusercontent.com/4842007/84689477-50b51080-af41-11ea-88b1-045e8a620c42.png" alt="logo-black-360" width="200"/></p>


<h3 align="center">Curio Security Token Contracts (@security-token-contracts)</h3>
<div align="center">
</div>

<div align="center">

![CI](https://github.com/galtproject/car-token-contracts/workflows/CI/badge.svg)
<a href="https://codecov.io/gh/galtproject/car-token-contracts">
  <img src="https://codecov.io/gh/galtproject/car-token-contracts/branch/develop/graph/badge.svg" />
</a>
<img src="https://img.shields.io/github/issues-raw/galtproject/car-token-contracts.svg?color=green&style=flat-square" alt="Opened issues"/>
<img src="https://img.shields.io/github/issues-closed-raw/galtproject/car-token-contracts.svg?color=blue&style=flat-square" alt="Closed issues" />
<img src="https://img.shields.io/github/issues-pr-closed/galtproject/car-token-contracts.svg?color=green&style=flat-square" alt="Closed PR"/>
<img src="https://img.shields.io/github/issues-pr-raw/galtproject/car-token-contracts.svg?color=green&style=flat-square" alt="Opened PR"/>
<img src="https://img.shields.io/badge/version-1.0.0-yellow.svg" alt="Contracts Version"/>
</div>
<br/>
<br/>
<div align="center">
  <img src="https://img.shields.io/github/contributors/galtproject/car-token-contracts?style=flat-square" alt="Сontributors" />
  <img src="https://img.shields.io/badge/contributions-welcome-orange.svg?style=flat-square" alt="Contributions Welcome" />
</div>
<br/>

## Curio security tokens distribution
**Contracts for safety investments and tokens holding. Using this contracts - investors can be sure that their funds will not be stolen or lost. Flexible logic of investments reserving allows all participants to make the deals off-chain or on-chain.**

:page_with_curl: **Contracts developed by order of Curio Capital (CH) Limited (Company Number CHE-211.446.654) Incorporated and registered in Zug, Switzerland. For more information check the [Website](https://curioinvest.com/)**

:construction: **[@security-token-contracts](https://github.com/galtproject/car-token-contracts/): Ethereum Mainnet**

:memo: **Security review status: Unaudited. At the moment, [@security-token-contracts](https://github.com/galtproject/car-token-contracts/) contracts are deployed on the Ethereum mainnet. Nonetheless it is still experimental software that has not yet been publicly audited. Use it on your own risk!****

:pencil2:**Get started contributing with a good first [issue](https://github.com/galtproject/car-token-contracts/issues)**.

# Contracts overview
This repository [@security-token-contracts](https://github.com/galtproject/car-token-contracts/) contains contracts:
- **CarToken.sol** - simple OpenZeppelin implementation of ERC20 token with 0 decimals;
- **CarTokenController.sol** - a contract that allow add new investors or migrate addresses and balance of investors;
- **TokenReserve.sol** - investment contract for exchanging ERC20 tokens to CarToken. It holds and reserve CarToken amounts inside contract until distribution;

## For Developers

* Compile contracts

```sh
make compile
```

* Run tests

```sh
npm test
```

* Run Solidity and JavaScript linters

```sh
make lint
```

* Generate Coverage Report

```sh
make coverage
```
