import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Logo from "../public/logo.png";

export default function ThankYou() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/saveOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <main
      style={{
        backgroundColor: "#f1f8fc",
        fontFamily: "Lato, sans-serif",
        padding: "4rem 2rem",
        textAlign: "center",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        <Image src={Logo} alt="Inkylink Logo" width={70} height={70} />
        <h1 style={{ fontSize: "3.5rem", marginLeft: "1rem" }}>Inkylink</h1>
      </header>

      {submitted ? (
        <>
          <h2 style={{ fontSize: "2rem", color: "#333" }}>
            Thank you! Your intake has been received.
          </h2>
          <p style={{ fontSize: "1.1rem", margin: "1rem 0", color: "#444" }}>
            We're reviewing your info now. If you included notes, we'll be sure to follow them closely!
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "2rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            ← Return to Homepage
          </button>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: "2.2rem", marginBottom: "1.5rem", color: "#333" }}>
            Thank you so much for your order!
          </h2>

          <p
            style={{
              fontSize: "1.2rem",
              maxWidth: "600px",
              margin: "0 auto 2.5rem",
              lineHeight: "1.8",
              color: "#444",
            }}
          >
            We’re genuinely excited to get started on your content, and thank you for your patronage. Your request just hit our inbox,
            and we’re already prepping to bring your ideas to life. If you have anything special to
            add, feel free to reach out — or just fill out the form below.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              textAlign: "left",
              background: "#fff",
              padding: "2rem",
              borderRadius: "0.75rem",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)",
            }}
          >
            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span style={{ display: "block", fontWeight: "bold" }}>Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "1rem" }}>
              <span style={{ display: "block", fontWeight: "bold" }}>Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #ccc",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "1.5rem" }}>
              <span style={{ display: "block", fontWeight: "bold" }}>Special Instructions (optional)</span>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              />
            </label>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Submit Intake
            </button>
          </form>
        </>
      )}
    </main>
  );
}
