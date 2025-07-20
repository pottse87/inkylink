// config/stripe-config-pricing.js

const pricingOptions = {
  subscriptions: [
    {
      id: "starter-monthly",
      name: "",
      description: "Perfect for small shops and starters",
      price: 29,
      yearlyPrice: 290,
      icon: "/starter.png",
    },
    {
      id: "growth-monthly",
      name: "",
      description: "Built for stores starting to scale",
      price: 59,
      yearlyPrice: 590,
      icon: "/growth plan.png",
    },
    {
      id: "pro-monthly",
      name: "",
      description: "Advanced tools for fast-growing brands",
      price: 99,
      yearlyPrice: 990,
      icon: "/pro plan.png",
    },
    {
      id: "elite-monthly",
      name: "",
      description: "Everything you need to dominate your niche",
      price: 149,
      yearlyPrice: 1490,
      icon: "/elite plan.png",
    },
  ],
};

export default pricingOptions;
