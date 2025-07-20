import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  "pk_test_51RinIyC24XB4jGbR54BRNISol1W7NOLeVGuJrkb7sFic4VkmvKH4NdayHPFpFBfQyM5k4MAJtIPKpdvljLg2JHqV00tvuCVP8R"
);

export default stripePromise;
