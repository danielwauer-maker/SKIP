// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SkipPresale is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stage {
        uint256 tokenCap;
        uint256 sold;
        uint256 priceUsdc;
    }

    struct UserInfo {
        uint256 contributed;
        uint256 purchased;
        uint256 claimable;
        uint256 refundable;
        bool hasClaimed;
    }

    struct PresaleInfo {
        uint256 totalRaised;
        uint256 totalSold;
        uint256 softCap;
        uint256 hardCap;
        uint256 currentStage;
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        bool claimEnabled;
        bool refundEnabled;
        uint256 developmentWithdrawn;
        uint256 maxDevelopmentWithdrawable;
        uint256 completedStageRaised;
    }

    IERC20 public immutable skipToken;
    IERC20 public immutable usdc;
    uint256 public immutable startTime;
    uint256 public immutable endTime;
    uint256 public constant SOFT_CAP = 250_000 * 1e6;
    uint256 public constant HARD_CAP = 3_720_000 * 1e6;
    uint256 public constant STAGE_TOKEN_CAP = 20_000_000_000 * 1e18;
    uint256 public constant DEVELOPMENT_BPS = 2_500;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant IMMEDIATE_CLAIM_BPS = 5_000;
    uint256 public constant BUYER_VESTING_DURATION = 90 days;

    Stage[] private stages;
    mapping(address => uint256) public contributed;
    mapping(address => uint256) public purchased;
    mapping(address => uint256) public claimed;
    mapping(address => bool) public hasRefunded;

    uint256 public totalRaised;
    uint256 public totalSold;
    uint256 public totalClaimed;
    uint256 public developmentWithdrawn;
    uint256 public vestingStart;
    bool public finalized;
    bool public claimEnabled;
    bool public refundEnabled;

    event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 skipAmount);
    event Claimed(address indexed user, uint256 amount);
    event Refunded(address indexed user, uint256 amount);
    event Finalized(bool successful, bool refundEnabled);
    event DevelopmentFundsWithdrawn(address indexed to, uint256 amount);
    event DevelopmentFundsRepaid(address indexed from, uint256 amount);
    event RemainingFundsWithdrawn(address indexed to, uint256 amount);
    event UnsoldTokensWithdrawn(address indexed to, uint256 amount);

    error PresaleNotStarted();
    error PresaleEnded();
    error PresaleStillActive();
    error InvalidAmount();
    error HardCapExceeded();
    error SoldOut();
    error NotFinalized();
    error ClaimNotEnabled();
    error RefundNotEnabled();
    error NothingToClaim();
    error NothingToRefund();
    error AlreadyClaimed();
    error AlreadyRefunded();
    error SoftCapNotReached();
    error SoftCapReached();
    error InsufficientRefundLiquidity();
    error InvalidRecipient();

    constructor(address skipToken_, address usdc_, uint256 startTime_, uint256 endTime_, address initialOwner)
        Ownable(initialOwner)
    {
        require(skipToken_ != address(0) && usdc_ != address(0) && initialOwner != address(0), "zero address");
        require(startTime_ < endTime_, "invalid time");
        skipToken = IERC20(skipToken_);
        usdc = IERC20(usdc_);
        startTime = startTime_;
        endTime = endTime_;

        uint256[12] memory prices = [
            uint256(4),
            uint256(5),
            uint256(6),
            uint256(8),
            uint256(9),
            uint256(11),
            uint256(13),
            uint256(16),
            uint256(20),
            uint256(25),
            uint256(31),
            uint256(38)
        ];

        for (uint256 i = 0; i < prices.length; i++) {
            stages.push(Stage({tokenCap: STAGE_TOKEN_CAP, sold: 0, priceUsdc: prices[i]}));
        }
    }

    function buy(uint256 usdcAmount) external nonReentrant whenNotPaused {
        if (block.timestamp < startTime) revert PresaleNotStarted();
        if (block.timestamp > endTime) revert PresaleEnded();
        if (usdcAmount == 0) revert InvalidAmount();
        if (totalRaised + usdcAmount > HARD_CAP) revert HardCapExceeded();

        uint256 tokensToBuy = _quote(usdcAmount);
        if (tokensToBuy == 0) revert InvalidAmount();

        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        contributed[msg.sender] += usdcAmount;
        purchased[msg.sender] += tokensToBuy;
        totalRaised += usdcAmount;
        totalSold += tokensToBuy;

        emit TokensPurchased(msg.sender, usdcAmount, tokensToBuy);
    }

    function claim() external nonReentrant {
        if (!claimEnabled) revert ClaimNotEnabled();
        uint256 amount = claimable(msg.sender);
        if (amount == 0) revert NothingToClaim();

        claimed[msg.sender] += amount;
        totalClaimed += amount;
        skipToken.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    function refund() external nonReentrant {
        if (!refundEnabled) revert RefundNotEnabled();
        if (hasRefunded[msg.sender]) revert AlreadyRefunded();
        uint256 amount = contributed[msg.sender];
        if (amount == 0) revert NothingToRefund();

        hasRefunded[msg.sender] = true;
        contributed[msg.sender] = 0;
        purchased[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, amount);
        emit Refunded(msg.sender, amount);
    }

    function finalize() external onlyOwner {
        if (finalized) revert NotFinalized();
        if (block.timestamp <= endTime && totalRaised < HARD_CAP && !allStagesSoldOut()) revert PresaleStillActive();

        finalized = true;
        if (totalRaised >= SOFT_CAP) {
            claimEnabled = true;
            vestingStart = block.timestamp;
            emit Finalized(true, false);
            return;
        }

        if (usdc.balanceOf(address(this)) >= totalRaised) {
            refundEnabled = true;
            emit Finalized(false, true);
            return;
        }

        emit Finalized(false, false);
    }

    function withdrawDevelopmentFunds(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidRecipient();
        uint256 amount = maxDevelopmentWithdrawable();
        if (amount == 0) revert InvalidAmount();
        developmentWithdrawn += amount;
        usdc.safeTransfer(to, amount);
        emit DevelopmentFundsWithdrawn(to, amount);
    }

    function repayDevelopmentFunds(uint256 amount) external nonReentrant {
        if (amount == 0 || amount > developmentWithdrawn) revert InvalidAmount();
        developmentWithdrawn -= amount;
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit DevelopmentFundsRepaid(msg.sender, amount);

        if (finalized && totalRaised < SOFT_CAP && usdc.balanceOf(address(this)) >= totalRaised) {
            refundEnabled = true;
        }
    }

    function withdrawRemainingFunds(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidRecipient();
        if (!finalized) revert NotFinalized();
        if (totalRaised < SOFT_CAP) revert SoftCapNotReached();
        uint256 amount = usdc.balanceOf(address(this));
        if (amount == 0) revert InvalidAmount();
        usdc.safeTransfer(to, amount);
        emit RemainingFundsWithdrawn(to, amount);
    }

    function withdrawUnsoldTokens(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidRecipient();
        if (!finalized) revert NotFinalized();
        uint256 requiredForClaims = claimEnabled ? totalSold - totalClaimed : 0;
        uint256 balance = skipToken.balanceOf(address(this));
        if (balance <= requiredForClaims) revert InvalidAmount();
        uint256 unsold = balance - requiredForClaims;
        skipToken.safeTransfer(to, unsold);
        emit UnsoldTokensWithdrawn(to, unsold);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getCurrentStage() public view returns (uint256) {
        for (uint256 i = 0; i < stages.length; i++) {
            if (stages[i].sold < stages[i].tokenCap) {
                return i;
            }
        }
        return stages.length - 1;
    }

    function allStagesSoldOut() public view returns (bool) {
        for (uint256 i = 0; i < stages.length; i++) {
            if (stages[i].sold < stages[i].tokenCap) {
                return false;
            }
        }
        return true;
    }

    function getStagesCount() external view returns (uint256) {
        return stages.length;
    }

    function getStage(uint256 index) external view returns (uint256 tokenCap, uint256 sold, uint256 priceUsdc) {
        Stage memory stage = stages[index];
        return (stage.tokenCap, stage.sold, stage.priceUsdc);
    }

    function getUserInfo(address user) external view returns (UserInfo memory) {
        uint256 userPurchased = purchased[user];
        uint256 userContributed = contributed[user];
        return UserInfo({
            contributed: userContributed,
            purchased: userPurchased,
            claimable: claimable(user),
            refundable: refundEnabled && !hasRefunded[user] ? userContributed : 0,
            hasClaimed: userPurchased > 0 && claimed[user] >= userPurchased
        });
    }

    function getPresaleInfo() external view returns (PresaleInfo memory) {
        return PresaleInfo({
            totalRaised: totalRaised,
            totalSold: totalSold,
            softCap: SOFT_CAP,
            hardCap: HARD_CAP,
            currentStage: getCurrentStage(),
            startTime: startTime,
            endTime: endTime,
            finalized: finalized,
            claimEnabled: claimEnabled,
            refundEnabled: refundEnabled,
            developmentWithdrawn: developmentWithdrawn,
            maxDevelopmentWithdrawable: maxDevelopmentWithdrawable(),
            completedStageRaised: completedStageRaised()
        });
    }

    function completedStageRaised() public view returns (uint256 raised) {
        for (uint256 i = 0; i < stages.length; i++) {
            if (stages[i].sold >= stages[i].tokenCap) {
                raised += (stages[i].tokenCap * stages[i].priceUsdc) / 1e18;
            }
        }
    }

    function totalStageRaise() public view returns (uint256 raised) {
        for (uint256 i = 0; i < stages.length; i++) {
            raised += (stages[i].tokenCap * stages[i].priceUsdc) / 1e18;
        }
    }

    function maxDevelopmentWithdrawable() public view returns (uint256) {
        uint256 allowance = (completedStageRaised() * DEVELOPMENT_BPS) / BPS_DENOMINATOR;
        if (allowance <= developmentWithdrawn) {
            return 0;
        }
        uint256 available = allowance - developmentWithdrawn;
        uint256 balance = usdc.balanceOf(address(this));
        return available > balance ? balance : available;
    }

    function previewTokens(uint256 usdcAmount) external view returns (uint256) {
        return _previewTokens(usdcAmount);
    }

    function claimable(address user) public view returns (uint256) {
        if (!claimEnabled || purchased[user] == 0) {
            return 0;
        }

        uint256 totalPurchased = purchased[user];
        uint256 immediate = (totalPurchased * IMMEDIATE_CLAIM_BPS) / BPS_DENOMINATOR;
        uint256 vestedHalf = totalPurchased - immediate;
        uint256 elapsed = block.timestamp > vestingStart ? block.timestamp - vestingStart : 0;
        uint256 vested = elapsed >= BUYER_VESTING_DURATION
            ? vestedHalf
            : (vestedHalf * elapsed) / BUYER_VESTING_DURATION;
        uint256 unlocked = immediate + vested;

        if (unlocked <= claimed[user]) {
            return 0;
        }
        return unlocked - claimed[user];
    }

    function claimedAmount(address user) external view returns (uint256) {
        return claimed[user];
    }

    function _quote(uint256 usdcAmount) internal returns (uint256 tokensOut) {
        uint256 remainingUsdc = usdcAmount;
        for (uint256 i = 0; i < stages.length && remainingUsdc > 0; i++) {
            Stage storage stage = stages[i];
            if (stage.sold >= stage.tokenCap) continue;

            uint256 remainingTokens = stage.tokenCap - stage.sold;
            uint256 affordableTokens = (remainingUsdc * 1e18) / stage.priceUsdc;
            uint256 tokensForStage = affordableTokens > remainingTokens ? remainingTokens : affordableTokens;
            if (tokensForStage == 0) break;

            uint256 usdcUsed = (tokensForStage * stage.priceUsdc) / 1e18;
            stage.sold += tokensForStage;
            tokensOut += tokensForStage;
            remainingUsdc -= usdcUsed;
        }

        if (remainingUsdc > 0) revert SoldOut();
    }

    function _previewTokens(uint256 usdcAmount) internal view returns (uint256 tokensOut) {
        uint256 remainingUsdc = usdcAmount;
        for (uint256 i = 0; i < stages.length && remainingUsdc > 0; i++) {
            Stage memory stage = stages[i];
            if (stage.sold >= stage.tokenCap) continue;

            uint256 remainingTokens = stage.tokenCap - stage.sold;
            uint256 affordableTokens = (remainingUsdc * 1e18) / stage.priceUsdc;
            uint256 tokensForStage = affordableTokens > remainingTokens ? remainingTokens : affordableTokens;
            if (tokensForStage == 0) break;

            uint256 usdcUsed = (tokensForStage * stage.priceUsdc) / 1e18;
            tokensOut += tokensForStage;
            remainingUsdc -= usdcUsed;
        }
    }
}
