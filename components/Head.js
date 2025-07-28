// components/Head.js

import Head from 'next/head';

export default function CustomHead({ title = "Inkylink" }) {
  return (
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Professional product content services by Inkylink." />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
