/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

pragma solidity ^0.5.13;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "./interfaces/ICarTokenController.sol";


contract CarToken is ERC20, ERC20Detailed, Ownable {

  ICarTokenController public controller;

  address public minter;
  address public burner;

  constructor (ICarTokenController _controller, address _minter, address _burner) public ERC20Detailed("CarToken1", "CT1", 0) {
    controller = _controller;
    minter = _minter;
    burner = _burner;
  }

  modifier onlyMinter() {
    require(_msgSender() == minter, "CarToken: caller does not minter");
    _;
  }

  modifier onlyBurner() {
    require(_msgSender() == burner, "CarToken: caller does not burner");
    _;
  }

  function setMinter(address _newMinter) external onlyOwner {
    minter = _newMinter;
  }

  function setBurner(address _newBurner) external onlyOwner {
    burner = _newBurner;
  }

  function setController(ICarTokenController _newController) external onlyOwner {
    controller = _newController;
  }

  function mint(address account, uint256 amount) external onlyMinter returns (bool) {
    _mint(account, amount);
    return true;
  }

  function burn(address account, uint256 amount) external onlyBurner returns (bool) {
    _burn(account, amount);
    return true;
  }

  function transfer(address recipient, uint256 amount) public returns (bool) {
    controller.requireInvestorsAreActive(_msgSender(), recipient);
    return super.transfer(recipient, amount);
  }

  function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
    controller.requireInvestorsAreActive(sender, recipient);
    return super.transferFrom(sender, recipient, amount);
  }
}
