// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/interfaces/IERC20.sol";

contract MonSignal is IERC20 {
    string public constant name = "MonSignal";
    string public constant symbol = "MONSIG";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    // Faucet function - anyone can mint 1000 tokens
    function faucet() external {
        uint256 amount = 1000 * 10 ** decimals;
        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        emit Transfer(address(0), msg.sender, amount);
    }
}
