import { expect } from "chai";
import { ethers } from "hardhat";

describe("SkipToken", function () {
  it("mints the fixed total supply to the initial owner", async function () {
    const [owner] = await ethers.getSigners();
    const token = await ethers.deployContract("SkipToken", [owner.address]);

    const expectedSupply = ethers.parseUnits("1000000000000", 18);
    expect(await token.totalSupply()).to.equal(expectedSupply);
    expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
    expect(await token.name()).to.equal("SKIP");
    expect(await token.symbol()).to.equal("SKIP");
  });

  it("does not expose any further minting function", async function () {
    const [owner] = await ethers.getSigners();
    const token = await ethers.deployContract("SkipToken", [owner.address]);

    expect((token.interface as unknown as { hasFunction(name: string): boolean }).hasFunction("mint")).to.equal(false);
  });

  it("supports ownership transfer without changing fixed supply", async function () {
    const [owner, nextOwner] = await ethers.getSigners();
    const token = await ethers.deployContract("SkipToken", [owner.address]);
    const supplyBefore = await token.totalSupply();

    await expect(token.connect(owner).transferOwnership(nextOwner.address))
      .to.emit(token, "OwnershipTransferred")
      .withArgs(owner.address, nextOwner.address);

    expect(await token.owner()).to.equal(nextOwner.address);
    expect(await token.totalSupply()).to.equal(supplyBefore);
    expect((token.interface as unknown as { hasFunction(name: string): boolean }).hasFunction("mint")).to.equal(false);
  });
});
