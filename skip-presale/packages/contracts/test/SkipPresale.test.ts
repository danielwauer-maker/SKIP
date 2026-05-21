import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (value: string) => ethers.parseUnits(value, 6);
const SKIP = (value: string) => ethers.parseUnits(value, 18);
const PRESALE_ALLOCATION = SKIP("240000000000");

async function deployFixture(offsetStart = -10, duration = 30 * 24 * 60 * 60) {
  const [owner, buyer, buyer2, treasury] = await ethers.getSigners();
  const now = await time.latest();
  const start = now + offsetStart;
  const end = start + duration;

  const skip = await ethers.deployContract("SkipToken", [owner.address]);
  const usdc = await ethers.deployContract("MockUSDC", [owner.address]);
  const presale = await ethers.deployContract("SkipPresale", [
    await skip.getAddress(),
    await usdc.getAddress(),
    start,
    end,
    owner.address
  ]);

  await skip.transfer(await presale.getAddress(), PRESALE_ALLOCATION);
  await usdc.mint(buyer.address, USDC("3000000"));
  await usdc.mint(buyer2.address, USDC("3000000"));
  await usdc.mint(owner.address, USDC("1000000"));
  await usdc.connect(buyer).approve(await presale.getAddress(), ethers.MaxUint256);
  await usdc.connect(buyer2).approve(await presale.getAddress(), ethers.MaxUint256);
  await usdc.connect(owner).approve(await presale.getAddress(), ethers.MaxUint256);

  return { owner, buyer, buyer2, treasury, skip, usdc, presale, start, end };
}

describe("SkipPresale", function () {
  it("blocks buys before start and after end", async function () {
    const future = await deployFixture(3600);
    await expect(future.presale.connect(future.buyer).buy(USDC("10"))).to.be.revertedWithCustomError(
      future.presale,
      "PresaleNotStarted"
    );

    const active = await deployFixture();
    await time.increaseTo(active.end + 1);
    await expect(active.presale.connect(active.buyer).buy(USDC("10"))).to.be.revertedWithCustomError(
      active.presale,
      "PresaleEnded"
    );
  });

  it("requires allowance and records a normal USDC purchase", async function () {
    const { buyer, usdc, presale } = await deployFixture();
    await usdc.connect(buyer).approve(await presale.getAddress(), 0);

    await expect(presale.connect(buyer).buy(USDC("100"))).to.be.reverted;

    await usdc.connect(buyer).approve(await presale.getAddress(), USDC("100"));
    await expect(presale.connect(buyer).buy(USDC("100")))
      .to.emit(presale, "TokensPurchased")
      .withArgs(buyer.address, USDC("100"), SKIP("25000000"));

    const info = await presale.getUserInfo(buyer.address);
    expect(info.contributed).to.equal(USDC("100"));
    expect(info.purchased).to.equal(SKIP("25000000"));
    expect(await usdc.balanceOf(await presale.getAddress())).to.equal(USDC("100"));
  });

  it("calculates stages and moves to the next stage when a stage sells out", async function () {
    const { buyer, presale } = await deployFixture();

    expect(await presale.getCurrentStage()).to.equal(0);
    await presale.connect(buyer).buy(USDC("80000"));
    expect(await presale.getCurrentStage()).to.equal(1);

    const stage0 = await presale.getStage(0);
    expect(stage0.sold).to.equal(SKIP("20000000000"));
  });

  it("supports purchases across multiple stages", async function () {
    const { buyer, presale } = await deployFixture();

    await presale.connect(buyer).buy(USDC("80005"));
    const info = await presale.getUserInfo(buyer.address);
    expect(info.purchased).to.equal(SKIP("20001000000"));
    expect(await presale.getCurrentStage()).to.equal(1);
  });

  it("strictly enforces the hardcap", async function () {
    const { buyer, buyer2, presale } = await deployFixture();

    await presale.connect(buyer).buy(USDC("2000000"));
    await expect(presale.connect(buyer2).buy(1)).to.be.revertedWithCustomError(presale, "HardCapExceeded");
  });

  it("pause blocks buying and unpause restores buying", async function () {
    const { owner, buyer, presale } = await deployFixture();

    await presale.connect(owner).pause();
    await expect(presale.connect(buyer).buy(USDC("10"))).to.be.revertedWithCustomError(presale, "EnforcedPause");
    await presale.connect(owner).unpause();
    await expect(presale.connect(buyer).buy(USDC("10"))).to.emit(presale, "TokensPurchased");
  });

  it("blocks finalize before end unless the hardcap is reached", async function () {
    const { owner, buyer, presale } = await deployFixture();

    await expect(presale.connect(owner).finalize()).to.be.revertedWithCustomError(presale, "PresaleStillActive");
    await presale.connect(buyer).buy(USDC("2000000"));
    await expect(presale.connect(owner).finalize()).to.emit(presale, "Finalized").withArgs(true, false);
  });

  it("enables claim after a successful finalize and blocks claim before finalize", async function () {
    const { owner, buyer, skip, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(USDC("250000"));
    await expect(presale.connect(buyer).claim()).to.be.revertedWithCustomError(presale, "ClaimNotEnabled");

    await time.increaseTo(end + 1);
    await presale.connect(owner).finalize();
    const purchasedAmount = (await presale.getUserInfo(buyer.address)).purchased;
    await expect(presale.connect(buyer).claim()).to.emit(presale, "Claimed");
    expect(await skip.balanceOf(buyer.address)).to.equal(purchasedAmount);
  });

  it("enables refund after an unsuccessful finalize when refund liquidity is intact", async function () {
    const { owner, buyer, usdc, presale, end } = await deployFixture();

    const before = await usdc.balanceOf(buyer.address);
    await presale.connect(buyer).buy(USDC("1000"));
    await expect(presale.connect(buyer).refund()).to.be.revertedWithCustomError(presale, "RefundNotEnabled");

    await time.increaseTo(end + 1);
    await expect(presale.connect(owner).finalize()).to.emit(presale, "Finalized").withArgs(false, true);
    await expect(presale.connect(buyer).refund()).to.emit(presale, "Refunded").withArgs(buyer.address, USDC("1000"));
    expect(await usdc.balanceOf(buyer.address)).to.equal(before);
  });

  it("limits development withdrawals to 25 percent and tracks accounting", async function () {
    const { owner, buyer, treasury, usdc, presale } = await deployFixture();

    await presale.connect(buyer).buy(USDC("100000"));
    await expect(presale.connect(owner).withdrawDevelopmentFunds(treasury.address))
      .to.emit(presale, "DevelopmentFundsWithdrawn")
      .withArgs(treasury.address, USDC("25000"));

    expect(await presale.developmentWithdrawn()).to.equal(USDC("25000"));
    expect(await usdc.balanceOf(treasury.address)).to.equal(USDC("25000"));
    await expect(presale.connect(owner).withdrawDevelopmentFunds(treasury.address)).to.be.revertedWithCustomError(
      presale,
      "InvalidAmount"
    );
  });

  it("requires repayment before activating refunds when development funds are missing", async function () {
    const { owner, buyer, treasury, usdc, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(USDC("100000"));
    await presale.connect(owner).withdrawDevelopmentFunds(treasury.address);
    await time.increaseTo(end + 1);
    await expect(presale.connect(owner).finalize()).to.emit(presale, "Finalized").withArgs(false, false);
    expect((await presale.getPresaleInfo()).refundEnabled).to.equal(false);

    await usdc.connect(treasury).approve(await presale.getAddress(), USDC("25000"));
    await expect(presale.connect(treasury).repayDevelopmentFunds(USDC("25000")))
      .to.emit(presale, "DevelopmentFundsRepaid")
      .withArgs(treasury.address, USDC("25000"));

    expect((await presale.getPresaleInfo()).refundEnabled).to.equal(true);
    await expect(presale.connect(buyer).refund()).to.emit(presale, "Refunded");
  });

  it("allows remaining funds withdrawal only after successful finalize", async function () {
    const { owner, buyer, treasury, usdc, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(USDC("250000"));
    await expect(presale.connect(owner).withdrawRemainingFunds(treasury.address)).to.be.revertedWithCustomError(
      presale,
      "NotFinalized"
    );

    await time.increaseTo(end + 1);
    await presale.connect(owner).finalize();
    await expect(presale.connect(owner).withdrawRemainingFunds(treasury.address)).to.emit(
      presale,
      "RemainingFundsWithdrawn"
    );
    expect(await usdc.balanceOf(await presale.getAddress())).to.equal(0);
  });

  it("withdraws unsold tokens without touching claimable balances", async function () {
    const { owner, buyer, treasury, skip, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(USDC("250000"));
    const purchasedAmount = (await presale.getUserInfo(buyer.address)).purchased;
    await time.increaseTo(end + 1);
    await presale.connect(owner).finalize();

    await expect(presale.connect(owner).withdrawUnsoldTokens(treasury.address)).to.emit(
      presale,
      "UnsoldTokensWithdrawn"
    );
    expect(await skip.balanceOf(await presale.getAddress())).to.equal(purchasedAmount);
  });
});
