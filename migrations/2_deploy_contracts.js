// const ERC20Token = artifacts.require('ERC20Mintable');
const web3Utils = require('web3-utils');
const fs = require('fs');
const path = require('path');

module.exports = function(deployer, network, accounts) {
  if (network === 'test' || network === 'soliditycoverage' || network === 'development') {
    console.log('Skipping deployment migration');
    return;
  }

  deployer.then(async () => {
    console.log('>>> Balance Before', await web3.eth.getBalance(accounts[0]));

    // eslint-disable-next-line global-require
    const { deployWhitelistedTokenSale } = require('../helpers/deploy')(artifacts);

    const proxyAdmin = '0x9F2012330Cc213e0E109Ef1f4F80C429924C5876';
    const owner = '0x8855f102508F1aFf3f70e6760d8aC3B4db569Fbc';
    const wallet = '0x8855f102508F1aFf3f70e6760d8aC3B4db569Fbc';
    const reserveBot = '0x1E22CD513b9776b539afc8d77C1a28b42d9d4C8E';

    // const proxyAdmin = '0xE006A0BB078291e539B3c7b9c8A8aF7f29215600';
    // const owner = '0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83';
    // const wallet = '0xB844C65F3E161061bA5D5dD8497B3C04B71c4c83';
    // const reserveBot = '0x1E22CD513b9776b539afc8d77C1a28b42d9d4C8E';

    // const testStableToken1 = await ERC20Token.new('TESTStable 1', 'TST1', '18');
    // const testStableToken2 = await ERC20Token.new('TESTStable 2', 'TST2', '18');
    //
    // await testStableToken1.mint(owner, web3Utils.toWei((10 ** 6).toString(), 'ether'));
    // await testStableToken2.mint(owner, web3Utils.toWei((10 ** 6).toString(), 'ether'));
    // await testStableToken1.mint(accounts[0], web3Utils.toWei((10 ** 6).toString(), 'ether'));
    // await testStableToken2.mint(accounts[0], web3Utils.toWei((10 ** 6).toString(), 'ether'));
    // const reserveToken1 = testStableToken1.address;
    // const reserveToken2 = testStableToken2.address;

    const reserveToken1 = '0x8dd5fbce2f6a956c3022ba3663759011dd51e73e';
    const reserveToken2 = '0xb4272071ecadd69d933adcd19ca99fe80664fc08';

    const { tokenController, tokenReserve, token: mainToken } = await deployWhitelistedTokenSale(
      accounts[0],
      proxyAdmin
    );

    console.log('tokenReserve.addAdmin');

    await Promise.all([tokenController.addAdmin(accounts[0]), tokenReserve.addAdmin(accounts[0])]);

    console.log('tokenController.setToken');

    await tokenController.setToken(mainToken.address);

    console.log('tokenController.mintTokens');
    await Promise.all([
      tokenController.mintTokens(tokenReserve.address, web3Utils.toWei('1100000', 'wei')),

      tokenController.addAdmin(owner),
      tokenReserve.addAdmin(owner),

      tokenController.addManager(reserveBot),
      tokenReserve.addManager(reserveBot),

      tokenReserve.setWallet(wallet),

      tokenReserve.addOrUpdateCustomerToken(reserveToken1, '1', web3Utils.toWei('1', 'ether')),
      tokenReserve.addOrUpdateCustomerToken(reserveToken2, '1', web3Utils.toWei('1', 'ether'))
    ]);
    console.log('tokenController.removeAdmin');

    await Promise.all([tokenController.removeAdmin(accounts[0]), tokenReserve.removeAdmin(accounts[0])]);
    console.log('tokenController.transferOwnership');

    await Promise.all([
      mainToken.transferOwnership(owner),
      tokenController.transferOwnership(owner),
      tokenReserve.transferOwnership(owner)
    ]);

    // console.log('testStableToken1.approve');
    // await testStableToken1.approve(tokenReserve.address, web3Utils.toWei((10 ** 2).toString(), 'ether'));

    // console.log('tokenReserve.getTokenAmount');
    // const tokenAmount = await tokenReserve.getTokenAmount(
    //   testStableToken1.address,
    //   web3Utils.toWei((10 ** 2).toString(), 'ether')
    // );

    // console.log('testStableToken1.transfer');
    // await testStableToken1.transfer(tokenReserve.address, web3Utils.toWei((10 ** 2).toString(), 'ether'));
    //
    // console.log('tokenAmount', tokenAmount);
    // await tokenReserve.contract.methods
    //   .reserveTokens(testStableToken1.address, accounts[0], web3Utils.toWei((10 ** 2).toString(), 'ether'))
    //   .estimateGas({ from: accounts[0] });
    // await tokenReserve.reserveTokens(
    //   testStableToken1.address,
    //   accounts[0],
    //   web3Utils.toWei((10 ** 2).toString(), 'ether')
    // );
    console.log('>>> Balance After', await web3.eth.getBalance(accounts[0]));

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
