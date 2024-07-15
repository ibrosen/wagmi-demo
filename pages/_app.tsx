import type {AppProps} from 'next/app';

import '../styles/globals.css';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {NextPage} from 'next';
import type {ReactElement, ReactNode} from 'react';
import {http} from 'viem';
import {mainnet, sepolia} from 'viem/chains';

import type {
  ConnectedWallet,
  PrivyClientConfig,
  User,
  WalletWithMetadata,
} from '@privy-io/react-auth';
import {PrivyProvider} from '@privy-io/react-auth';
import {WagmiProvider, createConfig} from '@privy-io/wagmi';

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const privyConfig: PrivyClientConfig = {
  legal: {
    termsAndConditionsUrl: 'https://support.zora.co/en/articles/6383293-terms-of-service',
    privacyPolicyUrl: 'https://support.zora.co/en/articles/6383373-zora-privacy-policy',
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: true,
    noPromptOnSignature: false,
  },
  externalWallets: {
    coinbaseWallet: {
      connectionOptions: 'all',
    },
  },
  loginMethods: ['wallet', 'email'],
  appearance: {
    showWalletLoginFirst: true,
    logo: '/assets/signup/privy-zorb.png',
    accentColor: '#000000',
  },
};

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

export default function MyApp({Component, pageProps}: AppPropsWithLayout) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PageComponent = Component as any;

  const setActiveWalletForWagmi = ({
    wallets,
    user,
  }: {
    wallets: ConnectedWallet[];
    user: User | null;
  }) => {
    if (!user) {
      return wallets.filter((w) => w.walletClientType !== 'embedded')[0];
    }
    // All wallets linked to the signed in user
    const linkedWallets = user.linkedAccounts.filter(
      (account) => account.type === 'wallet',
    ) as WalletWithMetadata[];

    // Wallets linked to the signed in user and connected
    const linkedConnectedWallets = wallets.filter((wallet) =>
      linkedWallets.some((authWallet) => authWallet.address === wallet.address),
    );

    // Linked to signed in user + connected + "external" (non-embedded)
    const linkedConnectedExternalWallets = linkedConnectedWallets.filter(
      (wallet) => wallet.walletClientType !== 'privy',
    );

    // Connected + "external" (could be linked or unlinked to signed in user)
    const connectedExternalWallets = wallets.filter(
      (wallet) => wallet.walletClientType !== 'privy',
    );

    // If the user has linked an external wallet, only return external wallets
    // Implicitly if there are no connected external wallets for this user, return
    // either the first connected external wallet not tied to the user, or nothing
    // instead of returning the privy embedded wallet
    if (linkedWallets.find((wallet) => wallet.walletClientType !== 'privy')) {
      return linkedConnectedExternalWallets[0] ?? connectedExternalWallets[0];
    }

    // If the user has no verified connected external wallets, return the embedded wallet
    return linkedConnectedWallets[0];
  };

  return (
    <html lang="en">
      <body>
        <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string} config={privyConfig}>
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig} setActiveWalletForWagmi={setActiveWalletForWagmi}>
              <PageComponent {...pageProps} />
            </WagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
        hello
      </body>
    </html>
  );
}
