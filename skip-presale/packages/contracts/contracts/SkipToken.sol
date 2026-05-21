// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SkipToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000 * 1e18;

    constructor(address initialOwner) ERC20("SKIP", "SKIP") Ownable(initialOwner) {
        _mint(initialOwner, MAX_SUPPLY);
    }
}
