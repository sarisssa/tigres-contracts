const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tigres Pool Contract", function () {
  async function deployTigresPoolFixture() {
    const accounts = await ethers.getSigners();
    const testSigner = accounts[0];
    const testSignerAddress = accounts[0].address;

    const proxyFactory = await ethers.getContractFactory(
      "UUPSProxy",
      testSigner
    );

    const esperToken = await (
      await ethers.getContractFactory("Esper", testSigner)
    ).deploy();

    const azoriusToken = await (
      await ethers.getContractFactory("Azorius", testSigner)
    ).deploy();

    const tigresPoolFactory = await ethers.getContractFactory(
      "TigresPool",
      testSigner
    );

    const esperPayload = esperToken.interface.encodeFunctionData(
      "initialize",
      []
    );
    const azoriusPayload = esperToken.interface.encodeFunctionData(
      "initialize",
      []
    );
    const tigresPayload = esperToken.interface.encodeFunctionData(
      "initialize",
      []
    );

    const esperProxy = await proxyFactory.deploy(
      esperToken.address,
      esperPayload
    );

    const azoriusProxy = await proxyFactory.deploy(
      azoriusToken.address,
      azoriusPayload
    );

    const tigresPoolInstance = await tigresPoolFactory.deploy(
      esperProxy.address,
      azoriusProxy.address
    );

    const tigresProxy = await proxyFactory.deploy(
      tigresPoolInstance.address,
      tigresPayload
    );

    const esperABI = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
    ];

    const tigresPoolABI = [
      "function swap(address _tokenIn, uint256 _amountIn) returns (uint256)",
    ];

    const testEsper = new ethers.Contract(
      esperProxy.address,
      esperABI,
      testSigner
    );

    const testTigresPool = new ethers.Contract(
      tigresProxy.address,
      tigresPoolABI,
      testSigner
    );

    await testEsper //Approve does not seem to be working
      .connect(testSigner)
      .approve(testTigresPool.address, ethers.constants.MaxUint256);

    let balance = await testEsper.balanceOf(testSigner.address);
    console.log("testSigner Balance:", balance);

    let result = await esperToken
      .connect(testSigner)
      .allowance(testSigner.address, tigresProxy.address);

    console.log("Dex Allowance:", result); //Currently 0

    return {
      testSignerAddress,
      testEsper,
      testTigresPool,
    };
  }

  it("Should revert when an invalid address is passed to the swap function", async function () {
    const { testSignerAddress, testTigresPool } = await loadFixture(
      deployTigresPoolFixture
    );
    await expect(
      testTigresPool.swap(testSignerAddress, 1000000)
    ).to.be.revertedWith("Invalid token being swapped");
  });

  it("Should revert when the swap function is called with 0 amount of tokens", async function () {
    const { testEsper, testTigresPool } = await loadFixture(
      deployTigresPoolFixture
    );
    await expect(testTigresPool.swap(testEsper.address, 0)).to.be.revertedWith(
      "Amount of token being swapped must be greater than 0"
    );
  });
  it("Should resolve to true if the Esper token is being swapped", async function () {
    const { testSigner, testTigresPool, testEsper } = await loadFixture(
      deployTigresPoolFixture
    );
    await testTigresPool.connect(testSigner).swap(testEsper.address, 10);
  });
});
