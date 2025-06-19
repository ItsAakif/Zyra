import { ethers } from 'ethers';

// Zyro Token Contract ABI (simplified)
const ZYRO_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  private zyroContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.EXPO_PUBLIC_WEB3_PROVIDER_URL);
    this.zyroContract = new ethers.Contract(
      process.env.EXPO_PUBLIC_ZYRO_CONTRACT_ADDRESS!,
      ZYRO_ABI,
      this.provider
    );
  }

  async getZyroBalance(address: string): Promise<number> {
    try {
      const balance = await this.zyroContract.balanceOf(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting Zyro balance:', error);
      return 0;
    }
  }

  async mintZyroReward(address: string, amount: number): Promise<string | null> {
    try {
      // This would require a private key for the minting wallet
      // In production, this should be done on the backend
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await this.zyroContract.mint(address, amountWei);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error minting Zyro reward:', error);
      return null;
    }
  }

  async transferZyro(from: string, to: string, amount: number, privateKey: string): Promise<string | null> {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);
      const contract = this.zyroContract.connect(wallet);
      const amountWei = ethers.parseEther(amount.toString());
      const tx = await contract.transfer(to, amountWei);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error transferring Zyro:', error);
      return null;
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      console.error('Error getting gas price:', error);
      return BigInt(0);
    }
  }

  formatEther(value: bigint): string {
    return ethers.formatEther(value);
  }

  parseEther(value: string): bigint {
    return ethers.parseEther(value);
  }
}

export const web3Service = new Web3Service();