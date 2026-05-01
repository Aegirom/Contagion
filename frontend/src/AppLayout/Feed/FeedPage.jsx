import React, { useState } from "react";
import FeedCard from "./components/FeedCard";

const FeedPage = () => {
  const [sortBy, setSortBy] = useState("hot");

  const posts = [
    {
      id: 1,
      user: "MalwareHunter",
      location: "Kiev, Ukraine",
      hash: "7f3ab9c1d2e4",
      family: "Emotet",
      threat: "CRITICAL",
      status: "Completed",
      date: "2 HOURS AGO",
      score: 94,
      comments: 12,
      caption:
        "Just found this Emotet variant in a phishing campaign. Stay safe everyone!",
    },
    {
      id: 2,
      user: "CyberGuardian",
      location: "Berlin, Germany",
      hash: "a1b2c3d4e5f6",
      family: "AsyncRAT",
      threat: "HIGH",
      status: "Analyzing",
      date: "4 HOURS AGO",
      score: 81,
      comments: 5,
      caption:
        "New AsyncRAT sample spotted. Seems to be targeting financial institutions.",
    },
    {
      id: 3,
      user: "Infosec_Joe",
      location: "New York, USA",
      hash: "f9e8d7c6b5a4",
      family: "Mirai Botnet",
      threat: "HIGH",
      status: "Peer Review",
      date: "6 HOURS AGO",
      score: 77,
      comments: 24,
      caption:
        "Massive Mirai botnet activity detected. Re-analyzing the payload.",
    },
    {
      id: 4,
      user: "RansomAware",
      location: "London, UK",
      hash: "3c4d5e6f7a8b",
      family: "LockBit 3.0",
      threat: "CRITICAL",
      status: "Completed",
      date: "1 DAY AGO",
      score: 98,
      comments: 42,
      caption:
        "LockBit 3.0 is getting more sophisticated. Check out the encryption routine.",
    },
  ];

  const sortOptions = [
    {
      key: "hot",
      label: "Hot",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      ),
    },
    {
      key: "new",
      label: "New",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "top",
      label: "Top",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
  ];

  return (
    <main className="flex-1 overflow-auto relative z-10">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Sort Tabs */}
        <div
          className="flex items-center gap-2 mb-6 p-2 rounded-xl"
          style={{
            background: "rgba(12,13,20,0.8)",
            border: "1px solid rgba(30,34,51,0.8)",
          }}
        >
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-code text-xs uppercase tracking-wider transition-all"
              style={{
                background:
                  sortBy === option.key ? "rgba(34,197,94,0.1)" : "transparent",
                color: sortBy === option.key ? "#22C55E" : "#64748B",
                border:
                  sortBy === option.key
                    ? "1px solid rgba(34,197,94,0.2)"
                    : "1px solid transparent",
              }}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {/* Feed List */}
        <div className="space-y-2">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default FeedPage;
