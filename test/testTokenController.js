const { accounts } = require('@openzeppelin/test-environment');
// eslint-disable-next-line import/order
const { contract } = require('./twrapper');
const { assert } = require('chai');

const MintableErc20Token = contract.fromArtifact('ERC20Mintable');

const { ether, assertRevert } = require('@galtproject/solidity-test-chest')(web3);

const { deployWhitelistedTokenSale } = require('../helpers/deploy')();

MintableErc20Token.numberFormat = 'String';

const { utf8ToHex } = web3.utils;
// const bytes32 = utf8ToHex;

describe('TokenController', () => {
  const [owner, proxyAdmin, bob, newBob, dan, alice, newAlice] = accounts;

  const bobKey = utf8ToHex('bob');
  const aliceKey = utf8ToHex('alice');

  beforeEach(async function() {
    const { token, tokenController } = await deployWhitelistedTokenSale(owner, proxyAdmin);
    this.mainToken = token;
    this.tokenController = tokenController;

    await this.tokenController.addAdmin(owner, { from: owner });

    await this.tokenController.setToken(this.mainToken.address, { from: owner });

    await this.tokenController.mintTokens(owner, ether(1000), { from: owner });
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
      assert.equal(await this.tokenController.keyOfInvestor(bob), bobKey.padEnd(66, '0'));
      assert.equal((await this.tokenController.investors(bobKey)).addr, bob);

      await assertRevert(
        this.tokenController.addNewInvestors([bobKey], [alice], { from: owner }),
        'Investor already exists'
      );

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

      await this.tokenController.mintTokens(bob, ether(1000), { from: dan });

      assert.equal(await this.mainToken.balanceOf(bob), ether(1000));

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), true);
      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), false);

      await this.tokenController.changeInvestorAddressAndMigrateBalance(bobKey, newBob, { from: dan });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);
      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), true);

      assert.equal(await this.mainToken.balanceOf(bob), ether(0));
      assert.equal(await this.mainToken.balanceOf(newBob), ether(1000));

      await this.tokenController.setInvestorActive(bobKey, false, { from: dan });

      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), false);
    });
  });

  describe('investor', () => {
    it('should change address correctly', async function() {
      await this.tokenController.addNewInvestors([bobKey, aliceKey], [bob, alice], { from: owner });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), true);
      assert.equal(await this.tokenController.keyOfInvestor(bob), bobKey.padEnd(66, '0'));
      assert.equal((await this.tokenController.investors(bobKey)).addr, bob);

      assert.equal(await this.tokenController.isInvestorAddressActive(alice), true);
      assert.equal(await this.tokenController.keyOfInvestor(alice), aliceKey.padEnd(66, '0'));
      assert.equal((await this.tokenController.investors(aliceKey)).addr, alice);

      await this.tokenController.mintTokens(bob, ether(1000), { from: owner });

      assert.equal(await this.mainToken.balanceOf(bob), ether(1000));

      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), false);

      await assertRevert(
        this.tokenController.changeMyAddressAndMigrateBalance(bobKey, newBob, { from: owner }),
        'Investor address and msg.sender does not match'
      );
      await assertRevert(
        this.tokenController.changeMyAddressAndMigrateBalance(aliceKey, newBob, { from: bob }),
        'Investor address and msg.sender does not match'
      );
      await this.tokenController.changeMyAddressAndMigrateBalance(bobKey, newBob, { from: bob });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);
      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), true);

      assert.equal(await this.mainToken.balanceOf(bob), ether(0));
      assert.equal(await this.mainToken.balanceOf(newBob), ether(1000));

      await this.tokenController.mintTokens(alice, ether(1000), { from: owner });

      await assertRevert(
        this.tokenController.changeMyAddress(aliceKey, newBob, { from: alice }),
        'Address already claimed'
      );

      await this.tokenController.changeMyAddress(aliceKey, newAlice, { from: alice });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);
      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), true);

      assert.equal(await this.mainToken.balanceOf(alice), ether(1000));
      assert.equal(await this.mainToken.balanceOf(newAlice), ether(0));

      await this.tokenController.migrateBalance(alice, newAlice, { from: owner });

      assert.equal(await this.mainToken.balanceOf(alice), ether(0));
      assert.equal(await this.mainToken.balanceOf(newAlice), ether(1000));
    });

    it('pause and deactivate should work', async function() {
      await this.tokenController.addNewInvestors([bobKey, aliceKey], [bob, alice], { from: owner });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), true);
      assert.equal(await this.tokenController.keyOfInvestor(bob), bobKey.padEnd(66, '0'));
      assert.equal((await this.tokenController.investors(bobKey)).addr, bob);

      await this.tokenController.mintTokens(bob, ether(1000), { from: owner });
      await this.tokenController.mintTokens(alice, ether(1000), { from: owner });

      assert.equal(await this.mainToken.balanceOf(bob), ether(1000));

      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), false);

      await assertRevert(this.tokenController.pause({ from: bob }), 'Msg sender is not admin');

      await this.tokenController.pause({ from: owner });

      await assertRevert(this.mainToken.transfer(alice, ether(10), { from: bob }), 'Pausable: paused');

      await assertRevert(this.tokenController.changeMyAddress(bobKey, newBob, { from: bob }), 'Pausable: paused');

      await assertRevert(
        this.tokenController.changeMyAddressAndMigrateBalance(bobKey, newBob, { from: bob }),
        'Pausable: paused'
      );

      await this.tokenController.unpause({ from: owner });

      await this.tokenController.changeMyAddressAndMigrateBalance(bobKey, newBob, { from: bob });

      await this.mainToken.transfer(alice, ether(10), { from: newBob });

      assert.equal(await this.tokenController.isInvestorAddressActive(bob), false);
      assert.equal(await this.tokenController.isInvestorAddressActive(newBob), true);

      assert.equal(await this.mainToken.balanceOf(bob), ether(0));
      assert.equal((await this.mainToken.balanceOf(newBob)).toString(10), ether(990));
      assert.equal((await this.mainToken.balanceOf(alice)).toString(10), ether(1010));

      await this.tokenController.setInvestorActive(bobKey, false, { from: owner });

      await assertRevert(
        this.mainToken.transfer(alice, ether(10), { from: newBob }),
        'The address has no Car token transfer permission'
      );

      await this.tokenController.setInvestorActive(bobKey, true, { from: owner });

      await this.mainToken.transfer(alice, ether(10), { from: newBob });

      assert.equal((await this.mainToken.balanceOf(newBob)).toString(10), ether(980));
      assert.equal((await this.mainToken.balanceOf(alice)).toString(10), ether(1020));
    });
  });
});
