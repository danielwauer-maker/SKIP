import { expect } from "chai";
import { ethers } from "hardhat";

const USDC = (value: string) => ethers.parseUnits(value, 6);

describe("MockUSDC", function () {
  it("uses 6 decimals for local/testnet USDC simulation", async function () {
    const [owner] = await ethers.getSigners();
    const usdc = await ethers.deployContract("MockUSDC", [owner.address]);

    expect(await usdc.decimals()).to.equal(6);
    expect(await usdc.name()).to.equal("Mock USDC");
    expect(await usdc.symbol()).to.equal("mUSDC");
  });

  it("allows only owner to mint", async function () {
    const [owner, user] = await ethers.getSigners();
    const usdc = await ethers.deployContract("MockUSDC", [owner.address]);

    await expect(usdc.connect(user).mint(user.address, USDC("1")))
      .to.be.revertedWithCustomError(usdc, "OwnableUnauthorizedAccount")
      .withArgs(user.address);

    await usdc.connect(owner).mint(user.address, USDC("100"));
    expect(await usdc.balanceOf(user.address)).to.equal(USDC("100"));
  });

  it("allows transferred owner to mint and blocks the old owner", async function () {
    const [owner, nextOwner, user] = await ethers.getSigners();
    const usdc = await ethers.deployContract("MockUSDC", [owner.address]);

    await usdc.connect(owner).transferOwnership(nextOwner.address);
    await expect(usdc.connect(owner).mint(user.address, USDC("1")))
      .to.be.revertedWithCustomError(usdc, "OwnableUnauthorizedAccount")
      .withArgs(owner.address);

    await usdc.connect(nextOwner).mint(user.address, USDC("25"));
    expect(await usdc.balanceOf(user.address)).to.equal(USDC("25"));
  });
});
