const { contract, web3: ozWeb3 } = require('@openzeppelin/test-environment');
const { ZWeb3, SimpleProject, Contracts } = require('@openzeppelin/upgrades');

module.exports = function(artifacts) {
  const getContract = artifacts ? artifacts.require.bind(artifacts) : Contracts.getFromLocal.bind(contract);
  const getResultContract = artifacts ? artifacts.require.bind(artifacts) : contract.fromArtifact.bind(contract);

  if (!artifacts) {
    ZWeb3.initialize(ozWeb3.currentProvider);
  }
  const CarToken = getResultContract('CarToken');
  const TokenReserve = getContract('TokenReserve');
  const CarTokenController = getContract('CarTokenController');

  TokenReserve.numberFormat = 'String';
  CarToken.numberFormat = 'String';

  return {
    async deployWhitelistedTokenSale(from, proxyAdmin) {
      const curioProject = new SimpleProject('Curio', null, { from });

      const tokenController = await curioProject.createProxy(CarTokenController, {
        initArgs: [from],
        admin: proxyAdmin
      });

      const token = await CarToken.new(tokenController._address, tokenController._address, tokenController._address, {
        from
      });

      const tokenReserve = await curioProject.createProxy(TokenReserve, {
        initArgs: [from, token.address],
        admin: proxyAdmin
      });

      return {
        token: await getResultContract('CarToken').at(token.address),
        tokenController: await getResultContract('CarTokenController').at(tokenController._address),
        tokenReserve: await getResultContract('TokenReserve').at(tokenReserve._address)
      };
    }
  };
};
