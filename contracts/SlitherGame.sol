// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SlitherToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SlitherGame
 * @dev Main game contract managing matches and leaderboards
 */
contract SlitherGame is Ownable, Pausable {
    SlitherToken public immutable slitherToken;
    
    // Game constants
    uint256 public constant ENTRY_FEE = 5 * 10**18; // 5 $ST
    uint256 public constant REWARD_PER_SECOND = 1 * 10**17; // 0.1 $ST per second
    
    // Game state
    struct GameSession {
        address player;
        uint256 startTime;
        uint256 endTime;
        uint256 survivalTime;
        uint256 reward;
        bool completed;
    }
    
    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 timestamp;
    }
    
    // Storage
    mapping(uint256 => GameSession) public gameSessions;
    mapping(address => uint256[]) public playerGames;
    mapping(address => uint256) public playerBestScore;
    
    LeaderboardEntry[] public dailyLeaderboard;
    LeaderboardEntry[] public weeklyLeaderboard;
    
    uint256 public currentGameId;
    uint256 public lastLeaderboardUpdate;
    
    // Events
    event GameStarted(uint256 indexed gameId, address indexed player);
    event GameEnded(uint256 indexed gameId, address indexed player, uint256 survivalTime, uint256 reward);
    event LeaderboardUpdated(address indexed player, uint256 score, uint256 rank);
    
    constructor(address _slitherToken) {
        slitherToken = SlitherToken(_slitherToken);
        lastLeaderboardUpdate = block.timestamp;
    }
    
    /**
     * @dev Start a new game session
     */
    function startGame() external whenNotPaused {
        require(slitherToken.balanceOf(msg.sender) >= ENTRY_FEE, "Insufficient balance");
        
        // Pay entry fee
        slitherToken.payEntryFee();
        
        // Create game session
        currentGameId++;
        gameSessions[currentGameId] = GameSession({
            player: msg.sender,
            startTime: block.timestamp,
            endTime: 0,
            survivalTime: 0,
            reward: 0,
            completed: false
        });
        
        playerGames[msg.sender].push(currentGameId);
        
        emit GameStarted(currentGameId, msg.sender);
    }
    
    /**
     * @dev End a game session and calculate rewards
     * @param gameId The game session ID
     * @param survivalTime Time survived in seconds
     */
    function endGame(uint256 gameId, uint256 survivalTime) external whenNotPaused {
        GameSession storage session = gameSessions[gameId];
        require(session.player == msg.sender, "Not your game");
        require(!session.completed, "Game already completed");
        
        session.endTime = block.timestamp;
        session.survivalTime = survivalTime;
        session.completed = true;
        
        // Calculate reward
        uint256 reward = (survivalTime * REWARD_PER_SECOND) / 10**18;
        session.reward = reward;
        
        // Award tokens
        if (reward > 0) {
            slitherToken.awardSurvivalReward(msg.sender, survivalTime);
        }
        
        // Update player best score
        if (survivalTime > playerBestScore[msg.sender]) {
            playerBestScore[msg.sender] = survivalTime;
        }
        
        // Update leaderboards
        _updateLeaderboards(msg.sender, survivalTime);
        
        emit GameEnded(gameId, msg.sender, survivalTime, reward);
    }
    
    /**
     * @dev Update leaderboards
     */
    function _updateLeaderboards(address player, uint256 score) internal {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentWeek = block.timestamp / (7 days);
        
        // Update daily leaderboard
        _addToLeaderboard(dailyLeaderboard, player, score, currentDay);
        
        // Update weekly leaderboard
        _addToLeaderboard(weeklyLeaderboard, player, score, currentWeek);
        
        // Clean old entries (keep only last 7 days for daily, 4 weeks for weekly)
        _cleanLeaderboard(dailyLeaderboard, 7);
        _cleanLeaderboard(weeklyLeaderboard, 28);
    }
    
    /**
     * @dev Add entry to leaderboard
     */
    function _addToLeaderboard(
        LeaderboardEntry[] storage leaderboard,
        address player,
        uint256 score,
        uint256 period
    ) internal {
        // Check if player already has entry for this period
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player && 
                leaderboard[i].timestamp / (leaderboard == dailyLeaderboard ? 1 days : 7 days) == period) {
                // Update existing entry if score is better
                if (score > leaderboard[i].score) {
                    leaderboard[i].score = score;
                    leaderboard[i].timestamp = block.timestamp;
                }
                return;
            }
        }
        
        // Add new entry
        leaderboard.push(LeaderboardEntry({
            player: player,
            score: score,
            timestamp: block.timestamp
        }));
        
        // Sort leaderboard (simple bubble sort for small arrays)
        _sortLeaderboard(leaderboard);
    }
    
    /**
     * @dev Sort leaderboard by score (descending)
     */
    function _sortLeaderboard(LeaderboardEntry[] storage leaderboard) internal {
        for (uint256 i = 0; i < leaderboard.length - 1; i++) {
            for (uint256 j = 0; j < leaderboard.length - i - 1; j++) {
                if (leaderboard[j].score < leaderboard[j + 1].score) {
                    LeaderboardEntry memory temp = leaderboard[j];
                    leaderboard[j] = leaderboard[j + 1];
                    leaderboard[j + 1] = temp;
                }
            }
        }
    }
    
    /**
     * @dev Clean old leaderboard entries
     */
    function _cleanLeaderboard(LeaderboardEntry[] storage leaderboard, uint256 maxAge) internal {
        uint256 cutoffTime = block.timestamp - (maxAge * 1 days);
        
        for (uint256 i = leaderboard.length; i > 0; i--) {
            if (leaderboard[i - 1].timestamp < cutoffTime) {
                // Remove old entry
                for (uint256 j = i - 1; j < leaderboard.length - 1; j++) {
                    leaderboard[j] = leaderboard[j + 1];
                }
                leaderboard.pop();
            }
        }
    }
    
    /**
     * @dev Get daily leaderboard
     */
    function getDailyLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return dailyLeaderboard;
    }
    
    /**
     * @dev Get weekly leaderboard
     */
    function getWeeklyLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return weeklyLeaderboard;
    }
    
    /**
     * @dev Get player's game history
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    /**
     * @dev Get game session details
     */
    function getGameSession(uint256 gameId) external view returns (GameSession memory) {
        return gameSessions[gameId];
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player) external view returns (
        uint256 bestScore,
        uint256 totalGames,
        uint256 dailyRank,
        uint256 weeklyRank
    ) {
        bestScore = playerBestScore[player];
        totalGames = playerGames[player].length;
        
        // Calculate ranks
        dailyRank = _getPlayerRank(dailyLeaderboard, player);
        weeklyRank = _getPlayerRank(weeklyLeaderboard, player);
    }
    
    /**
     * @dev Get player rank in leaderboard
     */
    function _getPlayerRank(LeaderboardEntry[] storage leaderboard, address player) internal view returns (uint256) {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                return i + 1;
            }
        }
        return 0; // Not found
    }
    
    /**
     * @dev Pause contract
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
}
