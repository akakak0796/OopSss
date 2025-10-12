# OopSss - SocialFi GameFi Snake Game

A browser-based, OopSss.io-inspired multiplayer snake game integrated with blockchain for SocialFi (decentralized social features) and GameFi (play-to-earn) mechanics on U2U Solaris Mainnet.

## 🔗 **Live Links & Contract**

### **🌐 Live Application**
- **Play Now**: [https://oopsss.vercel.app](https://oopsss.vercel.app)
- **Network**: U2U Solaris Mainnet (Chain ID: 39)
- **Status**: ✅ Live and Playable

### **📄 Smart Contract**
- **Contract Address**: `0x5B60CF7edCCc82350C223eF591a4C951d64e74EF`
- **Token Symbol**: $ST (OopSss Token)
- **Network**: U2U Solaris Mainnet
- **Explorer**: [View on U2U Explorer](https://u2uscan.xyz/address/0x5B60CF7edCCc82350C223eF591a4C951d64e74EF)
- **ABI**: Available in `src/contracts/SnakeToken.json`

## 🎮 Features

### Gameplay Mechanics
- **Snake Control**: Mouse steering (PC) or arrow keys (keyboard)
- **AI Opponents**: 6 computer-controlled snakes to compete against
- **Objective**: Collect food to grow and avoid AI snakes
- **Rewards**: Earn 1 $ST per food item collected
- **Entry Fee**: Pay 1 $ST per match
- **Game Over**: Touching AI snake ends game immediately

### Blockchain Integration ($ST Token)
- **Custom ERC-20 Token**: $ST (OopSss Token) on U2U Solaris Mainnet
- **Entry Fees**: 1 $ST per match
- **Food Rewards**: 1 $ST per food item collected
- **Daily Login**: 2 $ST base reward + streak bonuses
- **Leaderboard Rewards**: Bonus $ST for top performers

### SocialFi Elements
- **Wallet-based Profiles**: Customizable snake skins
- **Daily Login Rewards**: Encouraging retention with streak bonuses
- **Leaderboards**: Daily/weekly rankings with bonus rewards
- **Community Challenges**: Collective goals for bonus $ST pools

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd oopsss
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
   ```

4. **Run the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Play

### Controls
- **PC**: 
  - Mouse: Steer snake (follows cursor)
  - Arrow Keys: Speed boost (costs $ST)
  - Space: Temporary speed boost
- **Mobile**: 
  - Finger swipes: Direction control
  - Tap: Speed boost

### Game Flow
1. **Connect Wallet**: Connect your U2U Solaris Mainnet wallet
2. **Claim Daily Reward**: Get 2 $ST daily login bonus
3. **Enter Match**: Pay 1 $ST entry fee
4. **Play**: Survive as long as possible
5. **Earn**: Receive $ST based on survival time
6. **Compete**: Climb the leaderboards

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Game Engine**: Phaser.js 3.90.0
- **Styling**: Tailwind CSS
- **Wallet Integration**: RainbowKit + Wagmi
- **State Management**: React hooks

### Blockchain
- **Network**: U2U Solaris Mainnet
- **Token Standard**: ERC-20
- **Smart Contracts**: 
  - `OopSssToken.sol`: Token management and rewards
  - `OopSssGame.sol`: Game logic and leaderboards
- **Integration**: Web3.js + Viem

### Smart Contracts

#### OopSssToken.sol
- ERC-20 token with game-specific features
- Daily login rewards with streak bonuses
- Entry fee management
- Survival reward distribution

#### OopSssGame.sol
- Game session management
- Leaderboard tracking
- Player statistics
- Reward calculations

## 🎨 Game Assets

The game uses simple colored rectangles for MVP:
- **Player Snake**: Green rectangle
- **Bot Snakes**: Red rectangles
- **Orbs**: Yellow rectangles
- **Background**: Black canvas

*Note: In production, these would be replaced with proper game sprites and animations.*

## 📱 Mobile Support

- **Responsive Design**: Works on all screen sizes
- **Touch Controls**: Finger swipe navigation
- **Mobile Wallet**: MetaMask mobile app support
- **Performance**: Optimized for mobile devices

## 🔧 Development

### Project Structure
```
oopsss/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── page.tsx        # Landing page
│   │   ├── leaderboard/    # Leaderboard page
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── Game.tsx        # Phaser game component
│   │   └── Leaderboard.tsx # Leaderboard component
│   ├── hooks/              # Custom hooks
│   │   └── useOopSssToken.ts # Blockchain integration
│   └── app/
│       ├── providers.tsx   # Wallet providers
│       └── globals.css     # Global styles
├── contracts/              # Smart contracts
│   ├── OopSssToken.sol   # Token contract
│   └── OopSssGame.sol    # Game contract
└── public/                # Static assets
```

### Available Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint

## 🚀 Deployment

### Frontend Deployment
1. Build the application:
   ```bash
   bun run build
   ```

2. Deploy to your preferred platform:
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS Amplify
   - Self-hosted

### Smart Contract Deployment
1. Deploy to U2U Solaris Mainnet using Hardhat or Remix
2. Update contract addresses in `src/hooks/useOopSssToken.ts`
3. Verify contracts on U2U Explorer

## 🎯 Roadmap

### Phase 1 (MVP) ✅
- [x] Basic snake game mechanics
- [x] Wallet integration
- [x] $ST token system
- [x] Daily rewards
- [x] Leaderboards

### Phase 2 (Enhancement)
- [ ] NFT snake skins
- [ ] Multiplayer real-time gameplay
- [ ] Tournament system
- [ ] Advanced leaderboard rewards
- [ ] Social features

### Phase 3 (Advanced)
- [ ] Cross-chain support
- [ ] Governance token
- [ ] Staking mechanisms
- [ ] Mobile app
- [ ] Advanced game modes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README
- **Issues**: Create a GitHub issue
- **Discord**: Join our community server
- **Twitter**: Follow for updates

## 🙏 Acknowledgments

- **Phaser.js**: Game engine
- **RainbowKit**: Wallet integration
- **U2U Network**: Blockchain infrastructure
- **OpenZeppelin**: Smart contract libraries

---

**OopSss** - Where gaming meets blockchain! 🐍⚡