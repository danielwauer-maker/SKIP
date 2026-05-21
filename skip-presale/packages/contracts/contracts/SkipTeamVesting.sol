// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SkipTeamVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public immutable startTime;
    uint256 public constant CLIFF_DURATION = 365 days;
    uint256 public constant VESTING_DURATION = 730 days;

    address public beneficiary;
    uint256 public released;

    event TokensReleased(address indexed beneficiary, uint256 amount);
    event BeneficiaryUpdated(address indexed previousBeneficiary, address indexed newBeneficiary);

    error ZeroAddress();
    error NothingToRelease();

    constructor(address token_, address beneficiary_, uint256 startTime_, address initialOwner) Ownable(initialOwner) {
        if (token_ == address(0) || beneficiary_ == address(0) || initialOwner == address(0)) revert ZeroAddress();
        token = IERC20(token_);
        beneficiary = beneficiary_;
        startTime = startTime_;
    }

    function updateBeneficiary(address newBeneficiary) external onlyOwner {
        if (newBeneficiary == address(0)) revert ZeroAddress();
        address previous = beneficiary;
        beneficiary = newBeneficiary;
        emit BeneficiaryUpdated(previous, newBeneficiary);
    }

    function release() external nonReentrant {
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit TokensReleased(beneficiary, amount);
    }

    function releasable() public view returns (uint256) {
        uint256 vested = vestedAmount();
        if (vested <= released) {
            return 0;
        }
        return vested - released;
    }

    function vestedAmount() public view returns (uint256) {
        uint256 totalAllocation = token.balanceOf(address(this)) + released;
        uint256 cliffEnd = startTime + CLIFF_DURATION;

        if (block.timestamp < cliffEnd) {
            return 0;
        }

        uint256 elapsedAfterCliff = block.timestamp - cliffEnd;
        if (elapsedAfterCliff >= VESTING_DURATION) {
            return totalAllocation;
        }

        return (totalAllocation * elapsedAfterCliff) / VESTING_DURATION;
    }
}
