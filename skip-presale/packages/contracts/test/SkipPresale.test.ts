import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const USDC = (value: string) => ethers.parseUnits(value, 6);
const SKIP = (value: string) => ethers.parseUnits(value, 18);
const PRESALE_ALLOCATION = SKIP("240000000000");
const FULL_STAGE_RAISE = USDC("3720000");
const SOFTCAP_WITH_DUST_BUFFER = USDC("250000") + 1n;
const DAY = 24 * 60 * 60;
const STAGE_PRICES = [4n, 5n, 6n, 8n, 9n, 11n, 13n, 16n, 20n, 25n, 31n, 38n] as const;
const STAGE_RAISES = [
  USDC("80000"),
  USDC("100000"),
  USDC("120000"),
  USDC("160000"),
  USDC("180000"),
  USDC("220000"),
  USDC("260000"),
  USDC("320000"),
  USDC("400000"),
  USDC("500000"),
  USDC("620000"),
  USDC("760000")
] as const;

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
  await usdc.mint(buyer.address, USDC("5000000"));
  await usdc.mint(buyer2.address, USDC("5000000"));
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

  it("sells each exact stage raise without exceeding stage caps", async function () {
    const { buyer, presale } = await deployFixture();

    for (let index = 0; index < STAGE_RAISES.length; index++) {
      await presale.connect(buyer).buy(STAGE_RAISES[index]);
      const stage = await presale.getStage(index);
      expect(stage.sold).to.equal(SKIP("20000000000"));
    }

    expect(await presale.totalStageRaise()).to.equal(await presale.HARD_CAP());
    expect((await presale.getPresaleInfo()).totalRaised).to.equal(FULL_STAGE_RAISE);
    expect(await presale.allStagesSoldOut()).to.equal(true);
  });

  it("accepts dust-producing buys at every stage price and only records USDC actually used", async function () {
    for (let index = 0; index < STAGE_PRICES.length; index++) {
      const { buyer, usdc, presale } = await deployFixture();
      for (let previous = 0; previous < index; previous++) {
        await presale.connect(buyer).buy(STAGE_RAISES[previous]);
      }

      const beforeBuyerUsdc = await usdc.balanceOf(buyer.address);
      const beforeInfo = await presale.getPresaleInfo();
      const amount = USDC("1");
      const expectedTokens = (amount * 10n ** 18n) / STAGE_PRICES[index];
      const expectedUsed = (expectedTokens * STAGE_PRICES[index]) / 10n ** 18n;

      await expect(presale.connect(buyer).buy(amount))
        .to.emit(presale, "TokensPurchased")
        .withArgs(buyer.address, expectedUsed, expectedTokens);

      const afterInfo = await presale.getPresaleInfo();
      expect(afterInfo.totalRaised - beforeInfo.totalRaised).to.equal(expectedUsed);
      expect(afterInfo.totalSold - beforeInfo.totalSold).to.equal(expectedTokens);
      expect(beforeBuyerUsdc - (await usdc.balanceOf(buyer.address))).to.equal(expectedUsed);
      const stage = await presale.getStage(index);
      expect(stage.sold).to.equal(expectedTokens);
      expect(stage.sold).to.be.lte(stage.tokenCap);
    }
  });

  it("handles dust across stage boundaries for non-even prices", async function () {
    for (const stageIndex of [2, 5, 6, 10, 11]) {
      const { buyer, presale } = await deployFixture();
      for (let previous = 0; previous < stageIndex; previous++) {
        await presale.connect(buyer).buy(STAGE_RAISES[previous]);
      }

      const amount = STAGE_RAISES[stageIndex] + 1n;
      await expect(presale.connect(buyer).buy(amount)).to.emit(presale, "TokensPurchased");

      const stage = await presale.getStage(stageIndex);
      expect(stage.sold).to.equal(stage.tokenCap);
      expect(stage.sold).to.be.lte(stage.tokenCap);
      expect((await presale.getPresaleInfo()).totalRaised).to.be.lte(await presale.HARD_CAP());
    }
  });

  it("strictly enforces the hardcap", async function () {
    const { buyer, buyer2, presale } = await deployFixture();

    await presale.connect(buyer).buy(FULL_STAGE_RAISE);
    await expect(presale.connect(buyer2).buy(1)).to.be.revertedWithCustomError(presale, "HardCapExceeded");
  });

  it("keeps total stage raise equal to the hardcap", async function () {
    const { presale } = await deployFixture();

    expect(await presale.totalStageRaise()).to.equal(await presale.HARD_CAP());
    expect(await presale.totalStageRaise()).to.equal(FULL_STAGE_RAISE);
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
    await presale.connect(buyer).buy(FULL_STAGE_RAISE);
    await expect(presale.connect(owner).finalize()).to.emit(presale, "Finalized").withArgs(true, false);
  });

  it("enables claim after a successful finalize and blocks claim before finalize", async function () {
    const { owner, buyer, skip, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(SOFTCAP_WITH_DUST_BUFFER);
    await expect(presale.connect(buyer).claim()).to.be.revertedWithCustomError(presale, "ClaimNotEnabled");

    await time.increaseTo(end + 1);
    await presale.connect(owner).finalize();
    const purchasedAmount = (await presale.getUserInfo(buyer.address)).purchased;
    const amountToClaim = await presale.claimable(buyer.address);
    await expect(presale.connect(buyer).claim()).to.emit(presale, "Claimed");
    expect(amountToClaim).to.equal(purchasedAmount / 2n);
    expect(await skip.balanceOf(buyer.address)).to.be.gte(purchasedAmount / 2n);
    expect(await skip.balanceOf(buyer.address)).to.be.lte(purchasedAmount);
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

    await presale.connect(buyer).buy(USDC("100"));
    expect(await presale.completedStageRaised()).to.equal(0);
    expect(await presale.maxDevelopmentWithdrawable()).to.equal(0);
    await expect(presale.connect(owner).withdrawDevelopmentFunds(treasury.address)).to.be.revertedWithCustomError(
      presale,
      "InvalidAmount"
    );

    await presale.connect(buyer).buy(USDC("79900"));
    expect(await presale.completedStageRaised()).to.equal(USDC("80000"));
    expect(await presale.maxDevelopmentWithdrawable()).to.equal(USDC("20000"));
    await expect(presale.connect(owner).withdrawDevelopmentFunds(treasury.address))
      .to.emit(presale, "DevelopmentFundsWithdrawn")
      .withArgs(treasury.address, USDC("20000"));

    expect(await presale.developmentWithdrawn()).to.equal(USDC("20000"));
    expect(await usdc.balanceOf(treasury.address)).to.equal(USDC("20000"));
    await expect(presale.connect(owner).withdrawDevelopmentFunds(treasury.address)).to.be.revertedWithCustomError(
      presale,
      "InvalidAmount"
    );
  });

  it("unlocks only the additional 25 percent when stage 2 completes", async function () {
    const { owner, buyer, treasury, presale } = await deployFixture();

    await presale.connect(buyer).buy(USDC("80000"));
    await presale.connect(owner).withdrawDevelopmentFunds(treasury.address);
    expect(await presale.maxDevelopmentWithdrawable()).to.equal(0);

    await presale.connect(buyer).buy(USDC("100000"));
    expect(await presale.completedStageRaised()).to.equal(USDC("180000"));
    expect(await presale.maxDevelopmentWithdrawable()).to.equal(USDC("25000"));
    await expect(presale.connect(owner).withdrawDevelopmentFunds(treasury.address))
      .to.emit(presale, "DevelopmentFundsWithdrawn")
      .withArgs(treasury.address, USDC("25000"));
    expect(await presale.developmentWithdrawn()).to.equal(USDC("45000"));
  });

  it("requires repayment before activating refunds when development funds are missing", async function () {
    const { owner, buyer, treasury, usdc, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(USDC("80000"));
    await presale.connect(owner).withdrawDevelopmentFunds(treasury.address);
    await time.increaseTo(end + 1);
    await expect(presale.connect(owner).finalize()).to.emit(presale, "Finalized").withArgs(false, false);
    expect((await presale.getPresaleInfo()).refundEnabled).to.equal(false);

    await expect(presale.connect(buyer).refund()).to.be.revertedWithCustomError(presale, "RefundNotEnabled");

    await usdc.connect(treasury).approve(await presale.getAddress(), USDC("20000"));
    await expect(presale.connect(treasury).repayDevelopmentFunds(USDC("20000")))
      .to.emit(presale, "DevelopmentFundsRepaid")
      .withArgs(treasury.address, USDC("20000"));

    expect((await presale.getPresaleInfo()).refundEnabled).to.equal(true);
    await expect(presale.connect(buyer).refund()).to.emit(presale, "Refunded");
  });

  it("reaches allStagesSoldOut and finalizes before end without contradicting the hardcap", async function () {
    const { owner, buyer, presale } = await deployFixture();

    await presale.connect(buyer).buy(FULL_STAGE_RAISE - 38n);
    expect(await presale.allStagesSoldOut()).to.equal(false);
    await presale.connect(buyer).buy(38);
    expect(await presale.allStagesSoldOut()).to.equal(true);
    expect((await presale.getPresaleInfo()).totalRaised).to.equal(await presale.HARD_CAP());
    await expect(presale.connect(owner).finalize()).to.emit(presale, "Finalized").withArgs(true, false);
    await expect(presale.connect(buyer).buy(1)).to.be.revertedWithCustomError(presale, "HardCapExceeded");
  });

  it("allows a near-hardcap buy with only rounding dust left unspent", async function () {
    const { buyer, usdc, presale } = await deployFixture();

    await presale.connect(buyer).buy(FULL_STAGE_RAISE - 38n);
    const before = await usdc.balanceOf(buyer.address);
    await expect(presale.connect(buyer).buy(39n)).to.emit(presale, "TokensPurchased");

    const info = await presale.getPresaleInfo();
    expect(info.totalRaised).to.be.lte(await presale.HARD_CAP());
    expect(info.totalSold).to.equal(PRESALE_ALLOCATION);
    expect(await presale.allStagesSoldOut()).to.equal(true);
    expect(before - (await usdc.balanceOf(buyer.address))).to.equal(38n);
  });

  it("reverts real oversubscription beyond final-stage dust tolerance", async function () {
    const { buyer, presale } = await deployFixture();

    await presale.connect(buyer).buy(FULL_STAGE_RAISE - 38n);
    await expect(presale.connect(buyer).buy(77n)).to.be.revertedWithCustomError(presale, "SoldOut");
  });

  it("reverts with AlreadyFinalized on repeated finalize", async function () {
    const { owner, buyer, presale } = await deployFixture();

    await presale.connect(buyer).buy(FULL_STAGE_RAISE);
    await presale.connect(owner).finalize();
    await expect(presale.connect(owner).finalize()).to.be.revertedWithCustomError(presale, "AlreadyFinalized");
  });

  it("vests buyer claims: 50 percent immediately, 75 percent after 45 days, 100 percent after 90 days", async function () {
    const { owner, buyer, skip, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(SOFTCAP_WITH_DUST_BUFFER);
    const purchasedAmount = (await presale.getUserInfo(buyer.address)).purchased;
    await time.increaseTo(end + 1);
    await presale.connect(owner).finalize();
    const vestingStart = await presale.vestingStart();

    expect(await presale.claimable(buyer.address)).to.equal(purchasedAmount / 2n);
    await expect(presale.connect(buyer).claim()).to.emit(presale, "Claimed");
    expect(await presale.claimedAmount(buyer.address)).to.be.closeTo(purchasedAmount / 2n, SKIP("100000"));

    await time.increaseTo(vestingStart + BigInt(45 * DAY));
    const expectedAt45 = (purchasedAmount * 75n) / 100n;
    expect(await presale.claimable(buyer.address)).to.be.closeTo(expectedAt45 - (await presale.claimedAmount(buyer.address)), SKIP("100000"));
    await presale.connect(buyer).claim();
    expect(await presale.claimedAmount(buyer.address)).to.be.closeTo(expectedAt45, SKIP("100000"));

    await time.increaseTo(vestingStart + BigInt(90 * DAY));
    expect(await presale.claimable(buyer.address)).to.equal(purchasedAmount - (await presale.claimedAmount(buyer.address)));
    await presale.connect(buyer).claim();
    expect(await presale.claimedAmount(buyer.address)).to.equal(purchasedAmount);
    expect(await skip.balanceOf(buyer.address)).to.equal(purchasedAmount);
    await expect(presale.connect(buyer).claim()).to.be.revertedWithCustomError(presale, "NothingToClaim");
  });

  it("claim is blocked before finalize and during refund mode", async function () {
    const { owner, buyer, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(USDC("1000"));
    await expect(presale.connect(buyer).claim()).to.be.revertedWithCustomError(presale, "ClaimNotEnabled");
    await time.increaseTo(end + 1);
    await presale.connect(owner).finalize();
    expect((await presale.getPresaleInfo()).refundEnabled).to.equal(true);
    await expect(presale.connect(buyer).claim()).to.be.revertedWithCustomError(presale, "ClaimNotEnabled");
  });

  it("allows remaining funds withdrawal only after successful finalize", async function () {
    const { owner, buyer, treasury, usdc, presale, end } = await deployFixture();

    await presale.connect(buyer).buy(SOFTCAP_WITH_DUST_BUFFER);
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

    await presale.connect(buyer).buy(SOFTCAP_WITH_DUST_BUFFER);
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
