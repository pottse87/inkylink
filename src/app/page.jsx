
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function InkyLinkLandingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <motion.h1
        className="text-4xl md:text-6xl font-bold text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Welcome to InkyLink
      </motion.h1>

      <motion.p
        className="text-center text-lg md:text-xl max-w-xl mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Playful. Artsy. Inky. We craft SEO-powered product descriptions that spark curiosity & drive sales.
      </motion.p>

      <div className="w-full max-w-md shadow-xl p-6 space-y-4 bg-gray-100 rounded-2xl">
        <h2 className="text-2xl font-semibold text-center">Let's Get Connected</h2>
        <input
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
        <button className="w-full bg-black text-white py-2 rounded-lg">Notify Me</button>
      </div>

      <motion.div
        className="mt-10 text-center text-gray-600 max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="mb-2">"Words that move people." Let your products stand out with descriptions designed to engage and convert.</p>
      </motion.div>

      <footer className="mt-16 text-gray-400 text-sm text-center">
        © 2025 InkyLink. All rights reserved.
      </footer>
    </div>
  );
}
