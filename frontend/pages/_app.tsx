import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../contexts/AuthContext'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>FashionFusion - AI-Powered Fashion Design</title>
        <meta name="description" content="Create stunning fashion designs with AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#1f2937', color: '#f9fafb', borderRadius: '12px' },
          success: {
            duration: 3000,
            iconTheme: { primary: '#34d399', secondary: '#fff' },
          },
          error: {
            duration: 5000,
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  )
}