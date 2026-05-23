import type { Chain } from "viem";

export const hardhatLocal = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"]
    },
    public: {
      http: ["http://127.0.0.1:8545"]
    }
  },
  testnet: true
} as const satisfies Chain;

export const polygonAmoy = {
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-amoy.polygon.technology"]
    },
    public: {
      http: ["https://rpc-amoy.polygon.technology"]
    }
  },
  blockExplorers: {
    default: {
      name: "PolygonScan",
      url: "https://amoy.polygonscan.com"
    }
  },
  testnet: true
} as const satisfies Chain;

export const polygon = {
  id: 137,
  name: "Polygon",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://polygon-rpc.com"]
    },
    public: {
      http: ["https://polygon-rpc.com"]
    }
  },
  blockExplorers: {
    default: {
      name: "PolygonScan",
      url: "https://polygonscan.com"
    }
  }
} as const satisfies Chain;

export const supportedChains = [
  hardhatLocal,
  polygonAmoy,
  polygon
] as const;

export const targetChainId = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID || hardhatLocal.id
);

export const targetChain =
  supportedChains.find((chain) => chain.id === targetChainId) ||
  hardhatLocal;