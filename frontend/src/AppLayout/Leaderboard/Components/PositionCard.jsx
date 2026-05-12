import React from "react";
import VerifiedBadge from "../../Dashboard/Components/VerifiedBadge";

function PositionCard({
  position = 1,
  username,
  userpfp,
  role,
  trophies = 0,
  analyses = 0,
  reviews = 0,
  avgScore = 0,
}) {
  const accent =
    position === 1
      ? "bg-toxic"
      : position === 2
        ? "bg-gray-400"
        : position === 3
          ? "bg-gray-600"
          : "bg-transparent";

  return (
    <div
      className="
        animate-fade-up
        relative
        w-full
        bg-obsidian
        border
        border-phantom
        rounded-md
        px-5
        py-3
        flex
        items-center
        justify-between
        transition-all
        duration-200
        hover:border-toxic
      "
    >
      {/* Accent Strip */}
      <div className={`absolute left-0 top-0 h-full w-[3px] ${accent}`} />

      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="w-8 text-sm font-mono text-gray-600">#{position}</div>

        <img
          src={userpfp}
          alt={username}
          className="w-10 h-10 rounded-full border border-phantom object-cover"
        />

        <div className="text-sm font-mono uppercase tracking-wider text-gray-800">
          {username}
        </div>
        <VerifiedBadge role={role} size={14} />
      </div>

      {/* Right Stats */}
      <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-gray-600">
        <div>
          Reputation <span className="text-gray-800">{trophies}</span>
        </div>

        <div>
          Analyses <span className="text-gray-800">{analyses}</span>
        </div>

        <div>
          Reviews <span className="text-gray-800">{reviews}</span>
        </div>

        <div>
          Average <span className="text-toxic">{avgScore}</span>
        </div>
      </div>
    </div>
  );
}

export default PositionCard;
