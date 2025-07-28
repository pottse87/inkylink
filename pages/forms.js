import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function IntakeForm() {
  const router = useRouter();
  const { bundles } = router.query;

  const [formData, setFormData] = useState({
    productName: "",
    features: "",
    audience: "",
    questions: "",
    answers: "",
    customer_email: "",
  });

  useEffect(() => {
    if (!bundles || bundles.length === 0) {
      router.replace("/pricing");
    }
  }, [bundles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      productName: formData.productName,
      features: formData.features.split(",").map((f) => f.trim()),
      audience: formData.audience,
      questions: formData.questions.split("\n").map((q) => q.trim()),
      answers: formData.answers.split("\n").map((a) => a.trim()),
      customer_email: formData.customer_email,
      submitted_at: new Date().toISOString(),
      bundle_ids: JSON.parse(bundles),
    };

    const res = await fetch("/api/saveForm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Form submitted successfully!");
      router.push("/thank-you");
    } else {
      alert("Submission failed.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
      <h1>Client Intake Form</h1>
      <form onSubmit={handleSubmit}>
        <label>Product Name</label>
        <input
          type="text"
          name="productName"
          value={formData.productName}
          onChange={handleChange}
          required
        />

        <label>Key Features (comma-separated)</label>
        <input
          type="text"
          name="features"
          value={formData.features}
          onChange={handleChange}
          required
        />

        <label>Target Audience</label>
        <input
          type="text"
          name="audience"
          value={formData.audience}
          onChange={handleChange}
          required
        />

        <label>Common Customer Questions (one per line)</label>
        <textarea
          name="questions"
          rows={3}
          value={formData.questions}
          onChange={handleChange}
        />

        <label>Detailed Answers (one per line)</label>
        <textarea
          name="answers"
          rows={3}
          value={formData.answers}
          onChange={handleChange}
        />

        <label>Customer Email</label>
        <input
          type="email"
          name="customer_email"
          value={formData.customer_email}
          onChange={handleChange}
          required
        />

        <button type="submit" style={{ marginTop: "1rem" }}>
          Submit
        </button>
      </form>
    </div>
  );
}
