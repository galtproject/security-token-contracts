const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { assert } = require('chai');

const MintableErc20Token = contract.fromArtifact('ERC20Mintable');

const { ether, assertRevert } = require('@galtproject/solidity-test-chest')(web3);

const { deployWhitelistedTokenSale } = require('../helpers/deploy')();

MintableErc20Token.numberFormat = 'String';

const { utf8ToHex } = web3.utils;
// const bytes32 = utf8ToHex;

describe('TokenReserve', () => {
  const [owner, proxyAdmin, bob, newBob, dan, alice] = accounts;

  const bobKey = utf8ToHex('bob');

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
});
