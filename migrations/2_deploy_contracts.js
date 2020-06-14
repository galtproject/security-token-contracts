const ERC20Token = artifacts.require('ERC20Mintable');
const web3Utils = require('web3-utils');
const fs = require('fs');
const path = require('path');

const { deployWhitelistedTokenSale } = require('../helpers/deploy')(artifacts);

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const owner = '0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83';
    const wallet = '0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83';

    const testStableToken1 = await ERC20Token.new('TESTStable 1', 'TST1', '18');
    const testStableToken2 = await ERC20Token.new('TESTStable 2', 'TST2', '18');

    await testStableToken1.mint(owner, web3Utils.toWei((10 ** 6).toString(), 'ether'));
    await testStableToken2.mint(owner, web3Utils.toWei((10 ** 6).toString(), 'ether'));

    const { tokenController, tokenReserve, token: mainToken } = await deployWhitelistedTokenSale(accounts[0], owner);

    console.log('tokenReserve.addAdmin');

    await Promise.all([tokenController.addAdmin(accounts[0]), tokenReserve.addAdmin(accounts[0])]);

    console.log('tokenController.setToken');

    await tokenController.setToken(mainToken.address);

    await Promise.all([
      tokenController.mintTokens(tokenReserve.address, web3Utils.toWei((10 ** 6).toString(), 'wei')),
      tokenController.addAdmin(owner),
      tokenReserve.addAdmin(owner),
      tokenReserve.setWallet(wallet),
      tokenReserve.addOrUpdateCustomerToken(testStableToken1.address, '1', '1'),
      tokenReserve.addOrUpdateCustomerToken(testStableToken2.address, '1', '2')
    ]);

    await Promise.all([tokenController.removeAdmin(accounts[0]), tokenReserve.removeAdmin(accounts[0])]);

    await Promise.all([
      mainToken.transferOwnership(owner),
      tokenController.transferOwnership(owner),
      tokenReserve.transferOwnership(owner)
    ]);

    const contractsData = {
      mainTokenAddress: mainToken.address,
      testStableToken1Address: testStableToken1.address,
      testStableToken2Address: testStableToken2.address,
      tokenReserveAddress: tokenReserve.address,
      tokenReserveAbi: tokenReserve.abi,
      tokenControllerAddress: tokenController.address,
      tokenControllerAbi: tokenController.abi
    };

    const deployDirectory = `${__dirname}/../deployed`;
    if (!fs.existsSync(deployDirectory)) {
      fs.mkdirSync(deployDirectory);
    }

    fs.writeFileSync(path.join(deployDirectory, `${network}.json`), JSON.stringify(contractsData, null, 2));
  });
};
