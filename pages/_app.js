import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <SessionProvider session={session}>
      {getLayout(<Component {...pageProps} />)}
    </SessionProvider>
  );
}

export default MyApp; 