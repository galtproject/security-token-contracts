const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { assert } = require('chai');
const _ = require('lodash');

const MintableErc20Token = contract.fromArtifact('ERC20Mintable');

const { ether, assertRevert } = require('@galtproject/solidity-test-chest')(web3);

const { deployWhitelistedTokenSale } = require('../helpers/deploy')();

MintableErc20Token.numberFormat = 'String';

const { utf8ToHex } = web3.utils;
// const bytes32 = utf8ToHex;

describe('TokenReserve', () => {
  const [owner, proxyAdmin, bob, charlie, dan, wallet, alice] = accounts;

  const bobKey = utf8ToHex('bob');
  const reserveKey = utf8ToHex('reserve');

  beforeEach(async function() {
    this.daiToken = await MintableErc20Token.new();
    await this.daiToken.mint(bob, ether(1000));
    await this.daiToken.mint(dan, ether(1000));

    this.tusdToken = await MintableErc20Token.new();
    await this.tusdToken.mint(bob, ether(1000));
    await this.tusdToken.mint(dan, ether(1000));

    this.xchfToken = await MintableErc20Token.new();
    await this.xchfToken.mint(bob, ether(1000));
    await this.xchfToken.mint(dan, ether(1000));

    const { token, tokenController, tokenReserve } = await deployWhitelistedTokenSale(owner, proxyAdmin);
    this.mainToken = token;
    this.tokenController = tokenController;
    this.tokenReserve = tokenReserve;

    await this.tokenReserve.addAdmin(owner, { from: owner });
    await this.tokenController.addAdmin(owner, { from: owner });

    await this.tokenController.addNewInvestors([reserveKey], [this.tokenReserve.address], { from: owner });

    await this.tokenController.setToken(this.mainToken.address, { from: owner });

    await this.tokenController.mintTokens(owner, ether(1000), { from: owner });
    await this.tokenController.mintTokens(this.tokenReserve.address, ether(1000), { from: owner });

    await this.tokenReserve.setWallet(wallet, { from: owner });

    await this.tokenReserve.addOrUpdateCustomerToken(this.daiToken.address, '1', '1', { from: owner });
    await this.tokenReserve.addOrUpdateCustomerToken(this.tusdToken.address, '1', '2', { from: owner });
    await this.tokenReserve.addOrUpdateCustomerToken(this.xchfToken.address, '2', '1', { from: owner });
  });

  describe('initiate', () => {
    it('should initialized successfully', async function() {
      assert.equal(await this.tokenController.isAdmin(owner), true);
      assert.equal(await this.tokenController.owner(), owner);
      assert.equal(await this.tokenReserve.isAdmin(owner), true);
      assert.equal(await this.tokenReserve.owner(), owner);

      assert.equal(await this.tokenReserve.wallet(), wallet);
      assert.equal(await this.tokenReserve.tokenToSell(), this.mainToken.address);
      assert.sameMembers(await this.tokenReserve.getCustomerTokenList(), [
        this.daiToken.address,
        this.tusdToken.address,
        this.xchfToken.address
      ]);
      assert.equal(await this.tokenReserve.getCustomerTokenCount(), '3');
      assert.equal(await this.tokenReserve.isTokenAvailable(this.daiToken.address), true);
      assert.equal(await this.tokenReserve.isTokenAvailable(dan), false);
    });
  });

  describe('getTokenAmount', () => {
    it('should return result token amount correctly', async function() {
      assert.equal(await this.tokenReserve.getTokenAmount(this.daiToken.address, '1'), '1');
      await assertRevert(
        this.tokenReserve.getTokenAmount(this.daiToken.address, '0'),
        "TokenReserve: weiAmount can't be null"
      );

      await assertRevert(
        this.tokenReserve.getTokenAmount(this.tusdToken.address, '1'),
        "TokenReserve: _resultTokenAmount can't be null"
      );
      await assertRevert(
        this.tokenReserve.getTokenAmount(this.tusdToken.address, '0'),
        "TokenReserve: weiAmount can't be null"
      );

      assert.equal(await this.tokenReserve.getTokenAmount(this.xchfToken.address, '1'), '2');
      await assertRevert(
        this.tokenReserve.getTokenAmount(this.xchfToken.address, '0'),
        "TokenReserve: weiAmount can't be null"
      );
    });
  });

  describe('administrate', () => {
    it('should add and remove admins correctly', async function() {
      assert.equal(await this.tokenController.isAdmin(dan), false);
      assert.equal(await this.tokenController.isManager(dan), false);
      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);

      await assertRevert(
        this.tokenController.addNewInvestors([bobKey], [bob], { from: dan }),
        'Managered: Msg sender is not admin or manager'
      );

      await this.tokenController.addNewInvestors([bobKey], [bob], { from: owner });

      await assertRevert(
        this.tokenController.setInvestorActive(bobKey, true, { from: dan }),
        'Managered: Msg sender is not admin or manager'
      );

      await assertRevert(
        this.tokenController.migrateBalance(bob, alice, { from: dan }),
        'Administrated: Msg sender is not admin'
      );

      await assertRevert(
        this.tokenController.changeInvestorAddress(bobKey, alice, { from: dan }),
        'Administrated: Msg sender is not admin'
      );

      await assertRevert(
        this.tokenController.mintTokens(bob, ether(1000), { from: dan }),
        'Administrated: Msg sender is not admin'
      );

      await this.tokenController.addAdmin(dan, { from: owner });

      await assertRevert(this.tokenController.addAdmin(alice, { from: dan }), 'revert');
      await assertRevert(this.tokenController.removeAdmin(alice, { from: dan }), 'revert');

      assert.equal(await this.tokenController.isAdmin(dan), true);

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), true);

      await this.tokenController.setInvestorActive(bobKey, false, { from: dan });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);

      assert.equal(await this.tokenController.isManager(alice), false);
      await this.tokenController.addManager(alice, { from: dan });
      assert.equal(await this.tokenController.isManager(alice), true);
    });

    it('should add and remove managers correctly', async function() {
      assert.equal(await this.tokenController.isManager(dan), false);
      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);

      await assertRevert(
        this.tokenController.addNewInvestors([bobKey], [bob], { from: dan }),
        'Managered: Msg sender is not admin or manager'
      );

      await this.tokenController.addManager(dan, { from: owner });

      assert.equal(await this.tokenController.isManager(dan), true);

      await this.tokenController.addNewInvestors([bobKey], [bob], { from: dan });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), true);
    });
  });

  describe('reserveTokens', () => {
    it('should successfully reserveTokens', async function() {
      await this.tokenController.addAdmin(dan, { from: owner });
      await this.tokenReserve.addAdmin(dan, { from: owner });

      await this.tokenController.addNewInvestors([bobKey], [bob], { from: dan });

      await this.daiToken.approve(this.tokenReserve.address, ether(42), { from: bob });

      assert.equal(await this.daiToken.allowance(bob, this.tokenReserve.address), ether(42));

      const res = await this.tokenReserve.reserveTokens(this.daiToken.address, bob, ether(42), { from: bob });

      const orderId = _.find(res.logs, l => l.args.orderId).args.orderId;
      assert.equal(orderId.toString(), '1');

      const order = await this.tokenReserve.reservedOrders(orderId);
      assert.equal(order.customerTokenAddress, this.daiToken.address);
      assert.equal(order.customerAddress, bob);
      assert.equal(order.customerTokenAmount, ether(42));
      assert.equal(order.tokenToSellAmount, ether(42));
      assert.equal(order.onWallet, true);

      assert.equal(await this.mainToken.balanceOf(bob), ether(0));
      assert.equal(await this.daiToken.balanceOf(bob), ether(1000 - 42));
      assert.equal(await this.daiToken.balanceOf(wallet), ether(42));

      let tokenInfo = await this.tokenReserve.customerTokenInfo(this.daiToken.address);
      assert.equal(tokenInfo.totalReceived, ether(42));
      assert.equal(tokenInfo.totalReserved, ether(42));
      assert.equal(tokenInfo.totalSold, ether(42));

      let customerInfo = await this.tokenReserve.customerInfo(bob);
      assert.equal(customerInfo.currentReserved, ether(42));
      assert.equal(customerInfo.totalReserved, ether(42));

      await assertRevert(
        this.tokenReserve.distributeReserve([bob], { from: bob }),
        'Administrated: Msg sender is not admin'
      );

      // await this.mainToken.contract.methods.transfer(bob, ether(42)).estimateGas({from: this.tokenReserve.address});

      await this.tokenReserve.distributeReserve([bob], { from: dan });

      assert.equal(await this.mainToken.balanceOf(bob), ether(42));

      customerInfo = await this.tokenReserve.customerInfo(bob);
      assert.equal(customerInfo.currentReserved, ether(0));
      assert.equal(customerInfo.totalReserved, ether(42));

      // buy by another person(dan) for customer (bob)
      await this.daiToken.approve(this.tokenReserve.address, ether(42), { from: dan });
      await this.tokenReserve.reserveTokens(this.daiToken.address, bob, ether(42), { from: dan });
      assert.equal(await this.mainToken.balanceOf(dan), ether(0));
      assert.equal(await this.daiToken.balanceOf(dan), ether(1000 - 42));
      assert.equal(await this.daiToken.balanceOf(wallet), ether(84));

      tokenInfo = await this.tokenReserve.customerTokenInfo(this.daiToken.address);
      assert.equal(tokenInfo.totalReceived, ether(84));
      assert.equal(tokenInfo.totalSold, ether(84));
    });

    it('should successfully reserveTokens with rate 1/2', async function() {
      await this.tokenController.addNewInvestors([bobKey], [bob], { from: owner });

      await this.tusdToken.approve(this.tokenReserve.address, ether(42), { from: bob });

      assert.equal(await this.tusdToken.allowance(bob, this.tokenReserve.address), ether(42));

      await this.tokenReserve.reserveTokens(this.tusdToken.address, bob, ether(42), { from: bob });

      await this.tokenReserve.distributeReserve([bob], { from: owner });

      assert.equal(
        (await this.mainToken.balanceOf(bob)).toString(10),
        (await this.tokenReserve.getTokenAmount(this.tusdToken.address, ether(42))).toString(10)
      );
      assert.equal(await this.mainToken.balanceOf(bob), ether(21));
      assert.equal(await this.tusdToken.balanceOf(bob), ether(1000 - 42));
      assert.equal(await this.tusdToken.balanceOf(wallet), ether(42));

      let tokenInfo = await this.tokenReserve.customerTokenInfo(this.tusdToken.address);
      assert.equal(tokenInfo.totalReceived, ether(42));
      assert.equal(tokenInfo.totalSold, ether(21));

      // buy again, but by 10 tokens
      await this.tusdToken.approve(this.tokenReserve.address, ether(10), { from: bob });
      await this.tokenReserve.reserveTokens(this.tusdToken.address, bob, ether(10), { from: bob });

      await this.tokenReserve.distributeReserve([bob], { from: owner });

      assert.equal(await this.mainToken.balanceOf(bob), ether(21 + 5));
      assert.equal(await this.tusdToken.balanceOf(bob), ether(1000 - 42 - 10));
      assert.equal(await this.tusdToken.balanceOf(wallet), ether(42 + 10));

      tokenInfo = await this.tokenReserve.customerTokenInfo(this.tusdToken.address);
      assert.equal(tokenInfo.totalReceived, ether(42 + 10));
      assert.equal(tokenInfo.totalSold, ether(21 + 5));

      await this.tusdToken.approve(this.tokenReserve.address, '1', { from: bob });
      await assertRevert(
        this.tokenReserve.reserveTokens(this.tusdToken.address, bob, '0', { from: bob }),
        "TokenReserve: weiAmount can't be null"
      );
      await assertRevert(
        this.tokenReserve.reserveTokens(this.tusdToken.address, bob, '1', { from: bob }),
        "TokenReserve: _resultTokenAmount can't be null"
      );
    });

    it('should successfully reserveTokens with rate 2/1', async function() {
      await this.tokenController.addNewInvestors([bobKey], [bob], { from: owner });

      await this.xchfToken.approve(this.tokenReserve.address, ether(42), { from: bob });

      assert.equal(await this.xchfToken.allowance(bob, this.tokenReserve.address), ether(42));

      await this.tokenReserve.reserveTokens(this.xchfToken.address, bob, ether(42), { from: bob });

      await this.tokenReserve.distributeReserve([bob], { from: owner });

      assert.equal(await this.mainToken.balanceOf(bob), ether(84));
      assert.equal(await this.xchfToken.balanceOf(bob), ether(1000 - 42));
      assert.equal(await this.xchfToken.balanceOf(wallet), ether(42));

      const tokenInfo = await this.tokenReserve.customerTokenInfo(this.xchfToken.address);
      assert.equal(tokenInfo.totalReceived, ether(42));
      assert.equal(tokenInfo.totalSold, ether(84));

      await assertRevert(
        this.tokenReserve.addOrUpdateCustomerToken(this.xchfToken.address, '4', '1', { from: bob }),
        'Administrated: Msg sender is not admin'
      );

      // update rates and by again
      await this.tokenReserve.addOrUpdateCustomerToken(this.xchfToken.address, '4', '1', { from: owner });

      await this.xchfToken.approve(this.tokenReserve.address, ether(10), { from: bob });
      await this.tokenReserve.reserveTokens(this.xchfToken.address, bob, ether(10), { from: bob });

      await this.tokenReserve.distributeReserve([bob], { from: owner });

      assert.equal(await this.mainToken.balanceOf(bob), ether(84 + 40));
      assert.equal(await this.xchfToken.balanceOf(bob), ether(1000 - 42 - 10));
      assert.equal(await this.xchfToken.balanceOf(wallet), ether(42 + 10));
    });

    it('pause should work properly', async function() {
      await assertRevert(this.tokenReserve.pause({ from: dan }), 'Administrated: Msg sender is not admin');

      await this.tokenReserve.pause({ from: owner });

      await this.tokenController.addNewInvestors([bobKey], [bob], { from: owner });

      await this.daiToken.approve(this.tokenReserve.address, ether(42), { from: bob });

      await assertRevert(
        this.tokenReserve.reserveTokens(this.daiToken.address, bob, ether(42), { from: bob }),
        'Pausable: paused'
      );

      await this.tokenReserve.unpause({ from: owner });

      await this.daiToken.approve(this.tokenReserve.address, ether(42), { from: bob });
      await this.tokenReserve.reserveTokens(this.daiToken.address, bob, ether(42), { from: bob });
    });

    it('should prevent reserveTokens with unacceptable conditions', async function() {
      await this.daiToken.approve(this.tokenReserve.address, ether(42), { from: charlie });

      await assertRevert(
        this.tokenReserve.reserveTokens(this.daiToken.address, charlie, ether(42), { from: charlie }),
        'SafeERC20: low-level call failed'
      );

      await assertRevert(
        this.tokenController.addNewInvestors([bobKey], [charlie], { from: charlie }),
        'Managered: Msg sender is not admin or manager'
      );

      await assertRevert(
        this.tokenReserve.reserveTokens(this.daiToken.address, charlie, ether(42), { from: charlie }),
        'SafeERC20: low-level call failed'
      );

      await assertRevert(
        this.tokenReserve.reserveTokens(this.daiToken.address, bob, ether(42), { from: charlie }),
        'SafeERC20: low-level call failed'
      );
    });

    // it('should correctly upgrade tokenReserve and registry', async function() {
    //   await this.tokenController.addManager(dan, { from: owner });
    //   await this.tokenController.addCustomerToWhiteList(bob, { from: owner });
    //
    //   const newTokenSaleImpl = await NewWhitelistedTokenSaleVer.new({ from: owner });
    //   const newTokenSaleRegistryImpl = await NewTokenSaleRegistryVer.new({ from: owner });
    //
    //   await newTokenSaleImpl.initialize(owner, owner, owner, { from: owner });
    //   await newTokenSaleRegistryImpl.initialize(owner, { from: owner });
    //
    //   const tokenSaleToUpgrade = await BaseAdminUpgradeabilityProxy.at(this.tokenReserve.address);
    //   await tokenSaleToUpgrade.upgradeTo(newTokenSaleImpl.address, { from: proxyAdmin });
    //
    //   const tokenSaleRegistryToUpgrade = await BaseAdminUpgradeabilityProxy.at(this.tokenController.address);
    //   await tokenSaleRegistryToUpgrade.upgradeTo(newTokenSaleRegistryImpl.address, { from: proxyAdmin });
    //
    //   const newTokenSaleVer = await NewWhitelistedTokenSaleVer.at(this.tokenReserve.address);
    //   const newTokenSaleRegistryVer = await NewTokenSaleRegistryVer.at(this.tokenController.address);
    //
    //   // check the new features
    //   assert.equal(await newTokenSaleVer.getCustomerTokenCount(), '999');
    //   await newTokenSaleVer.setFoo('foo');
    //   assert.equal(await newTokenSaleVer.bar(), 'foo');
    //
    //   assert.equal(await newTokenSaleRegistryVer.getCustomersWhiteListCount(), '999');
    //   await newTokenSaleRegistryVer.setRegistryFoo('foo2');
    //   assert.equal(await newTokenSaleRegistryVer.registryBar(), 'foo2');
    //
    //   // check the previous state
    //   assert.equal(await newTokenSaleVer.wallet(), wallet);
    //   assert.equal(await newTokenSaleVer.tokenToSell(), this.mainToken.address);
    //   assert.sameInvestors(await newTokenSaleVer.getCustomerTokenList(), [
    //     this.daiToken.address,
    //     this.tusdToken.address,
    //     this.xchfToken.address
    //   ]);
    //   assert.equal(await newTokenSaleVer.isTokenAvailable(this.daiToken.address), true);
    //   assert.equal(await newTokenSaleVer.isTokenAvailable(dan), false);
    //
    //   assert.equal(await newTokenSaleRegistryVer.isManager(dan), true);
    //   assert.equal(await newTokenSaleRegistryVer.isCustomerInWhiteList(bob), true);
    //   assert.sameInvestors(await newTokenSaleRegistryVer.getCustomersWhiteList(), [bob]);
    // });
  });
});
