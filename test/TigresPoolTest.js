const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployProxy({ signer, contractName, abi, initializeArgs = [] }) {
  const proxyFactory = await ethers.getContractFactory("UUPSProxy", signer);

  const contract = await (
    await ethers.getContractFactory(contractName, signer)
  ).deploy();

  const intializeCall = contract.interface.encodeFunctionData("initialize", [
    ...initializeArgs,
  ]);

  const proxy = await proxyFactory.deploy(contract.address, intializeCall);

  return new ethers.Contract(proxy.address, abi, signer);
}

describe("Tigres Pool Contract", function () {
  async function deployTigresPoolFixture() {
    const accounts = await ethers.getSigners();
    const [testSigner, s2, ...rest] = accounts;
    const testSignerAddress = testSigner.address;

    const esperABI = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
    ];

    const testEsper = await deployProxy({
      signer: testSigner,
      contractName: "Esper",
      abi: esperABI,
    });

    await testEsper
      .connect(testSigner)
      .approve(s2.address, ethers.constants.MaxUint256);

    let balance = await testEsper.balanceOf(testSigner.address);
    console.log("testSigner Balance:", balance);

    let result = await testEsper.allowance(testSigner.address, s2.address);

    console.log("S2 Allowance:", result);

    return {
      testSignerAddress,
      testEsper,
    };
  }

  it("Should revert when an invalid address is passed to the swap function", async function () {
    const { testSignerAddress } = await loadFixture(deployTigresPoolFixture);
    expect(false);
  });

  // it("Should revert when the swap function is called with 0 amount of tokens", async function () {
  //   const { testEsper, testTigresPool } = await loadFixture(
  //     deployTigresPoolFixture
  //   );
  //   await expect(testTigresPool.swap(testEsper.address, 0)).to.be.revertedWith(
  //     "Amount of token being swapped must be greater than 0"
  //   );
  // });
  // it("Should resolve to true if the Esper token is being swapped", async function () {
  //   const { testSigner, testTigresPool, testEsper } = await loadFixture(
  //     deployTigresPoolFixture
  //   );
  //   await testTigresPool.connect(testSigner).swap(testEsper.address, 10);
  // });
});
