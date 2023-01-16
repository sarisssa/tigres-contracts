const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tigres Pool Contract", function () {
  async function deployTigresPoolFixture() {
    const accounts = await ethers.getSigners();
    const randomAddresses = [
      accounts[0].address,
      accounts[1].address,
      accounts[2].address,
    ];
    const esperTokenFactory = await ethers.getContractFactory("Esper");
    const esperToken = await esperTokenFactory.deploy();
    const esperTokenAddress = esperToken.address;

    const azoriusTokenFactory = await ethers.getContractFactory("Azorius");
    const azoriusToken = await azoriusTokenFactory.deploy();
    const azoriusTokenAddress = azoriusToken.address;

    const tigresPoolFactory = await ethers.getContractFactory("TigresPool");

    const tigresPoolInstance = await tigresPoolFactory.deploy(
      esperTokenAddress,
      azoriusTokenAddress
    );
    let res = await esperToken.approve(tigresPoolInstance.address, 1000);
    console.log(res);
    let result = await esperToken._allowances();
    // console.log(await tigresPoolInstance.reserve0());

    return {
      randomAddresses,
      esperToken,
      esperTokenAddress,
      azoriusTokenAddress,
      tigresPoolInstance,
    };
  }

  it("Should revert when an invalid address is passed to the swap function", async function () {
    const { randomAddresses, tigresPoolInstance } = await loadFixture(
      deployTigresPoolFixture
    );
    const randomAddress = randomAddresses[0];
    await expect(
      tigresPoolInstance.swap(randomAddress, 1000)
    ).to.be.revertedWith("Invalid token being swapped");
  });

  it("Should revert when the swap function is called with 0 amount of tokens", async function () {
    const { esperTokenAddress, tigresPoolInstance } = await loadFixture(
      deployTigresPoolFixture
    );
    await expect(
      tigresPoolInstance.swap(esperTokenAddress, 0)
    ).to.be.revertedWith(
      "Amount of token being swapped must be greater than 0"
    );
  });
});
