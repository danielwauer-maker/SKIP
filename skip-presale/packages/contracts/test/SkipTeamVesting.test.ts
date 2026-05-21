import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const SKIP = (value: string) => ethers.parseUnits(value, 18);
const DAY = 24 * 60 * 60;

async function deployFixture() {
  const [owner, beneficiary, nextBeneficiary] = await ethers.getSigners();
  const start = await time.latest();
  const token = await ethers.deployContract("SkipToken", [owner.address]);
  const vesting = await ethers.deployContract("SkipTeamVesting", [
    await token.getAddress(),
    beneficiary.address,
    start,
    owner.address
  ]);
  await token.transfer(await vesting.getAddress(), SKIP("70000000000"));
  return { owner, beneficiary, nextBeneficiary, token, vesting, start };
}

describe("SkipTeamVesting", function () {
  it("blocks zero address beneficiary", async function () {
    const [owner] = await ethers.getSigners();
    const token = await ethers.deployContract("SkipToken", [owner.address]);
    await expect(
      ethers.deployContract("SkipTeamVesting", [await token.getAddress(), ethers.ZeroAddress, await time.latest(), owner.address])
    ).to.be.revertedWithCustomError(await ethers.getContractFactory("SkipTeamVesting"), "ZeroAddress");
  });

  it("does not release before the 12 month cliff", async function () {
    const { vesting } = await deployFixture();
    expect(await vesting.releasable()).to.equal(0);
    await expect(vesting.release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("starts linear release after cliff and fully releases after 24 months", async function () {
    const { beneficiary, token, vesting } = await deployFixture();
    const allocation = SKIP("70000000000");

    await time.increase(365 * DAY + 365 * DAY);
    expect(await vesting.releasable()).to.be.closeTo(allocation / 2n, SKIP("100000"));
    await expect(vesting.release()).to.emit(vesting, "TokensReleased");
    const firstRelease = await token.balanceOf(beneficiary.address);
    expect(await vesting.released()).to.equal(firstRelease);

    await time.increase(365 * DAY);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(allocation);
    expect(await vesting.released()).to.equal(allocation);
    await expect(vesting.release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("multiple releases only transfer the vested delta", async function () {
    const { beneficiary, token, vesting } = await deployFixture();

    await time.increase(365 * DAY + 180 * DAY);
    await vesting.release();
    const firstBalance = await token.balanceOf(beneficiary.address);

    await time.increase(180 * DAY);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.be.gt(firstBalance);
    expect(await token.balanceOf(beneficiary.address)).to.be.lt(SKIP("70000000000"));
  });

  it("owner can update beneficiary but not to zero address", async function () {
    const { owner, nextBeneficiary, vesting } = await deployFixture();
    await expect(vesting.connect(owner).updateBeneficiary(nextBeneficiary.address))
      .to.emit(vesting, "BeneficiaryUpdated")
      .withArgs(await vesting.beneficiary(), nextBeneficiary.address);
    expect(await vesting.beneficiary()).to.equal(nextBeneficiary.address);
    await expect(vesting.connect(owner).updateBeneficiary(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      vesting,
      "ZeroAddress"
    );
  });
});
