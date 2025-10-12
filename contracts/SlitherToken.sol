// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SlitherToken ($ST)
 * @dev ERC-20 token for SlitherFi game rewards
 */
contract SlitherToken is ERC20, Ownable, Pausable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M tokens
    uint256 public constant DAILY_REWARD = 2 * 10**18; // 2 $ST per day
    uint256 public constant ENTRY_FEE = 5 * 10**18; // 5 $ST entry fee
    uint256 public constant REWARD_PER_SECOND = 1 * 10**17; // 0.1 $ST per second (1 $ST per 10 seconds)
    
    // Daily login tracking
    mapping(address => uint256) public lastLoginTime;
    mapping(address => uint256) public loginStreak;
    
    // Game rewards tracking
    mapping(address => uint256) public totalEarned;
    mapping(address => uint256) public gamesPlayed;
    
    // Events
    event DailyRewardClaimed(address indexed player, uint256 amount, uint256 streak);
    event GameRewardEarned(address indexed player, uint256 survivalTime, uint256 reward);
    event EntryFeePaid(address indexed player, uint256 amount);
    
    constructor() ERC20("Slither Token", "ST") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Claim daily login reward
     */
    function claimDailyReward() external whenNotPaused {
        require(canClaimDailyReward(msg.sender), "Daily reward already claimed today");
        
        uint256 reward = DAILY_REWARD;
        uint256 currentStreak = getCurrentStreak(msg.sender);
        
        // Streak bonus: +1 $ST for every 7 days
        reward += (currentStreak / 7) * 10**18;
        
        lastLoginTime[msg.sender] = block.timestamp;
        loginStreak[msg.sender] = currentStreak + 1;
        
        _mint(msg.sender, reward);
        
        emit DailyRewardClaimed(msg.sender, reward, currentStreak + 1);
    }
    
    /**
     * @dev Pay entry fee for a game
     */
    function payEntryFee() external whenNotPaused {
        require(balanceOf(msg.sender) >= ENTRY_FEE, "Insufficient balance for entry fee");
        
        _transfer(msg.sender, address(this), ENTRY_FEE);
        gamesPlayed[msg.sender]++;
        
        emit EntryFeePaid(msg.sender, ENTRY_FEE);
    }
    
    /**
     * @dev Award survival reward to player
     * @param player The player address
     * @param survivalTime Time survived in seconds
     */
    function awardSurvivalReward(address player, uint256 survivalTime) external onlyOwner {
        uint256 reward = (survivalTime * REWARD_PER_SECOND) / 10**18;
        
        if (reward > 0) {
            _mint(player, reward);
            totalEarned[player] += reward;
            
            emit GameRewardEarned(player, survivalTime, reward);
        }
    }
    
    /**
     * @dev Check if player can claim daily reward
     */
    function canClaimDailyReward(address player) public view returns (bool) {
        if (lastLoginTime[player] == 0) return true;
        
        uint256 lastLogin = lastLoginTime[player];
        uint256 currentDay = block.timestamp / 1 days;
        uint256 lastLoginDay = lastLogin / 1 days;
        
        return currentDay > lastLoginDay;
    }
    
    /**
     * @dev Get current login streak for player
     */
    function getCurrentStreak(address player) public view returns (uint256) {
        if (lastLoginTime[player] == 0) return 0;
        
        uint256 lastLogin = lastLoginTime[player];
        uint256 currentDay = block.timestamp / 1 days;
        uint256 lastLoginDay = lastLogin / 1 days;
        
        if (currentDay - lastLoginDay == 1) {
            return loginStreak[player];
        } else if (currentDay - lastLoginDay > 1) {
            return 0; // Streak broken
        } else {
            return loginStreak[player];
        }
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 balance,
        uint256 totalEarnedAmount,
        uint256 gamesPlayedCount,
        uint256 currentStreak,
        bool canClaimToday
    ) {
        return (
            balanceOf(player),
            totalEarned[player],
            gamesPlayed[player],
            getCurrentStreak(player),
            canClaimDailyReward(player)
        );
    }
    
    /**
     * @dev Pause contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Withdraw entry fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = balanceOf(address(this));
        _transfer(address(this), owner(), balance);
    }
}
